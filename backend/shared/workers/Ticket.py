from celery import shared_task
from tenant.models import Ticket, TicketComment
from util.Mailer import Mailer
from util.email.parser import TemplateParser
from util.email.templates import get_system_template
import logging
from tenant.models import EmailMessageRecord, MailIntegration
from email.header import decode_header

logger = logging.getLogger(__name__)
mailer = Mailer()

def _send_ticket_notification(ticket_id, template_name, recipient_email, comment_id=None):
    """
    Helper function to send ticket-related notifications.
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        template = get_system_template(template_name)

        if not template:
            logger.error(f"Email template '{template_name}' not found in system templates")
            return

        objects = {"ticket": ticket}
        if comment_id:
            try:
                comment = TicketComment.objects.get(id=comment_id)
                objects["comment"] = comment
            except TicketComment.DoesNotExist:
                logger.error(f"Comment with id {comment_id} not found.")
        
        parser = TemplateParser(objects=objects)
        context = parser.build_context(template)
        # decode any encoded names in context
        def _decode_name(val: str) -> str:
            try:
                parts = decode_header(val)
                decoded = "".join(
                    [t[0].decode(t[1] or "utf-8") if isinstance(t[0], bytes) else str(t[0]) for t in parts]
                )
                return decoded
            except Exception:
                return val or ""
        if context.get("creator_name"):
            context["creator_name"] = _decode_name(context["creator_name"])
        if context.get("agent_name"):
            context["agent_name"] = _decode_name(context["agent_name"])
        if comment_id and context.get("agent_response"):
            context["agent_response"] = context["agent_response"]
        if "url" not in context or not context.get("url"):
            context["url"] = ticket.business.support_url or ""

        # Threading + From selection for email-originated tickets
        extra_headers = {}
        from_email_override = None
        if ticket.source == "email":
            msg_record = (
                EmailMessageRecord.objects.filter(ticket=ticket, direction=EmailMessageRecord.Direction.INCOMING)
                .order_by("-received_at")
                .first()
            )
            if msg_record:
                original_msg_id = msg_record.message_id
                if original_msg_id:
                    extra_headers["In-Reply-To"] = original_msg_id
                    extra_headers["References"] = original_msg_id
                integration = msg_record.integration
                if isinstance(integration, MailIntegration):
                    from_email_override = integration.email_address or integration.forwarding_address or None

        mailer.send_templated_email(
            template=template,
            context=context,
            receiver_email=recipient_email,
            business=ticket.business,
            from_email_override=from_email_override,
            extra_headers=extra_headers,
        )
        logger.info(f"Successfully sent '{template_name}' notification for ticket {ticket_id} to {recipient_email}")

    except Ticket.DoesNotExist:
        logger.error(f"Ticket with id {ticket_id} not found.")
    except Exception as e:
        logger.error(f"Error sending ticket notification for ticket {ticket_id}: {e}", exc_info=True)


@shared_task
def ticket_created_customer_notification(ticket_id):
    ticket = Ticket.objects.get(id=ticket_id)
    _send_ticket_notification(ticket_id, "NEW_TICKET_AUTO_REPLY", ticket.creator_email)

@shared_task
def ticket_created_agent_notification(ticket_id):
    ticket = Ticket.objects.get(id=ticket_id)
    # Notify all members of the department
    for member in ticket.department.get_members():
         _send_ticket_notification(ticket_id, "NEW_TICKET_ALERT", member.email)

@shared_task
def ticket_assigned_notification(ticket_id):
    # DISABLED: Activity notifications are turned off
    # ticket = Ticket.objects.get(id=ticket_id)
    # 
    # # 1. Notify the assigned agent specifically
    # if ticket.assigned_to:
    #     _send_ticket_notification(ticket_id, "TICKET_ASSIGNMENT_ALERT", ticket.assigned_to.email)
    #
    # # 2. Notify department members and watchers of the activity
    # other_recipients = set()
    # for member in ticket.department.get_members():
    #     other_recipients.add(member.email)
    # for watcher in ticket.watchers.all():
    #     other_recipients.add(watcher.watcher.email)
    #
    # # Remove the assigned agent to avoid double notification
    # if ticket.assigned_to:
    #     other_recipients.discard(ticket.assigned_to.email)
    #
    # for email in other_recipients:
    #     _send_ticket_notification(ticket_id, "NEW_ACTIVITY_NOTICE", email)
    pass

@shared_task
def ticket_status_changed_notification(ticket_id):
    # DISABLED: Activity notifications are turned off
    # ticket = Ticket.objects.get(id=ticket_id)
    # recipients = set([ticket.creator_email])
    #
    # # Add department members
    # for member in ticket.department.get_members():
    #     recipients.add(member.email)
    #
    # # Add watchers
    # for watcher in ticket.watchers.all():
    #     recipients.add(watcher.watcher.email)
    # 
    # for email in recipients:
    #     _send_ticket_notification(ticket_id, "NEW_ACTIVITY_NOTICE", email)
    pass


@shared_task
def ticket_reopened_notification(ticket_id):
    # DISABLED: Activity notifications are turned off
    # ticket = Ticket.objects.get(id=ticket_id)
    # recipients = set([ticket.creator_email])
    #
    # if ticket.assigned_to:
    #     recipients.add(ticket.assigned_to.email)
    #
    # # Add department members
    # for member in ticket.department.get_members():
    #     recipients.add(member.email)
    #
    # # Add watchers
    # for watcher in ticket.watchers.all():
    #     recipients.add(watcher.watcher.email)
    #
    # for email in recipients:
    #     _send_ticket_notification(ticket_id, "NEW_ACTIVITY_NOTICE", email)
    pass


@shared_task
def new_public_reply_customer_notification(ticket_id, comment_id):
    ticket = Ticket.objects.get(id=ticket_id)
    _send_ticket_notification(ticket_id, "RESPONSE_REPLY_TEMPLATE", ticket.creator_email, comment_id=comment_id)


@shared_task
def new_public_reply_agent_notification(ticket_id, comment_id):
    ticket = Ticket.objects.get(id=ticket_id)
    if ticket.assigned_to:
        _send_ticket_notification(ticket_id, "NEW_MESSAGE_ALERT", ticket.assigned_to.email, comment_id=comment_id)


@shared_task
def private_note_added_notification(ticket_id, comment_id):
    ticket = Ticket.objects.get(id=ticket_id)
    if ticket.assigned_to:
        _send_ticket_notification(ticket_id, "INTERNAL_ACTIVITY_ALERT", ticket.assigned_to.email, comment_id=comment_id)


@shared_task
def ticket_resolved_customer_notification(ticket_id):
    ticket = Ticket.objects.get(id=ticket_id)
    _send_ticket_notification(ticket_id, "SLA_RESOLVED_NOTICE", ticket.creator_email)


@shared_task
def ticket_closed_customer_notification(ticket_id):
    # DISABLED: Activity notifications are turned off
    # ticket = Ticket.objects.get(id=ticket_id)
    # _send_ticket_notification(ticket_id, "NEW_ACTIVITY_NOTICE", ticket.creator_email)
    pass

@shared_task
def ticket_claim_task(ticket_id):
    ticket = Ticket.objects.get(id=ticket_id)
    if ticket.assigned_to:
        _send_ticket_notification(ticket_id, "TICKET_ASSIGNMENT_ALERT", ticket.assigned_to.email)

@shared_task
def watcher_added_notification(ticket_id, user_id):
    # DISABLED: Activity notifications are turned off
    # from users.models import Users
    # user = Users.objects.get(id=user_id)
    # _send_ticket_notification(ticket_id, "NEW_ACTIVITY_NOTICE", user.email)
    pass
