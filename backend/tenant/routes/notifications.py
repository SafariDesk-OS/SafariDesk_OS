from django.urls import path
from tenant.views.NotificationView import (
    MarkNotificationAsReadView,
    NotificationListView,
    UnreadNotificationCountView,
)
from tenant.views.NotificationSettingsView import (
    OrganizationNotificationSettingView,
    UserNotificationPreferenceView,
)

urlpatterns = [
    path("list/", NotificationListView.as_view(), name="notification-list"),
    path(
        "mark-as-read/<int:pk>/",
        MarkNotificationAsReadView.as_view(),
        name="mark-as-read",
    ),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="unread-count"),
    path(
        "settings/user/",
        UserNotificationPreferenceView.as_view(),
        name="notification-user-settings",
    ),
    path(
        "settings/org/",
        OrganizationNotificationSettingView.as_view(),
        name="notification-org-settings",
    ),
]
