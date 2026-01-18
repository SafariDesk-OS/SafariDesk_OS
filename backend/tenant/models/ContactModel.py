from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from shared.models.BaseModel import BaseEntity


class Contact(BaseEntity):
    """Unified contact/customer record."""

    name = models.CharField(max_length=200)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_contacts",
    )
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "contacts"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["email"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["email"],
                name="unique_contact_email",
            ),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if not self.email and not self.phone:
            raise ValidationError("Either email or phone must be provided.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
