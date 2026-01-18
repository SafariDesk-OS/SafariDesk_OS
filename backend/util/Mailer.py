import logging
from datetime import datetime, timezone

from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import linebreaks

from RNSafarideskBack import settings

from django.core.mail import get_connection
from django.conf import settings
from tenant.models import SettingSMTP, MailIntegration, EmailSettings
from django.template import Template, Context
from util.mail.mailgun import send_mailgun_message

logger = logging.getLogger(__name__)

class Mailer:

    def get_smtp_connection(self):
        """
            Returns a tuple: (
                SMTP connection,
                from_email string
                )
            Priority:
            1. Business-specific SMTP settings from the database.
            2. Django default EMAIL_* settings and DEFAULT_FROM_NAME.
        """
        smtp = SettingSMTP.objects.filter().first()
        if smtp:
            try:
                connection = get_connection(
                    host=smtp.host,
                    port=smtp.port,
                    username=smtp.username,
                    password=smtp.password,
                    use_tls=smtp.use_tls,
                    use_ssl=smtp.use_ssl
                )
                from_email = (
                    f"{smtp.sender_name} <{smtp.default_from_email}>"
                    if smtp.sender_name else smtp.default_from_email
                )
                return connection, from_email
            except Exception as e:
                logger.warning(f"[Mailer] Failed to use custom SMTP config for business: {e}")

        # Fallback to default Django settings
        try:
            connection = get_connection(
                host=settings.EMAIL_HOST,
                port=settings.EMAIL_PORT,
                username=settings.EMAIL_HOST_USER,
                password=settings.EMAIL_HOST_PASSWORD,
                use_tls=getattr(settings, 'EMAIL_USE_TLS', False),
                use_ssl=getattr(settings, 'EMAIL_USE_SSL', True),
            )
            default_name = getattr(settings, 'DEFAULT_FROM_NAME', None)
            default_email = settings.DEFAULT_FROM_EMAIL
            from_email = f"{default_name} <{default_email}>" if default_name else default_email
            return connection, from_email
        except Exception as e:
            logger.error(f"[Mailer] Failed to load fallback SMTP config: {e}")
            return get_connection(), settings.DEFAULT_FROM_EMAIL

    def send_templated_email(
        self,
        template,
        context: dict,
        business,
        receiver_email: str,
        *,
        from_email_override: str | None = None,
        extra_headers: dict | None = None,
    ):
        """
        Sends an email using a given template, business SMTP settings, and receiver.

        Args:
            template (EmailTemplate): The EmailTemplate instance.
            context (dict): Context values to replace placeholders in subject/body.
             for SMTP settings.
            receiver_email (str): The recipient email.
        """


        connection, from_email = self.get_smtp_connection()
        if from_email_override:
            from_email = from_email_override

        try:
            class SafeDict(dict):
                def __missing__(self, key):
                    return ''

            safe_context = SafeDict(context)

            subject_template = Template(template.subject)
            body_template = Template(template.body)

            subject = subject_template.render(Context(safe_context))
            body_text = body_template.render(Context(safe_context))
            plain_text_body = body_text.strip() or subject

            body_html = linebreaks(body_text)

            cta_url = (
                safe_context.get('cta_url')
                or safe_context.get('ticket_url')
                or safe_context.get('link')
                or safe_context.get('url')
            )
            cta_label = safe_context.get('cta_label') or ('View Ticket' if cta_url else None)
            support_text = safe_context.get('support_text')

            # Fetch email settings for signature
            email_settings = EmailSettings.objects.filter().first()

            html_body = render_to_string('email/base.html', {
                'business_name': getattr(business, 'name', 'SafariDesk'),
                'business_logo': getattr(business, 'logo_url', None),
                'headline': safe_context.get('email_headline') or subject,
                'body_html': body_html,
                'cta_url': cta_url,
                'cta_label': cta_label,
                'support_text': support_text,
                'signature_name': email_settings.get_signature_name() if email_settings else getattr(business, 'name', 'Support Team'),
                'signature_greeting': email_settings.signature_greeting if email_settings else 'Regards,',
            })
        except Exception as e:
            logger.error(f"[Mailer] Failed rendering email template {template.name}: {e}")
            return False

        # Attempt Mailgun for safaridesk aliases if available
        mg_integration = MailIntegration.objects.filter(
            
            provider=MailIntegration.Provider.SAFARIDESK,
            connection_status=MailIntegration.ConnectionStatus.CONNECTED,
        ).first()

        if mg_integration and settings.MAILGUN_API_KEY and settings.MAILGUN_DOMAIN:
            mg_from = from_email_override or f"support <{mg_integration.forwarding_address or mg_integration.email_address}>"
            sent = send_mailgun_message(
                to=receiver_email,
                subject=subject,
                text=plain_text_body,
                html=html_body,
                from_email=mg_from,
                headers=extra_headers or {},
            )
            if sent:
                logger.info(
                    "[Mailer] Sent via Mailgun (safaridesk alias) '%s' to %s for business %s",
                    template.name,
                    receiver_email,
                    business,
                )
                return True
            logger.warning("[Mailer] Mailgun send failed, falling back to SMTP for %s", receiver_email)

        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_text_body,
                from_email=from_email,
                to=[receiver_email],
                connection=connection,
                headers=extra_headers or {},
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
            logger.info(f"[Mailer] Sent email '{template.name}' to {receiver_email} for business {business}")
            return True
        except Exception as e:
            logger.error(f"[Mailer] Failed to send email '{template.name}' to {receiver_email}: {e}")
            return False


    def send_otp(self, otp, user_email):
        try:
            from users.models import Users

            print(f"Sending OTP: {otp} to {user_email}")
            logger.info(f"Sending OTP: {otp} to {user_email}")

            # Validate inputs
            if not otp or not user_email:
                logger.error("OTP or user email is missing")
                return False
                
            # Get user from database
            try:
                user = Users.objects.filter(email=user_email).first()
                
                if not user:
                    logger.error(f"User with email {user_email} not found")
                    return False
            except Exception as e:
                logger.error(f"Database error when fetching user {user_email}: {str(e)}")
                return False

            # Prepare email context
            try:
                context = {
                    'name': user.full_name() if hasattr(user, 'full_name') and callable(user.full_name) else 'User',
                    'otp_code': otp,
                    'expiry_minutes': 30,  # or whatever the expiry is
                    'ip_address': '',  # Add if available
                    'location': '',  # Add if available
                    'request_time': '',  # Add if available
                    'current_year': datetime.now().year,
                }
            except Exception as e:
                logger.error(f"Error preparing email context: {str(e)}")
                context = {
                    'name': 'User',
                    'otp': otp,
                }

            subject = "Your verification OTP"

            # Create plain text content
            plain_text_content = f"""
                Hi {context['name']},
                
                Your verification OTP is: {otp}
                
                This OTP will expire in a few minutes. Please use it to complete your verification.
                
                If you didn't request this OTP, please ignore this email.
                
                Best regards,
                Your Team
            """

            # Render HTML template
            try:
                html_content = render_to_string('otp.html', context)
            except Exception as e:
                logger.error(f"Error rendering HTML template: {str(e)}")
                # Fallback to plain text only
                html_content = None

            try:
                connection, from_email = self.get_smtp_connection()

                # Create email message
                email_message = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_text_content,
                    from_email=from_email,
                    to=[user_email],
                    connection=connection
                )

                # Attach HTML version if available
                if html_content:
                    email_message.attach_alternative(html_content, "text/html")

                # Send email
                email_message.send()
                
                logger.info(f"OTP email sent successfully to {user_email}")
                return True

            except Exception as e:
                logger.error(f"Failed to send OTP email to {user_email}: {str(e)}")
                return False
                
        except ImportError as e:
            logger.error(f"Import error in send_otp: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in send_otp: {str(e)}")
            return False

    def send_password_reset_link(self, link, user_email):
        try:
            from users.models import Users

            print(f"Sending password reset link to {user_email}")
            logger.info(f"Sending password reset link to {user_email}")

            # Validate inputs
            if not link or not user_email:
                logger.error("Reset link or user email is missing")
                return False

            # Get user from database
            try:
                user = Users.objects.filter(email=user_email).first()

                if not user:
                    logger.error(f"User with email {user_email} not found")
                    return False
            except Exception as e:
                logger.error(f"Database error when fetching user {user_email}: {str(e)}")
                return False

            # Prepare email context
            try:
                context = {
                    'name': user.full_name() if hasattr(user, 'full_name') and callable(user.full_name) else 'User',
                    'reset_link': link,
                    'company_name': getattr(user.business, 'name', 'Your Company') if hasattr(user,
                                                                                              'business') else 'Your Company',
                }
            except Exception as e:
                logger.error(f"Error preparing email context: {str(e)}")
                context = {
                    'name': 'User',
                    'reset_link': link,
                    'company_name': 'Your Company',
                }

            subject = "Password Reset Request"

            # Create plain text content
            plain_text_content = f"""
            Hi {context['name']},

            We received a request to reset your password. Click the link below to reset your password:

            {link}

            This link will expire in 15 minutes for security reasons.

            If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.

            Best regards,
            {context['company_name']} Team
            """

            # Render HTML template
            try:
                html_content = render_to_string('password-reset.html', context)
            except Exception as e:
                logger.error(f"Error rendering HTML template: {str(e)}")
                # Fallback to plain text only
                html_content = None

            try:
                connection, from_email = self.get_smtp_connection()

                # Create email message
                email_message = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_text_content,
                    from_email=from_email,
                    to=[user_email],
                    connection=connection
                )

                # Attach HTML version if available
                if html_content:
                    email_message.attach_alternative(html_content, "text/html")

                # Send email
                email_message.send()

                logger.info(f"Password reset email sent successfully to {user_email}")
                return True

            except Exception as e:
                logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
                return False

        except ImportError as e:
            logger.error(f"Import error in send_password_reset_link: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in send_password_reset_link: {str(e)}")
            return False
