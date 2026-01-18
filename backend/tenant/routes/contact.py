from django.urls import path

from tenant.views.ContactView import ContactViewSet

urlpatterns = [
    path(
        "",
        ContactViewSet.as_view({"get": "list", "post": "create"}),
        name="contact_list_create",
    ),
    path(
        "<int:pk>/",
        ContactViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="contact_detail",
    ),
]
