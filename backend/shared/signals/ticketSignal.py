from django.db import transaction
from django.db.models.signals import post_save, post_init
from django.dispatch import receiver

from tenant.models import Ticket, TicketComment, TicketWatchers
from shared.workers.Ticket import (
    ticket_created_customer_notification,
    ticket_created_agent_notification,
    ticket_assigned_notification,
    ticket_status_changed_notification,
    ticket_reopened_notification,
    new_public_reply_customer_notification,
    new_public_reply_agent_notification,
    private_note_added_notification,
    ticket_resolved_customer_notification,
    watcher_added_notification,
)

@receiver(post_init, sender=Ticket)
def store_initial_ticket_state(sender, instance, **kwargs):
    """
    Store the initial state of the ticket instance to detect changes on save.
    """
    instance._original_status = instance.status
    instance._original_assigned_to = instance.assigned_to

@receiver(post_save, sender=Ticket)
def handle_ticket_notifications(sender, instance, created, **kwargs):
    """
    Handles notifications for ticket creation and updates.
    """
    if created:
        # New ticket created - Only notify customer
        transaction.on_commit(lambda: ticket_created_customer_notification.delay(instance.id))
        # DISABLED: Agent notifications for new tickets
        # transaction.on_commit(lambda: ticket_created_agent_notification.delay(instance.id))
    # DISABLED: All activity notifications are turned off
    # else:
    #     # Ticket updated, check for changes
    #     status_changed = instance.status != instance._original_status
    #     assignment_changed = instance.assigned_to != instance._original_assigned_to
    #
    #     if assignment_changed:
    #         transaction.on_commit(lambda: ticket_assigned_notification.delay(instance.id))
    #
    #     if status_changed:
    #         if instance.status == 'resolved':
    #             transaction.on_commit(lambda: ticket_resolved_customer_notification.delay(instance.id))
    #         elif instance._original_status in ['resolved', 'closed'] and instance.status in ['open', 'in_progress']:
    #             transaction.on_commit(lambda: ticket_reopened_notification.delay(instance.id))
    #         else:
    #             transaction.on_commit(lambda: ticket_status_changed_notification.delay(instance.id))

@receiver(post_save, sender=TicketComment)
def handle_comment_notifications(sender, instance, created, **kwargs):
    """
    Handles notifications when a new comment is added to a ticket.
    """
    # DISABLED: All comment activity notifications are turned off
    # if created:
    #     if instance.is_internal:
    #         transaction.on_commit(lambda: private_note_added_notification.delay(instance.ticket.id, instance.id))
    #     else:
    #         transaction.on_commit(lambda: new_public_reply_customer_notification.delay(instance.ticket.id, instance.id))
    #         transaction.on_commit(lambda: new_public_reply_agent_notification.delay(instance.ticket.id, instance.id))
    pass

@receiver(post_save, sender=TicketWatchers)
def handle_watcher_notifications(sender, instance, created, **kwargs):
    """
    Handles notifications when a new watcher is added to a ticket.
    """
    # DISABLED: Watcher notifications are turned off
    # if created:
    #     transaction.on_commit(
    #         lambda: watcher_added_notification.delay(instance.ticket.id, instance.watcher.id)
    #     )
    pass
