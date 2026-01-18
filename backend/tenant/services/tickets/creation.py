from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from django.db import transaction
from django.shortcuts import get_object_or_404

from tenant.models import Ticket, TicketCategories, Department
from tenant.models.SlaXModel import SLA
from users.models import Users
from util.Constants import PRIORITY_DURATION
from util.Helper import Helper
from tenant.services.contact_linker import link_or_create_contact


@transaction.atomic
def create_ticket_from_payload(
    *,
    # business_id removed
    data: Dict[str, Any],
    source: str = 'web',
) -> Ticket:
    """
    Shared ticket creation flow aligned with TicketView.create().
    Expects keys: title, description, category (id), department (id), priority,
    optional: creator_name, creator_email, creator_phone, customer_tier, is_public
    """
    # Generate ticket ID using config format
    ticket_id = Helper().generate_incident_code()

    title = data.get('title')
    creator_name = data.get('creator_name')
    creator_phone = data.get('creator_phone')
    creator_email = data.get('creator_email')
    description = data.get('description')
    category_id = data.get('category') or data.get('category_id')
    department_id = data.get('department') or data.get('department_id')
    
    # Priority: use provided value or fallback
    priority = data.get('priority')
    if not priority:
        priority = 'medium'  # Ultimate fallback
    
    customer_tier = data.get('customer_tier', 'standard')
    is_public = data.get('is_public', True)

    # Required field validation (match TicketView.create expectations)
    if not all([title, category_id, department_id, priority]):
        raise ValueError("Missing required fields: title, category, department, or priority")

    # Validate category and department
    category = get_object_or_404(TicketCategories, id=category_id)
    department = get_object_or_404(Department, id=department_id)

    # Attempt to link existing user by email
    created_by: Optional[Users] = None
    if creator_email:
        try:
            created_by = Users.objects.filter(email=creator_email).first()
        except Exception:
            created_by = None

    raw_tags = data.get('tags') or []
    if isinstance(raw_tags, str):
        raw_tags = [t.strip() for t in raw_tags.split(',') if t.strip()]
    if not isinstance(raw_tags, list):
        raw_tags = []
    tag_value = ",".join(raw_tags) if raw_tags else ""

    # Create ticket (SLA due dates calculated later)
    ticket = Ticket.objects.create(
        title=title,
        description=description,
        category=category,
        department=department,
        creator_name=creator_name,
        creator_email=creator_email,
        creator_phone=creator_phone,
        created_by=created_by,
        ticket_id=ticket_id,
        priority=priority,
        customer_tier=customer_tier,
        is_public=is_public,
        source=source,
        tags=tag_value
    )

    # Link or create contact
    logger = logging.getLogger(__name__)
    
    try:
        contact = link_or_create_contact(
            name=creator_name,
            email=creator_email,
            phone=creator_phone,
            owner=created_by,
        )
        if contact:
            ticket.contact = contact
            ticket.save(update_fields=["contact"])
            logger.info(
                f"[TICKET_CREATION] Contact linked to ticket ticket_id={ticket_id} "
                f"contact_id={contact.id} name={contact.name} email={contact.email} "
                f"source={source}"
            )
        else:
            logger.warning(
                f"[TICKET_CREATION] Contact creation returned None ticket_id={ticket_id} "
                f"creator_name={creator_name} creator_email={creator_email} creator_phone={creator_phone} "
                f"source={source}"
            )
    except Exception as e:
        logger.error(
            f"[TICKET_CREATION] Contact creation failed ticket_id={ticket_id} "
            f"error={str(e)} source={source}",
            exc_info=True
        )

    # Assign SLA by priority
    applicable_sla = SLA.objects.filter(
        is_active=True,
        targets__priority=priority,
    ).first()
    if applicable_sla:
        ticket.sla = applicable_sla
        ticket.save(update_fields=['sla'])

    # Calculate due dates using ticket methods, fallback to PRIORITY_DURATION
    sla_due_times = ticket.calculate_sla_due_times()
    if sla_due_times and sla_due_times.get('resolution_due'):
        ticket.due_date = sla_due_times['resolution_due']
        ticket.save(update_fields=['due_date'])
    else:
        try:
            priority_dict = dict(PRIORITY_DURATION)
            priority_hours_str = priority_dict.get(priority)
            if priority_hours_str:
                priority_hours = int(priority_hours_str)
                ticket.due_date = datetime.now() + timedelta(hours=priority_hours)
                ticket.save(update_fields=['due_date'])
        except Exception:
            pass

    # Add system comment for audit trail (if system user exists)
    # Skip system comment for chatbot-created tickets to avoid noisy activity streams
    if source != "chatbot":
        try:
            system_user = Users.objects.filter(email='system@safaridesk.io').first()
            if system_user:
                ticket.comments.create(
                    ticket=ticket,
                    author=system_user,
                    content=f"Ticket Creation\nTitle: {ticket.title}\nDescription: {ticket.description}",
                    updated_by=system_user,
                    is_internal=False,
                )
        except Exception:
            pass

    return ticket
