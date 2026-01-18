from rest_framework import serializers
from django.contrib.auth.models import Group

from tenant.models.SlaXModel import SLACondition, SLAReminder, SLAEscalations, SLATarget, SLA, BusinessHoursx, Holidays, SLAConfiguration
from users.models import Users


class BusinessHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessHoursx
        fields = ['id', 'name', 'day_of_week', 'start_time', 'end_time', 'is_working_day']


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holidays
        fields = ['id', 'name', 'date', 'is_recurring', 'description', 'is_active']
        read_only_fields = ['id']


class SLAConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SLACondition
        fields = ['id', 'condition_type', 'operator', 'value', 'is_active']


class SLAReminderSerializer(serializers.ModelSerializer):
    notify_groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False
    )
    notify_agents = serializers.PrimaryKeyRelatedField(
        queryset=Users.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = SLAReminder
        fields = [
            'id', 'reminder_type', 'time_before', 'time_unit',
            'notify_groups', 'notify_agents', 'is_active'
        ]


class SLAEscalationSerializer(serializers.ModelSerializer):
    escalate_to_groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False
    )
    escalate_to_agents = serializers.PrimaryKeyRelatedField(
        queryset=Users.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = SLAEscalations
        fields = [
            'id', 'escalation_type', 'level', 'trigger_time', 'trigger_unit',
            'escalate_to_groups', 'escalate_to_agents', 'is_active'
        ]


class SLATargetSerializer(serializers.ModelSerializer):
    reminders = SLAReminderSerializer(many=True, required=False)
    escalations = SLAEscalationSerializer(many=True, required=False)

    class Meta:
        model = SLATarget
        fields = [
            'id', 'priority', 'first_response_time', 'first_response_unit',
            'next_response_time', 'next_response_unit', 'resolution_time',
            'resolution_unit', 'operational_hours', 'reminder_enabled',
            'escalation_enabled', 'reminders', 'escalations'
        ]


class SLASerializer(serializers.ModelSerializer):
    conditions = SLAConditionSerializer(many=True, required=False)
    targets = SLATargetSerializer(many=True, required=False)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SLA
        fields = [
            'id', 'name', 'description', 'operational_hours',
            'evaluation_method', 'is_active', 'created_at', 'updated_at',
            'created_by', 'conditions', 'targets'
        ]

    def create(self, validated_data):
        conditions_data = validated_data.pop('conditions', [])
        targets_data = validated_data.pop('targets', [])

        # Set the created_by user from request
        validated_data['created_by'] = self.context['request'].user

        # Create SLA instance
        sla = SLA.objects.create(**validated_data)

        # Create conditions
        for condition_data in conditions_data:
            SLACondition.objects.create(sla=sla, **condition_data)

        # Create targets with reminders and escalations
        for target_data in targets_data:
            reminders_data = target_data.pop('reminders', [])
            escalations_data = target_data.pop('escalations', [])

            target = SLATarget.objects.create(sla=sla, **target_data)

            # Create reminders for this target
            for reminder_data in reminders_data:
                notify_groups = reminder_data.pop('notify_groups', [])
                notify_agents = reminder_data.pop('notify_agents', [])

                reminder = SLAReminder.objects.create(sla_target=target, **reminder_data)
                reminder.notify_groups.set(notify_groups)
                reminder.notify_agents.set(notify_agents)

            # Create escalations for this target
            for escalation_data in escalations_data:
                escalate_to_groups = escalation_data.pop('escalate_to_groups', [])
                escalate_to_agents = escalation_data.pop('escalate_to_agents', [])

                escalation = SLAEscalations.objects.create(sla_target=target, **escalation_data)
                escalation.escalate_to_groups.set(escalate_to_groups)
                escalation.escalate_to_agents.set(escalate_to_agents)

        return sla

    def update(self, instance, validated_data):
        conditions_data = validated_data.pop('conditions', [])
        targets_data = validated_data.pop('targets', [])

        # Update SLA fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update conditions (simple approach: delete and recreate)
        instance.conditions.all().delete()
        for condition_data in conditions_data:
            SLACondition.objects.create(sla=instance, **condition_data)

        # Update targets (simple approach: delete and recreate)
        instance.targets.all().delete()
        for target_data in targets_data:
            reminders_data = target_data.pop('reminders', [])
            escalations_data = target_data.pop('escalations', [])

            target = SLATarget.objects.create(sla=instance, **target_data)

            # Create reminders for this target
            for reminder_data in reminders_data:
                notify_groups = reminder_data.pop('notify_groups', [])
                notify_agents = reminder_data.pop('notify_agents', [])

                reminder = SLAReminder.objects.create(sla_target=target, **reminder_data)
                reminder.notify_groups.set(notify_groups)
                reminder.notify_agents.set(notify_agents)

            # Create escalations for this target
            for escalation_data in escalations_data:
                escalate_to_groups = escalation_data.pop('escalate_to_groups', [])
                escalate_to_agents = escalation_data.pop('escalate_to_agents', [])

                escalation = SLAEscalations.objects.create(sla_target=target, **escalation_data)
                escalation.escalate_to_groups.set(escalate_to_groups)
                escalation.escalate_to_agents.set(escalate_to_agents)

        return instance


class SLAConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for SLA Configuration"""
    
    class Meta:
        model = SLAConfiguration
        fields = ['id', 'allow_sla', 'allow_holidays', 'updated_at', 'created_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
