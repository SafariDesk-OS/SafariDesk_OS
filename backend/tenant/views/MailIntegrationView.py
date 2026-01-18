import secrets
from urllib.parse import urlparse

from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from tenant.models import MailIntegration
from tenant.serializers.MailIntegrationSerializer import (
    MailIntegrationRoutingSerializer,
    MailIntegrationSerializer,
    MailIntegrationWriteSerializer,
)
from tenant.serializers.MailValidationSerializer import MailCredentialValidationSerializer
from util.mail import (
    build_google_auth_url,
    build_microsoft_auth_url,
    sign_oauth_state,
    validate_mail_credentials,
)


class MailIntegrationViewSet(viewsets.ModelViewSet):
    """
    Manage mailbox integrations per tenant. Secrets are written through the write serializer
    and never returned in responses.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MailIntegrationSerializer
    queryset = MailIntegration.objects.all()

    def get_queryset(self):
        base_qs = MailIntegration.objects.select_related("department")
        return base_qs

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return MailIntegrationWriteSerializer
        return MailIntegrationSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.fetch_logs.all().delete()
        instance.messages.all().delete()
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["patch"], url_path="routing")
    def update_routing(self, request, pk=None):
        integration = self.get_object()
        serializer = MailIntegrationRoutingSerializer(
            integration,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MailIntegrationSerializer(integration).data)

    @action(detail=True, methods=["post"], url_path="provider/change")
    def change_provider(self, request, pk=None):
        integration = self.get_object()
        provider = request.data.get("provider")
        direction = request.data.get("direction")

        if provider not in MailIntegration.Provider.values:
            return Response(
                {"detail": "Invalid provider."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        integration.provider = provider
        if direction and direction in MailIntegration.Direction.values:
            integration.direction = direction

        self._reset_credentials(integration)
        integration.email_address = None
        integration.connection_status = MailIntegration.ConnectionStatus.CONNECTING
        integration.connection_status_detail = ""
        integration.last_error_at = None
        integration.last_error_message = ""
        integration.provider_metadata = {}
        integration.forwarding_address = None
        integration.forwarding_status = ""
        integration.oauth_expires_at = None
        integration.save()

        return Response(MailIntegrationSerializer(integration).data)

    @action(detail=True, methods=["post"], url_path="google/start")
    def google_start(self, request, pk=None):
        integration = self.get_object()
        if integration.provider != MailIntegration.Provider.GMAIL:
            return Response(
                {"detail": "Integration provider must be Gmail for this action."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        state = sign_oauth_state(
            {"integration_id": integration.id, "provider": "google", "user_id": request.user.id}
        )
        url = build_google_auth_url(state)
        metadata = integration.provider_metadata or {}
        metadata["pending_state"] = state
        oauth_context = metadata.get("oauth_context") or {}
        return_url = self._extract_return_url(request)
        if return_url:
            oauth_context["return_url"] = return_url
        metadata["oauth_context"] = oauth_context
        integration.provider_metadata = metadata
        integration.save(update_fields=["provider_metadata"])
        return Response({"authorization_url": url})

    @action(detail=True, methods=["post"], url_path="microsoft/start")
    def microsoft_start(self, request, pk=None):
        integration = self.get_object()
        if integration.provider != MailIntegration.Provider.OFFICE365:
            return Response(
                {"detail": "Integration provider must be Microsoft 365 for this action."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        state = sign_oauth_state(
            {"integration_id": integration.id, "provider": "microsoft", "user_id": request.user.id}
        )
        url = build_microsoft_auth_url(state)
        metadata = integration.provider_metadata or {}
        metadata["pending_state"] = state
        oauth_context = metadata.get("oauth_context") or {}
        return_url = self._extract_return_url(request)
        if return_url:
            oauth_context["return_url"] = return_url
        metadata["oauth_context"] = oauth_context
        integration.provider_metadata = metadata
        integration.save(update_fields=["provider_metadata"])
        return Response({"authorization_url": url})

    @action(detail=False, methods=["post"], url_path="validate-credentials")
    def validate_credentials(self, request):
        serializer = MailCredentialValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = validate_mail_credentials(serializer.validated_data)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="forwarding/provision")
    def provision_forwarding(self, request, pk=None):
        integration = self.get_object()
        if integration.provider != MailIntegration.Provider.SAFARIDESK:
            return Response(
                {"detail": "Forwarding aliases only apply to SafariDesk mail server entries."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if integration.forwarding_address:
            return Response(
                {
                    "forwarding_address": integration.forwarding_address,
                    "forwarding_status": integration.forwarding_status,
                }
            )
        alias = self._generate_forwarding_alias(integration)
        integration.forwarding_address = alias
        integration.email_address = alias
        integration.forwarding_status = "pending_verification"
        metadata = integration.provider_metadata or {}
        metadata["forwarding"] = {
            "generated_at": timezone.now().isoformat(),
            "instructions": [
                "Add the alias as a forwarding address in your domain or mailbox provider.",
                f"Forward all support emails to {alias}.",
                "Once forwarding is configured, send a test email so SafariDesk can verify delivery.",
            ],
        }
        integration.provider_metadata = metadata
        integration.save(update_fields=["forwarding_address", "email_address", "forwarding_status", "provider_metadata"])
        return Response(
            {
                "forwarding_address": alias,
                "email_address": alias,
                "forwarding_status": integration.forwarding_status,
                "instructions": metadata["forwarding"]["instructions"],
            },
            status=status.HTTP_201_CREATED,
        )

    def _generate_forwarding_alias(self, integration: MailIntegration) -> str:
        domain = getattr(settings, "SAFARIDESK_FORWARDING_DOMAIN", "mail.safaridesk.io")
        business = getattr(integration, "business", None)
        base_slug = slugify(getattr(business, "name", "") or "tenant") or f"tenant-{business.id if business else integration.id}"
        candidate = f"support+{base_slug}@{domain}"
        if MailIntegration.objects.filter(forwarding_address__iexact=candidate).exclude(id=integration.id).exists():
            suffix = secrets.token_hex(3)
            candidate = f"support+{base_slug}-{suffix}@{domain}"
        return candidate

    def _reset_credentials(self, integration: MailIntegration):
        integration.set_secret("oauth_access_token", None)
        integration.set_secret("oauth_refresh_token", None)
        integration.set_secret("imap_username", None)
        integration.set_secret("imap_password", None)
        integration.set_secret("smtp_username", None)
        integration.set_secret("smtp_password", None)
        integration.imap_host = ""
        integration.imap_port = None
        integration.imap_use_ssl = None
        integration.smtp_host = ""
        integration.smtp_port = None
        integration.smtp_use_ssl = None
        integration.smtp_use_tls = None
    def _extract_return_url(self, request):
        url = request.data.get("return_url") or request.query_params.get("return_url")
        if not url:
            return None
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            return None
        if not parsed.netloc:
            return None
        return url

    @action(detail=True, methods=["post"], url_path="alias/generate")
    def generate_alias(self, request, pk=None):
        """
        Generate a SafariDesk-hosted alias for this integration (provider must be safaridesk).
        Uses the configured forwarding domain and integration id for uniqueness.
        """
        integration = self.get_object()
        if integration.provider != MailIntegration.Provider.SAFARIDESK:
            return Response(
                {"detail": "Alias generation only applies to SafariDesk provider."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if integration.forwarding_address:
            return Response(
                {
                    "forwarding_address": integration.forwarding_address,
                    "email_address": integration.email_address,
                    "connection_status": integration.connection_status,
                }
            )

        domain = getattr(settings, "SAFARIDESK_FORWARDING_DOMAIN", "mail.safaridesk.io")
        business = getattr(integration, "business", None)
        base_slug = slugify(getattr(business, "name", "") or "tenant") or f"tenant-{business.id if business else integration.id}"
        candidate = f"support+{base_slug}@{domain}"
        if MailIntegration.objects.filter(forwarding_address__iexact=candidate).exclude(id=integration.id).exists():
            candidate = f"support+{base_slug}-{integration.id}@{domain}"

        alias = candidate
        metadata = integration.provider_metadata or {}
        webhook_meta = metadata.get("webhook") or {}
        # Optional shared secret per integration to validate callbacks
        webhook_meta.setdefault("secret", secrets.token_hex(16))
        metadata["webhook"] = webhook_meta

        integration.forwarding_address = alias
        integration.email_address = alias
        integration.connection_status = MailIntegration.ConnectionStatus.CONNECTING
        integration.connection_status_detail = ""
        integration.last_error_at = None
        integration.last_error_message = ""
        integration.provider_metadata = metadata
        integration.save(
            update_fields=[
                "forwarding_address",
                "email_address",
                "connection_status",
                "connection_status_detail",
                "last_error_at",
                "last_error_message",
                "provider_metadata",
            ]
        )

        instructions = [
            f"Point your mailbox forwarding to {alias}.",
            "Send a test email to verify delivery. Status will update on first success.",
        ]

        return Response(
            {
                "forwarding_address": alias,
                "email_address": alias,
                "connection_status": integration.connection_status,
                "instructions": instructions,
                "webhook_secret": webhook_meta.get("secret"),
            },
            status=status.HTTP_201_CREATED,
        )
