from celery import shared_task
from tenant.models import Requests, Ticket, Task
from util.Mailer import Mailer
from util.email.parser import TemplateParser
from util.email.templates import get_system_template
import logging

logger = logging.getLogger(__name__)
mailer = Mailer()

def _send_request_notification(request_id, template_name, recipient_email, ticket_id=None, task_id=None):
    """
    Helper function to send request-related notifications.
    """
    try:
        request_obj = Requests.objects.get(id=request_id)
        template = get_system_template(template_name)

        if not template:
            logger.error(f"Email template '{template_name}' not found in system templates")
            return

        objects = {"request": request_obj}

        # Add related ticket or task if available
        if ticket_id:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
                objects["ticket"] = ticket
            except Ticket.DoesNotExist:
                logger.error(f"Ticket with id {ticket_id} not found.")
        elif task_id:
            try:
                task = Task.objects.get(id=task_id)
                objects["task"] = task
            except Task.DoesNotExist:
                logger.error(f"Task with id {task_id} not found.")

        # Add additional context for conversion emails that templates expect
        additional_context = {}
        if ticket_id:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
                additional_context.update({
                    "ticket_id": ticket.ticket_id,
                    "priority": ticket.priority,
                    "department_name": ticket.department.name if ticket.department else "General",
                })
            except Ticket.DoesNotExist:
                pass
        elif task_id:
            try:
                task = Task.objects.get(id=task_id)
                additional_context.update({
                    "task_id": task.task_trackid,
                    "priority": task.priority,
                    "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else "TBD",
                    "department_name": task.department.name if task.department else "General",
                })
            except Task.DoesNotExist:
                pass

        parser = TemplateParser(objects=objects)
        context = parser.build_context(template)
        context.update(additional_context)

        mailer.send_templated_email(
            template=template,
            context=context,
            receiver_email=recipient_email,
            business=request_obj.business,
        )
        logger.info(f"Successfully sent '{template_name}' notification for request {request_id} to {recipient_email}")

    except Requests.DoesNotExist:
        logger.error(f"Request with id {request_id} not found.")
    except Exception as e:
        logger.error(f"Error sending request notification for request {request_id}: {e}", exc_info=True)


@shared_task
def request_created_acknowledgment(request_id):
    """
    Send acknowledgment email to the request creator when a request is created.
    """
    request_obj = Requests.objects.get(id=request_id)
    _send_request_notification(request_id, "NEW_REQUEST_ACKNOWLEDGMENT", request_obj.creator_email)


@shared_task
def request_created_admin_notification(request_id):
    """
    Send notification to admin when a new request is created.
    """
    request_obj = Requests.objects.get(id=request_id)

    # Get all admin users for the business
    admin_users = request_obj.business.get_admins()  # Assuming this method exists

    for admin in admin_users:
        _send_request_notification(request_id, "NEW_REQUEST_ADMIN_ALERT", admin.email)


@shared_task
def request_converted_to_ticket_notification(request_id, ticket_id):
    """
    Send notification to department when request is converted to ticket.
    """
    request_obj = Requests.objects.get(id=request_id)

    # Get all department members
    if request_obj.department:
        for member in request_obj.department.get_members():
            _send_request_notification(request_id, "REQUEST_CONVERTED_TO_TICKET", member.email, ticket_id=ticket_id)

    # Also notify the original request creator
    if request_obj.creator_email:
        _send_request_notification(request_id, "REQUEST_CONVERTED_TO_TICKET", request_obj.creator_email, ticket_id=ticket_id)


@shared_task
def request_converted_to_task_notification(request_id, task_id):
    """
    Send notification to department when request is converted to task.
    """
    request_obj = Requests.objects.get(id=request_id)

    # Get all department members
    if request_obj.department:
        for member in request_obj.department.get_members():
            _send_request_notification(request_id, "REQUEST_CONVERTED_TO_TASK", member.email, task_id=task_id)

    # Also notify the original request creator
    if request_obj.creator_email:
        _send_request_notification(request_id, "REQUEST_CONVERTED_TO_TASK", request_obj.creator_email, task_id=task_id)


@shared_task
def request_approved_notification(request_id):
    """
    Send notification when request is approved.
    """
    request_obj = Requests.objects.get(id=request_id)

    # Notify the original request creator
    if request_obj.creator_email:
        _send_request_notification(request_id, "REQUEST_APPROVED", request_obj.creator_email)


@shared_task
def request_status_update_notification(request_id, target_email):
    """
    Send status update notification for requests (can be used for various updates).
    """
    _send_request_notification(request_id, "REQUEST_STATUS_UPDATE", target_email)
