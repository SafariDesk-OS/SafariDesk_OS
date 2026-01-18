"""
Celery task for sending email replies from the activity stream.
Supports To/CC/BCC, mailbox selection, and email threading.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone
from django.utils.html import linebreaks

from tenant.models import (
    EmailMessageRecord,
    MailIntegration,
    SettingSMTP,
    Ticket,
    TicketComment,
)
from tenant.models.SettingModel import EmailSettings
from util.mail.mailgun import send_mailgun_message

logger = logging.getLogger(__name__)


def _get_mailbox_for_reply(
    ticket: Ticket,
    mailbox_id: Optional[int] = None,
) -> tuple[Optional[MailIntegration], str, str]:
    """
    Determine which mailbox to send from.
    
    Priority:
    1. Explicit mailbox_id from request
    2. Original integration (if ticket source = email)
    3. Default connected mailbox
    4. System SMTP fallback
    
    Returns: (integration, from_email, provider)
    """
    
    # 1. Explicit mailbox selection
    if mailbox_id:
        integration = MailIntegration.objects.filter(
            id=mailbox_id,
            is_active=True,
            connection_status=MailIntegration.ConnectionStatus.CONNECTED,
        ).first()
        if integration:
            from_email = integration.email_address or integration.forwarding_address
            return integration, from_email, integration.provider
    
    # 2. Original integration for email-sourced tickets
    if ticket.source == "email":
        msg_record = (
            EmailMessageRecord.objects.filter(
                ticket=ticket,
                direction=EmailMessageRecord.Direction.INCOMING,
            )
            .select_related("integration")
            .order_by("-received_at")
            .first()
        )
        if msg_record and msg_record.integration:
            integration = msg_record.integration
            from_email = integration.email_address or integration.forwarding_address
            return integration, from_email, integration.provider
    
    # 3. Default connected mailbox
    integration = MailIntegration.objects.filter(
        is_active=True,
        connection_status=MailIntegration.ConnectionStatus.CONNECTED,
        direction__in=[MailIntegration.Direction.BOTH, MailIntegration.Direction.OUTGOING],
    ).first()
    if integration:
        from_email = integration.email_address or integration.forwarding_address
        return integration, from_email, integration.provider
    
    # 4. Fallback to SMTP settings
    smtp = SettingSMTP.objects.first()
    if smtp:
        from_email = (
            f"{smtp.sender_name} <{smtp.default_from_email}>"
            if smtp.sender_name
            else smtp.default_from_email
        )
        return None, from_email, "smtp"
    
    # 5. System default
    default_name = getattr(settings, "DEFAULT_FROM_NAME", None)
    default_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@safaridesk.io")
    from_email = f"{default_name} <{default_email}>" if default_name else default_email
    return None, from_email, "smtp"


def _get_threading_headers(ticket: Ticket) -> dict:
    """Get In-Reply-To and References headers for email threading."""
    headers = {}
    if ticket.source == "email":
        msg_record = (
            EmailMessageRecord.objects.filter(
                ticket=ticket,
                direction=EmailMessageRecord.Direction.INCOMING,
            )
            .order_by("-received_at")
            .first()
        )
        if msg_record and msg_record.message_id:
            headers["In-Reply-To"] = msg_record.message_id
            headers["References"] = msg_record.message_id
    return headers


def _generate_message_id(domain: str = "safaridesk.io") -> str:
    """Generate a unique Message-ID for outgoing emails."""
    return f"<{uuid.uuid4()}@{domain}>"


def _get_email_settings() -> EmailSettings:
    """Get or create email settings."""
    email_settings, _ = EmailSettings.objects.get_or_create()
    return email_settings


def _format_email_with_signature(
    content: str,
    ticket: Ticket,
    email_settings: EmailSettings,
) -> tuple[str, str]:
    """
    Format email content with signature.
    
    Returns: (plain_text, html_body)
    """
    
    # Build plain text email
    lines = [content.strip()]
        
    # Add signature
    signature_name = email_settings.get_signature_name()
    signature_greeting = email_settings.signature_greeting or "Regards,"
    
    lines.append("")
    lines.append(signature_greeting)
    lines.append(signature_name)
    
    plain_text = "\n".join(lines)
    
    # Build HTML (simple linebreaks for threading compatibility)
    if email_settings.use_plain_text:
        # Minimal HTML - just linebreaks
        html_body = linebreaks(plain_text)
    else:
        # More formatted HTML
        html_body = linebreaks(plain_text)
    
    return plain_text, html_body


@shared_task
def send_email_reply_task(
    ticket_id: int,
    comment_id: int,
    to: list[str],
    cc: Optional[list[str]] = None,
    bcc: Optional[list[str]] = None,
    mailbox_id: Optional[int] = None,
    subject: Optional[str] = None,
) -> dict:
    """
    Send an email reply for a ticket comment with signature.
    
    Args:
        ticket_id: The ticket ID
        comment_id: The comment ID containing the reply content
        to: List of recipient emails
        cc: Optional CC recipients
        bcc: Optional BCC recipients
        mailbox_id: Optional specific mailbox to send from
        subject: Optional custom subject (auto-generated if not provided)
    
    Returns:
        dict with success status and email_record_id
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        comment = TicketComment.objects.get(id=comment_id)
    except (Ticket.DoesNotExist, TicketComment.DoesNotExist) as e:
        logger.error(f"send_email_reply_task failed: {e}")
        return {"success": False, "error": str(e)}
    
    # Get mailbox and from email
    integration, from_email, provider = _get_mailbox_for_reply(ticket, mailbox_id)
    
    # Generate subject if not provided
    if not subject:
        subject = f"Re: [{ticket.ticket_id}] {ticket.title}"
    
    # Get email settings and format content with signature
    email_settings = _get_email_settings(ticket.business)
    plain_text, html_body = _format_email_with_signature(
        comment.content, ticket, email_settings
    )
    
    # Get threading headers
    extra_headers = _get_threading_headers(ticket)
    message_id = _generate_message_id()
    extra_headers["Message-ID"] = message_id
    
    # Send via appropriate provider
    sent = False
    if provider == MailIntegration.Provider.SAFARIDESK and settings.MAILGUN_API_KEY:
        # Use Mailgun API
        sent = send_mailgun_message(
            to=to,
            cc=cc,
            bcc=bcc,
            subject=subject,
            text=plain_text,
            html=html_body,
            from_email=from_email,
            headers=extra_headers,
        )
    else:
        # Use SMTP
        try:
            if integration and integration.smtp_host:
                # Use integration's SMTP settings
                connection = get_connection(
                    host=integration.smtp_host,
                    port=integration.smtp_port or 587,
                    username=integration.get_secret("smtp_username"),
                    password=integration.get_secret("smtp_password"),
                    use_tls=integration.smtp_use_tls,
                    use_ssl=integration.smtp_use_ssl,
                )
            else:
                # Use default Django SMTP
                connection = get_connection()
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=from_email,
                to=to,
                cc=cc or [],
                bcc=bcc or [],
                connection=connection,
                headers=extra_headers,
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
            sent = True
        except Exception as e:
            logger.error(f"SMTP send failed for ticket {ticket_id}: {e}")
            sent = False
    
    if not sent:
        return {"success": False, "error": "Email sending failed"}
    
    # Create EmailMessageRecord for outgoing email
    email_record = EmailMessageRecord.objects.create(
        integration=integration,
        business=ticket.business,
        ticket=ticket,
        message_id=message_id,
        direction=EmailMessageRecord.Direction.OUTGOING,
        subject=subject[:512],
        sender=from_email,
        recipient=", ".join(to),
        raw_headers=extra_headers,
        raw_body=plain_text,
        html_body=html_body,
        received_at=timezone.now(),
    )
    
    logger.info(
        "email_reply_sent",
        extra={
            "ticket_id": ticket_id,
            "comment_id": comment_id,
            "to": to,
            "cc": cc,
            "provider": provider,
            "email_record_id": email_record.id,
        },
    )
    
    return {"success": True, "email_record_id": email_record.id}

