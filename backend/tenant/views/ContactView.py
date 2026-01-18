from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant.models import Contact
from tenant.serializers.ContactSerializer import ContactSerializer


class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ContactSerializer
    pagination_class = PageNumberPagination

    def get_queryset(self):
        qs = Contact.objects.filter(
            is_deleted=False,
        )

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )

        tags = self.request.query_params.get("tags")
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            for tag in tag_list:
                qs = qs.filter(tags__contains=[tag])

        return qs.order_by("-id")

    def _can_manage(self, contact: Contact) -> bool:
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True
        role_name = getattr(getattr(user, "role", None), "name", "").lower()
        if role_name == "admin":
            return True
        return contact.owner_id == user.id

    def _can_delete(self) -> bool:
        """
        Restrict deletions to admins (or superusers) only, regardless of contact ownership.
        """
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        role_name = getattr(getattr(user, "role", None), "name", "").lower()
        return role_name == "admin"

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user,
        )

    def update(self, request, *args, **kwargs):
        contact = self.get_object()
        if not self._can_manage(contact):
            return Response({"message": "Not authorized to update this contact."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        contact = self.get_object()
        if not self._can_manage(contact):
            return Response({"message": "Not authorized to update this contact."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        contact = self.get_object()
        if not self._can_delete():
            return Response({"message": "Not authorized to delete this contact."}, status=status.HTTP_403_FORBIDDEN)
        contact.is_deleted = True
        contact.save(update_fields=["is_deleted"])
        return Response(status=status.HTTP_204_NO_CONTENT)
