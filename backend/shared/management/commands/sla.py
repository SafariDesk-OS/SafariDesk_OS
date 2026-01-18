from django.core.management.base import BaseCommand
from django.utils import timezone
import logging
# from users.models import Business  # Removed for single-tenant
from shared.workers.Sla import check_sla_for_business_task
from datetime import timedelta
from django.conf import settings
from util.Mailer import Mailer
from util.email.parser import TemplateParser
from util.email.templates import get_system_template

from tenant.models.SlaXModel import SLA, SLATarget, SLAEscalations, SLAViolation
from tenant.models.TicketModel import Ticket
from tenant.models.TaskModel import Task

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Monitor SLA compliance and trigger escalations for tickets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without sending actual notifications or making database changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        self.stdout.write('Starting SLA monitoring')


        # Removed business loop
            # Count active SLAs for this business
        active_sla_count = SLA.objects.filter(is_active=True).count()
        self.stdout.write(f"Queueing SLA check ({active_sla_count} active SLAs)")
        check_sla_for_business_task.delay(dry_run=dry_run)


    def monitor_items(self, items, item_type, dry_run):
        monitored_count = 0
        paused_count = 0
        escalations_triggered = 0
        violations_recorded = 0
        first_response_notifications = 0

        for item in items:
            monitored_count += 1
            item_id = item.ticket_id if item_type == 'Ticket' else item.task_trackid
            self.stdout.write(f"Checking SLA for {item_type} #{item_id} - {item.title}")

            if item.is_sla_paused:
                paused_count += 1
                self.stdout.write(f"SLA for {item_type} #{item_id} is paused. Skipping checks.")
                continue

            sla_status = item.get_sla_status()

            if sla_status and sla_status['has_sla']:
                if hasattr(item, 'check_sla_violations'):
                    new_violations = item.check_sla_violations()
                    violations_recorded += len(new_violations)

                # Check for first response breach notification (only for tickets not on hold)
                if item_type == 'Ticket' and item.status != 'hold':
                    first_response_sent = self.check_first_response_notification(item, sla_status, dry_run)
                    if first_response_sent:
                        first_response_notifications += 1

                triggered_escalations = self.check_escalations(item, sla_status, item_type, dry_run)
                escalations_triggered += triggered_escalations
            else:
                self.stdout.write(f"No active SLA found for {item_type} #{item_id}")

        self.stdout.write(
            self.style.SUCCESS(
                f'SLA monitoring for {item_type}s completed. '
                f'Monitored {monitored_count} {item_type.lower()}s, '
                f'{paused_count} paused, '
                f'recorded {violations_recorded} new violations, '
                f'sent {first_response_notifications} first response notifications, '
                f'triggered {escalations_triggered} escalations.'
            )
        )

    def check_escalations(self, item, sla_status, item_type, dry_run=False):
        """Check and trigger escalations and reminders for an item."""
        escalations_triggered_count = 0
        
        sla_due_times = item.calculate_sla_due_times()
        if not sla_due_times or 'sla_target' not in sla_due_times:
            return 0
        
        sla_target = sla_due_times['sla_target']
        escalations = SLAEscalations.objects.filter(sla_target=sla_target, is_active=True).order_by('level')
        current_time = timezone.now()

        for escalation in escalations:
            escalation_type = escalation.escalation_type
            due_time = sla_status.get(escalation_type, {}).get('due_time')

            if not due_time:
                continue

            # Check for reminders
            if escalation.reminder_time and escalation.reminder_unit:
                reminder_delta = timedelta(**{escalation.reminder_unit: escalation.reminder_time})
                reminder_time = due_time - reminder_delta
                if current_time >= reminder_time and current_time < due_time:
                    self.send_reminder(item, escalation, sla_status, item_type, dry_run)

            # Check for escalations
            if current_time > due_time:
                filter_kwargs = {'sla_target': sla_target, 'violation_type': escalation_type}
                if item_type == 'Ticket':
                    filter_kwargs['ticket'] = item
                else:
                    filter_kwargs['task'] = item
                
                existing_log = SLAViolation.objects.filter(**filter_kwargs).exists()
                
                if not existing_log:
                    if not dry_run:
                        self.trigger_escalation_action(item, escalation, sla_status, current_time, item_type)
                    escalations_triggered_count += 1
                    item_id = item.ticket_id if item_type == 'Ticket' else item.task_trackid
                    self.stdout.write(
                        f'{"[DRY RUN] " if dry_run else ""}Triggered {escalation.escalation_type} '
                        f'escalation (Level {escalation.level}) for {item_type} #{item_id}'
                    )
        
        return escalations_triggered_count

    def check_first_response_notification(self, ticket, sla_status, dry_run=False):
        """Check if first response SLA is breached and send notification."""
        if not sla_status.get('first_response', {}).get('due_time'):
            return False

        current_time = timezone.now()
        first_response_due = sla_status['first_response']['due_time']

        # Check if first response is overdue and no response has been made
        if (current_time > first_response_due and
            not ticket.first_response_at and
            ticket.status != 'resolved'):

            # Check if we haven't already sent this notification
            # We'll use a simple approach: check if there's already a violation logged
            existing_violation = SLAViolation.objects.filter(
                ticket=ticket,
                violation_type='first_response'
            ).exists()

            if not existing_violation:
                if not dry_run:
                    self.send_first_response_notification(ticket, sla_status)
                ticket_id = ticket.ticket_id
                self.stdout.write(
                    f'{"[DRY RUN] " if dry_run else ""}Sent first response breach notification for ticket #{ticket_id}'
                )
                return True

        return False

    def send_first_response_notification(self, ticket, sla_status):
        """Send first response time elapsed notification."""
        template_name = "SLA_FIRST_RESPONSE_NOTIFICATION_ESCALATION"
        template = get_system_template(template_name)
        if not template:
            logger.error(f"{template_name} template not found in system templates")
            return

        recipients = []
        if ticket.assigned_to:
            recipients.append(ticket.assigned_to.email)

        # Add department agents if no specific assignee
        if not recipients and ticket.department:
            for user in ticket.department.user_set.filter(is_active=True):
                recipients.append(user.email)

        recipients = list(set(recipients))  # Remove duplicates

        if recipients:
            objects = {"ticket": ticket}
            parser = TemplateParser(objects=objects)
            context = parser.build_context(template)

            mailer = Mailer()
            mailer.send_templated_email(
                template=template,
                context=context,
                receiver_email=recipients,
                
            )
            logger.info(f'Sent first response breach notification for ticket #{ticket.ticket_id} to: {", ".join(recipients)}')

    def send_reminder(self, item, escalation, sla_status, item_type, dry_run):
        """Send a reminder email using a template."""
        item_id = item.ticket_id if item_type == 'Ticket' else item.task_trackid
        self.stdout.write(f'{"[DRY RUN] " if dry_run else ""}Sending reminder for {item_type} #{item_id}')
        if dry_run:
            return

        template_name = "SLA_REMINDER" if item_type == 'Ticket' else "SLA_REMINDER_TASK"
        template = get_system_template(template_name)
        if not template:
            logger.error(f"{template_name} template not found in system templates")
            return

        recipients = []
        if item.assigned_to:
            recipients.append(item.assigned_to.email)

        if recipients:
            objects = {"ticket" if item_type == 'Ticket' else "task": item}
            parser = TemplateParser(objects=objects)
            context = parser.build_context(template)
            
            mailer = Mailer()
            mailer.send_templated_email(
                template=template,
                context=context,
                receiver_email=recipients,
                
            )
            logger.info(f'Sent reminder email for {item_type} #{item_id} to: {", ".join(recipients)}')

    def trigger_escalation_action(self, item, escalation, sla_status, current_time, item_type):
        """Perform the actions defined for an escalation"""
        # Prepare email context
        context = {
            'item': item,
            'item_type': item_type,
            'sla_status': sla_status,
            'escalation': escalation,
            'current_time': current_time,
            'due_time': sla_status[escalation.escalation_type]['due_time'] if escalation.escalation_type in sla_status else None,
        }
        
        # Prepare recipients
        recipients = []
        
        # Add escalation groups/agents
        for group in escalation.escalate_to_groups.all():
            for user in group.user_set.all():
                recipients.append(user.email)
        for agent in escalation.escalate_to_agents.all():
            recipients.append(agent.email)

        # Add business admin
        if item.business and item.business.owner:
            recipients.append(item.business.owner.email)
        
        # Add ticket assignee if notify_agent is True (assuming 'notify_agent' is on SLAEscalations)
        # Note: The provided SlaXModel.py for SLAEscalations does not have notify_agent, notify_supervisor, notify_manager fields.
        # I'm adding a placeholder for them based on the old sla.py logic.
        # If these fields are not intended, this part should be removed.
        # if hasattr(escalation, 'notify_agent') and escalation.notify_agent and ticket.assigned_to:
        #     recipients.append(ticket.assigned_to.email)
        
        recipients = list(set(recipients)) # Remove duplicates
        
        # Send email using template
        template_name = "SLA_ESCALATION_NOTICE" if item_type == 'Ticket' else "SLA_ESCALATION_NOTICE_TASK"
        template = get_system_template(template_name)
        if not template:
            logger.error(f"{template_name} template not found in system templates")
            return

        if recipients:
            objects = {"ticket" if item_type == 'Ticket' else "task": item}
            parser = TemplateParser(objects=objects)
            context = parser.build_context(template)
            
            mailer = Mailer()
            mailer.send_templated_email(
                template=template,
                context=context,
                receiver_email=recipients,
                
            )
            item_id = item.ticket_id if item_type == 'Ticket' else item.task_trackid
            logger.info(f'Sent escalation email for {item_type} #{item_id} to: {", ".join(recipients)}')
        
        # Log the escalation (using SLAViolation as a log for now, or a new SLAEscalationLogX model)
        # For a full implementation, you'd create a dedicated log entry here.
        # For now, if it's a breach, it's already logged by check_sla_violations.
        # If it's just an escalation reminder, you'd need a separate log model.
        pass # Placeholder for logging escalation actions if not a breach violation
