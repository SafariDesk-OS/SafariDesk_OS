# services/email_service.py
import email
import imaplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.core.mail import send_mail

from tenant.models.TicketModel import EmailTicketMapping, Ticket, TicketComment
from users.models.UserModel import Users
from util.Helper import Helper

class EmailTicketService:
    def __init__(self):
        self.imap_server = settings.EMAIL_HOST
        self.email_user = settings.EMAIL_HOST_USER
        self.email_password = settings.EMAIL_HOST_PASSWORD
        
    def connect_to_email(self):
        """Connect to email server"""
        print("Connecting to email server...")
        if not self.imap_server or not self.email_user or not self.email_password:
            raise ValueError("Email server settings are not configured properly.")
        mail = imaplib.IMAP4_SSL(self.imap_server)
        mail.login(self.email_user, self.email_password)
        return mail
    
    def extract_ticket_id_from_subject(self, subject):
        """Extract ticket ID from email subject"""
        match = re.search(r'#(\d+)', subject)
        return int(match.group(1)) if match else None
    
    def parse_email_content(self, email_message):
        """Parse email content and extract text"""
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode('utf-8')
            return None
        else:
            return email_message.get_payload(decode=True).decode('utf-8')
    
    def create_ticket_from_email(self, email_message):
        """Create a new ticket from email"""
        subject = email_message['Subject']
        from_email = email_message['From']
        message_id = email_message['Message-ID']
        content = self.parse_email_content(email_message)
        
        # Try to get or create user
        user = None
        try:
            user = Users.objects.get(email=from_email)
        except Users.DoesNotExist:
            # Create user or handle anonymous tickets
            pass
        
        # Create ticket
        ticket = Ticket.objects.create(
            title=subject,
            description=content,
            creator_email=from_email,
            created_by=user,
            ticket_id=Helper().generate_incident_code(),
            source='email',  # Mark as email-created ticket
        )
        
        # Create email mapping
        EmailTicketMapping.objects.create(
            message_id=message_id,
            ticket=ticket
        )
        
        return ticket
    
    def add_comment_to_ticket(self, ticket_id, email_message):
        """Add email as comment to existing ticket"""
        from_email = email_message['From']
        message_id = email_message['Message-ID']
        content = self.parse_email_content(email_message)
        
        try:
            ticket = Ticket.objects.get(id=ticket_id)
            user = None
            try:
                user = Users.objects.get(email=from_email)
            except Users.DoesNotExist:
                pass
            
            comment = TicketComment.objects.create(
                ticket=ticket,
                content=content,
                author=user,
            )
            
            # Create email mapping
            EmailTicketMapping.objects.create(
                message_id=message_id,
                ticket=ticket
            )
            
            return comment
        except Ticket.DoesNotExist:
            return None
    
    def process_emails(self):
        """Main method to process incoming emails"""
        mail = self.connect_to_email()
        mail.select('INBOX')
        
        # Search for unread emails
        status, messages = mail.search(None, 'UNSEEN')
        
        for msg_id in messages[0].split():
            status, msg_data = mail.fetch(msg_id, '(RFC822)')
            email_message = email.message_from_bytes(msg_data[0][1])
            
            # Check if this email is already processed
            message_id = email_message['Message-ID']
            if EmailTicketMapping.objects.filter(message_id=message_id).exists():
                continue
            
            subject = email_message['Subject']
            ticket_id = self.extract_ticket_id_from_subject(subject)
            
            if ticket_id:
                # This is a reply to existing ticket
                self.add_comment_to_ticket(ticket_id, email_message)
            else:
                # This is a new ticket
                self.create_ticket_from_email(email_message)
            
            # Mark as read
            mail.store(msg_id, '+FLAGS', '\\Seen')
        
        mail.close()
        mail.logout()
    
    def send_ticket_notification(self, ticket, is_new=True):
        """Send email notification for ticket updates"""
        if is_new:
            subject = f"New Ticket Created: #{ticket.id} - {ticket.subject}"
            message = f"A new support ticket has been created:\n\nTicket ID: #{ticket.id}\nSubject: {ticket.subject}\nFrom: {ticket.email_from}\n\nDescription:\n{ticket.description}"
        else:
            subject = f"Ticket Updated: #{ticket.id} - {ticket.subject}"
            message = f"Ticket #{ticket.id} has been updated."

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [ticket.email_from],
            fail_silently=False,
        )

    def send_template_email(self, template_name, recipient_email, context, business):
        """
        Send email using template from EMAIL_TEMPLATES dictionary

        Args:
            template_name (str): Name of the template in EMAIL_TEMPLATES
            recipient_email (str): Email address of the recipient
            context (dict): Context variables for template rendering
            business: Business object for SMTP configuration

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            from util.email.templates import EMAIL_TEMPLATES
            from util.email.mappings import PLACEHOLDER_MAPPINGS
            from django.template import Template, Context
            from django.core.mail import EmailMultiAlternatives
            from django.utils.html import linebreaks
            from util.Mailer import Mailer

            # Get template from EMAIL_TEMPLATES
            if template_name not in EMAIL_TEMPLATES:
                print(f"Template {template_name} not found in EMAIL_TEMPLATES")
                return False

            template_data = EMAIL_TEMPLATES[template_name]

            # Get SMTP connection
            mailer = Mailer()
            connection, from_email = mailer.get_smtp_connection()

            # Create safe context dict
            class SafeDict(dict):
                def __missing__(self, key):
                    return ''

            safe_context = SafeDict(context)

            # Render subject and body
            subject_template = Template(template_data['subject'])
            body_template = Template(template_data['body'])

            subject = subject_template.render(Context(safe_context))
            body_text = body_template.render(Context(safe_context))
            body_html = linebreaks(body_text)

            # Create and send email
            email = EmailMultiAlternatives(
                subject=subject,
                body=body_text,
                from_email=from_email,
                to=[recipient_email],
                connection=connection
            )

            # Attach HTML version
            email.attach_alternative(body_html, "text/html")

            # Send email
            email.send(fail_silently=False)

            print(f"Template email '{template_name}' sent successfully to {recipient_email}")
            return True

        except Exception as e:
            print(f"Failed to send template email '{template_name}' to {recipient_email}: {str(e)}")
            return False
