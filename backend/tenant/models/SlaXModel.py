from django.db import models
from django.contrib.auth.models import User, Group
from django.core.validators import MinValueValidator
from django.utils import timezone

from shared.models.BaseModel import BaseEntity

class SLA(BaseEntity):
    """Main SLA configuration model"""

    OPERATIONAL_HOURS_CHOICES = [
        ('calendar', 'Calendar Hours (24 hrs x 7 days)'),
        ('business', 'Business Hours'),
        ('custom', 'Custom Hours'),
    ]

    EVALUATION_CHOICES = [
        ('ticket_creation', 'Ticket creation time'),
        ('conditions_met', 'Time when conditions are met'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    operational_hours = models.CharField(
        max_length=20,
        choices=OPERATIONAL_HOURS_CHOICES,
        default='calendar'
    )
    evaluation_method = models.CharField(
        max_length=20,
        choices=EVALUATION_CHOICES,
        default='conditions_met'
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "SLA"
        verbose_name_plural = "SLAs"


class SLACondition(BaseEntity):
    """SLA conditions that determine when SLA applies"""

    CONDITION_TYPES = [
        ('priority', 'Priority'),
        ('category', 'Category'),
        ('department', 'Department'),
        ('customer_type', 'Customer Type'),
        ('tag', 'Tag'),
        ('custom_field', 'Custom Field'),
    ]

    OPERATORS = [
        ('equals', 'Equals'),
        ('not_equals', 'Not Equals'),
        ('contains', 'Contains'),
        ('not_contains', 'Does Not Contain'),
        ('starts_with', 'Starts With'),
        ('ends_with', 'Ends With'),
    ]

    sla = models.ForeignKey(SLA, on_delete=models.CASCADE, related_name='conditions')
    condition_type = models.CharField(max_length=50, choices=CONDITION_TYPES)
    operator = models.CharField(max_length=20, choices=OPERATORS, default='equals')
    value = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sla.name} - {self.condition_type} {self.operator} {self.value}"

    class Meta:
        verbose_name = "SLA Condition"
        verbose_name_plural = "SLA Conditions"


class SLATarget(BaseEntity):
    """SLA targets for different priority levels"""

    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    TIME_UNITS = [
        ('minutes', 'Minutes'),
        ('hours', 'Hours'),
        ('days', 'Days'),
        ('weeks', 'Weeks'),
    ]

    sla = models.ForeignKey(SLA, on_delete=models.CASCADE, related_name='targets')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)

    # Time to first response (optional - can be null)
    first_response_time = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    first_response_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='hours', blank=True)

    # Time to next response (optional)
    next_response_time = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    next_response_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='hours', blank=True)

    # Time to resolution
    resolution_time = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    resolution_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='days')

    # Operational hours for this target
    operational_hours = models.CharField(
        max_length=20,
        choices=SLA.OPERATIONAL_HOURS_CHOICES,
        default='calendar'
    )

    # Reminder and escalation toggles (kept for backward compatibility but not used in UI)
    reminder_enabled = models.BooleanField(default=False)
    escalation_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sla.name} - {self.priority}"

    class Meta:
        verbose_name = "SLA Target"
        verbose_name_plural = "SLA Targets"


class SLAReminder(BaseEntity):
    """SLA reminder configurations"""

    REMINDER_TYPES = [
        ('first_response', 'First Response Reminder'),
        ('next_response', 'Next Response Reminder'),
        ('resolution', 'Resolution Reminder'),
    ]

    TIME_UNITS = [
        ('minutes', 'Minutes'),
        ('hours', 'Hours'),
        ('days', 'Days'),
    ]

    sla_target = models.ForeignKey(SLATarget, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)

    # When to send reminder (before target breach)
    time_before = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    time_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='minutes')

    # Who to notify
    notify_groups = models.ManyToManyField(Group, blank=True, related_name='sla_reminders')
    notify_agents = models.ManyToManyField("users.Users", blank=True, related_name='sla_reminders')

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sla_target} - {self.reminder_type} ({self.time_before} {self.time_unit})"

    class Meta:
        verbose_name = "SLA Reminder"
        verbose_name_plural = "SLA Reminders"


