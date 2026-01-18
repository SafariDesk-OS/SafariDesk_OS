from django.db import models
from shared.models.BaseModel import BaseEntity

class SettingSMTP(BaseEntity):
    host = models.CharField(max_length=255, verbose_name="SMTP Host")
    port = models.PositiveIntegerField(verbose_name="SMTP Port")
    username = models.CharField(max_length=255, verbose_name="SMTP Username")
    password = models.CharField(max_length=255, verbose_name="SMTP Password")
    use_tls = models.BooleanField(default=True, verbose_name="Use TLS")
    use_ssl = models.BooleanField(default=False, verbose_name="Use SSL")
    default_from_email = models.EmailField(verbose_name="Default From Email")
    sender_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Sender Name")
    reply_to_email = models.EmailField(blank=True, null=True, verbose_name="Reply-To Email")

    class Meta:
        verbose_name = "SMTP Setting"
        verbose_name_plural = "SMTP Settings"
        db_table = 'setting_smtp'


class EmailTemplateCategory(BaseEntity):
    name = models.CharField(max_length=200)

    class Meta:
        db_table = 'email_templates'
        unique_together = ('name',)


    def __str__(self):
        return self.name


class EmailTemplate(BaseEntity):
    """
    Stores actual email templates with placeholders.
    """
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    category = models.ForeignKey(
        EmailTemplateCategory, on_delete=models.CASCADE, related_name="templates"
    )
    is_active = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default="en")
    type = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'email_templates_items'
        unique_together = ('name',)

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class EmailConfig(BaseEntity):
    """
    Stores actual email templates with placeholders.
    """
    default_template = models.ForeignKey(
        EmailTemplateCategory, on_delete=models.CASCADE, related_name="default_template"
    )
    email_fetching = models.BooleanField(default=True)


class EmailSettings(BaseEntity):
    """
    Stores email signature and format settings for outgoing replies.
    """
    signature_greeting = models.CharField(
        max_length=100, 
        default="Regards,",
        help_text="Greeting text before signature name (e.g., 'Regards,', 'Best,', 'Thanks,')"
    )
    signature_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Signature name (e.g., 'Support Team', 'Acme Inc Support'). Falls back to business name."
    )
    include_ticket_link = models.BooleanField(
        default=True,
        help_text="Include 'View Ticket' link in email replies"
    )
    use_plain_text = models.BooleanField(
        default=True,
        help_text="Send replies as plain text (recommended for threading)"
    )

    class Meta:
        db_table = 'email_settings'
        verbose_name = "Email Settings"
        verbose_name_plural = "Email Settings"

    def __str__(self):
        return f"Email Settings for {self.business.name if self.business else 'Unknown'}"

    def get_signature_name(self):
        """Return signature name, falling back to business name."""
        return self.signature_name or (self.business.name if self.business else "Support Team")