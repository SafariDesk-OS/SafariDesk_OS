from __future__ import annotations

import logging
from typing import Dict, Iterable, Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from tenant.models.Notification import (
    Notification,
    OrganizationNotificationSetting,
    UserNotificationPreference,
    default_notification_matrix,
    notification_channel_defaults,
)

logger = logging.getLogger(__name__)


class NotificationSettingsService:
    """
    Central place for managing notification settings lookups and deliveries.
    """

    CRITICAL_TYPES = {'sla_breach', 'ticket_escalated', 'system_announcement'}
    CHANNEL_IN_APP = 'in_app'
    CHANNEL_EMAIL = 'email'
    CHANNEL_PUSH = 'push'
    CHANNEL_SMS = 'sms'

    @classmethod
    def get_user_preferences(cls, user) -> UserNotificationPreference:
        preference, created = UserNotificationPreference.objects.get_or_create(
            user=user,
            defaults={
                # 'business': getattr(user, 'business', None),
            }
        )
        
        return preference

    @classmethod
    def get_business_settings(cls, business) -> Optional[OrganizationNotificationSetting]:
        if not business:
            return None
        settings, _ = OrganizationNotificationSetting.objects.get_or_create(
            defaults={
                'delivery_channels': notification_channel_defaults(),
                'notification_matrix': default_notification_matrix(),
            }
        )
        return settings

    @classmethod
    def build_effective_matrix(
        cls,
        preference: UserNotificationPreference,
        business_settings: Optional[OrganizationNotificationSetting] = None,
    ) -> Dict[str, Dict[str, bool]]:
        """
        Combine workspace defaults with user overrides to determine the final state of each channel.
        """
        base_matrix = default_notification_matrix()
        business_matrix = business_settings.notification_matrix if business_settings else {}
        business_channels = business_settings.delivery_channels if business_settings else notification_channel_defaults()

        user_matrix = preference.notification_matrix or {}
        user_channels = preference.delivery_channels or notification_channel_defaults()

        resolved = {}
        for notif_type, channel_defaults in base_matrix.items():
            resolved[notif_type] = {}
            business_type_settings = business_matrix.get(notif_type, {})
            user_type_settings = user_matrix.get(notif_type, {})

            for channel, default_enabled in channel_defaults.items():
                business_channel_on = business_channels.get(channel, True)
                user_channel_on = user_channels.get(channel, True)
                per_business_on = business_type_settings.get(channel, default_enabled)
                per_user_on = user_type_settings.get(channel, default_enabled)

                resolved[notif_type][channel] = bool(
                    business_channel_on and
                    user_channel_on and
                    per_business_on and
                    per_user_on
                )
        return resolved

    @classmethod
    def should_send(cls, user, notification_type: str, channel: str = CHANNEL_IN_APP) -> bool:
        """
        Determine whether the notification should be delivered on the given channel.
        """
        if not user:
            return False

        business_settings = cls.get_business_settings(getattr(user, 'business', None))
        if business_settings:
            if not business_settings.is_channel_enabled(channel):
                return False
            if not business_settings.is_notification_enabled(notification_type, channel):
                return False

        preferences = cls.get_user_preferences(user)
        if not preferences.is_channel_enabled(channel):
            return False
        if not preferences.is_notification_enabled(notification_type, channel):
            return False

        # Honor mute setting for in-app
        if channel == cls.CHANNEL_IN_APP and preferences.is_muted():
            return False

        # Quiet hours suppress email/push unless the notification is critical
        if channel in {cls.CHANNEL_EMAIL, cls.CHANNEL_PUSH} and preferences.quiet_hours_active():
            if notification_type not in cls.CRITICAL_TYPES:
                return False

        return True

    @classmethod
    def should_send_email(cls, user, notification_type: str) -> bool:
        return cls.should_send(user, notification_type, cls.CHANNEL_EMAIL)

    @classmethod
    def should_send_in_app(cls, user, notification_type: str) -> bool:
        return cls.should_send(user, notification_type, cls.CHANNEL_IN_APP)

    @classmethod
    def create_in_app_notification(
        cls,
        user,
        *,
        ticket=None,
        message: str,
        notification_type: str,
        metadata: Optional[Dict] = None,
    ) -> Optional[Notification]:
        """
        Create and broadcast an in-app notification if settings permit it.
        """
        if not cls.should_send_in_app(user, notification_type):
            logger.info(
                "Skipping in-app notification for %s (%s disabled)",
                getattr(user, 'email', user.id),
                notification_type,
            )
            return None

        notification = Notification.objects.create(
            user=user,
            ticket=ticket,
            message=message,
            notification_type=notification_type,
            metadata=metadata or {},
        )

        cls._broadcast(notification)
        return notification

    @classmethod
    def notify_many(
        cls,
        users: Iterable,
        *,
        ticket=None,
        message: str,
        notification_type: str,
        metadata: Optional[Dict] = None,
    ) -> int:
        """
        Send an in-app notification to multiple recipients, respecting preferences.
        Returns how many notifications were created.
        """
        count = 0
        for user in users:
            if cls.create_in_app_notification(
                user=user,
                ticket=ticket,
                message=message,
                notification_type=notification_type,
                metadata=metadata,
            ):
                count += 1
        return count

    @classmethod
    def _broadcast(cls, notification: Notification) -> None:
        """
        Broadcast a notification update over WebSocket and update unread counter.
        """
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        user = notification.user
        business = getattr(user, 'business', None)
        # Removed business_id
        group_name = f'notifications_{user.id}'
        serialized = notification.to_dict()

        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "notification_message",
                    "notification": serialized,
                },
            )
        except Exception:  # pragma: no cover - defensive log
            logger.exception("Failed to emit WebSocket notification")
            return

        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "unread_count_update",
                "count": unread_count,
            },
        )
