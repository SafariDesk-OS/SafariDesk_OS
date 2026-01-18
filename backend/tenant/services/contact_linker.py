from __future__ import annotations

import logging
from typing import Optional

from tenant.models import Contact

logger = logging.getLogger(__name__)


def link_or_create_contact(
    *,
    # business,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    owner=None,
) -> Optional[Contact]:
    """
    Find or create a contact for the given business using email/phone.
    Fills missing fields on existing contact when possible.
    """
    if not any([email, phone, name]):
        logger.warning("[CONTACT] No contact info provided - skipping creation")
        return None

    contact: Optional[Contact] = None

    if email:
        contact = Contact.objects.filter(
            
            email=email,
            is_deleted=False,
        ).first()
        if contact:
            logger.info(f"[CONTACT] Found existing by email={email} id={contact.id}")

    if not contact and phone:
        contact = Contact.objects.filter(
            
            phone=phone,
            is_deleted=False,
        ).first()
        if contact:
            logger.info(f"[CONTACT] Found existing by phone={phone} id={contact.id}")

    if not contact:
        contact = Contact.objects.create(
            
            name=name or email or phone or "Contact",
            email=email,
            phone=phone,
            owner=owner,
        )
        logger.info(
            f"[CONTACT] ✅ CREATED NEW contact_id={contact.id} "
            f"name={contact.name} "
            f"email={email} phone={phone} is_deleted={contact.is_deleted}"
        )
        return contact

    # Update missing fields if available
    update_fields = []
    if not contact.name and name:
        contact.name = name
        update_fields.append("name")
    if not contact.email and email:
        contact.email = email
        update_fields.append("email")
    if not contact.phone and phone:
        contact.phone = phone
        update_fields.append("phone")

    if update_fields:
        contact.save(update_fields=update_fields)
        logger.info(f"[CONTACT] Updated existing contact_id={contact.id} fields={update_fields}")

    return contact
