from rest_framework import serializers
from tenant.models.Notification import Notification
from tenant.serializers.TicketSerializer import TicketsList


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'notification_type', 'metadata', 'ticket']

    # Optional: customize ticket field if needed
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        ticket = instance.ticket
        if ticket:
            rep['ticket'] = {
                'id': ticket.id,
                'ticket_id': ticket.ticket_id,
                'title': ticket.title,
                'status': ticket.status,
                'priority': ticket.priority,
            }
        return rep

class NotificationUpdateSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(default=True, required=False)
    class Meta:
        model = Notification
        fields = ["is_read"]
        
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Allow if user is admin or owns the notification
        if not (user.is_staff or user.is_superuser or self.instance.user == user):
            raise serializers.ValidationError("You can only update your own notifications or must be an admin.")
        
        return attrs
    def update(self, instance, validated_data):
        instance.is_read = True
        instance.save()
        return instance