class SLAEscalations(BaseEntity):
    """SLA escalation configurations with multiple levels"""

    ESCALATION_TYPES = [
        ('first_response', 'First Response Escalation'),
        ('next_response', 'Next Response Escalation'),
        ('resolution', 'Resolution Escalation'),
    ]

    TIME_UNITS = [
        ('minutes', 'Minutes'),
        ('hours', 'Hours'),
        ('days', 'Days'),
    ]

    sla_target = models.ForeignKey(SLATarget, on_delete=models.CASCADE, related_name='escalations')
    escalation_type = models.CharField(max_length=20, choices=ESCALATION_TYPES)
    level = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    # When to trigger escalation
    trigger_time = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    trigger_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='minutes')

    # Who to escalate to
    escalate_to_groups = models.ManyToManyField(Group, blank=True, related_name='sla_escalations')
    escalate_to_agents = models.ManyToManyField("users.Users", blank=True, related_name='sla_escalations')

    # Reminder settings
    reminder_time = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    reminder_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='minutes', blank=True)

    # Email settings
    email_subject = models.CharField(max_length=255, blank=True, null=True)
    email_body = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sla_target} - {self.escalation_type} Level {self.level}"

    class Meta:
        verbose_name = "SLA Escalation"
        verbose_name_plural = "SLA Escalations"
        ordering = ['escalation_type', 'level']


class BusinessHoursx(BaseEntity):
    """Business hours configuration for SLA calculations"""

    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    name = models.CharField(max_length=100)
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_working_day = models.BooleanField(default=True)

    def __str__(self):
        day_name = dict(self.DAYS_OF_WEEK)[self.day_of_week]
        if self.is_working_day:
            return f"{self.name} - {day_name}: {self.start_time} to {self.end_time}"
        else:
            return f"{self.name} - {day_name}: Non-working day"

    class Meta:
        verbose_name = "Business Hours"
        verbose_name_plural = "Business Hours"


class Holidays(BaseEntity):
    """Holiday configuration for SLA calculations"""

    name = models.CharField(max_length=100)
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

    class Meta:
        verbose_name = "Holiday"
        verbose_name_plural = "Holidays"


class SLAViolation(models.Model):
    """Track SLA violations"""

    VIOLATION_TYPES = [
        ('first_response', 'First Response Breach'),
        ('next_response', 'Next Response Breach'),
        ('resolution', 'Resolution Breach'),
    ]

    ticket = models.ForeignKey("tenant.Ticket", on_delete=models.CASCADE, related_name='sla_violations')
    sla_target = models.ForeignKey(SLATarget, on_delete=models.CASCADE)
    violation_type = models.CharField(max_length=20, choices=VIOLATION_TYPES)

    target_time = models.DateTimeField()  # When the SLA should have been met
    actual_time = models.DateTimeField(null=True, blank=True)  # When it was actually met (if at all)
    breach_time = models.DateTimeField()  # When the breach occurred

    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SLA Violation - {self.ticket} - {self.violation_type}"

    class Meta:
        verbose_name = "SLA Violation"
        verbose_name_plural = "SLA Violations"


class SLAConfiguration(BaseEntity):
    """Global SLA configuration settings"""
    
    # Allow SLA tracking system-wide
    allow_sla = models.BooleanField(default=True, help_text="Enable or disable SLA tracking system-wide")
    
    # Allow holidays in SLA calculations
    allow_holidays = models.BooleanField(default=True, help_text="Include holidays in SLA calculations")
    
    # Additional configuration options can be added here
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "SLA Configuration"
        verbose_name_plural = "SLA Configurations"
    
    def __str__(self):
        return f"SLA Config (SLA: {self.allow_sla}, Holidays: {self.allow_holidays})"
