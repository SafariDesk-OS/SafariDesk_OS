import json
import logging
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from tenant.models import MailIntegration
from util.mail import (
    exchange_google_code,
    exchange_microsoft_code,
    fetch_google_userinfo,
    verify_oauth_state,
)

logger = logging.getLogger(__name__)


def _popup_response(status: str, payload: dict | None, redirect_url: str):
    payload = payload or {}
    message = {"type": "mailIntegrationOauth", "status": status}
    message.update(payload)
    message_json = json.dumps(message)
    fallback_url = redirect_url
    fallback_params = urlencode(message)
    html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OAuth Complete</title>
    <style>
      body {{
        font-family: sans-serif;
        margin: 0;
        padding: 2rem;
        text-align: center;
        color: #1f2937;
      }}
    </style>
  </head>
  <body>
    <p>You can close this window.</p>
    <script>
      (function() {{
        const message = {message_json};
        const fallbackUrl = "{fallback_url}";
        function redirectFallback() {{
          if (!fallbackUrl) return;
          const separator = fallbackUrl.includes("?") ? "&" : "?";
          window.location.href = fallbackUrl + separator + "{fallback_params}";
        }}
        let posted = false;
        try {{
          if (window.opener && !window.opener.closed) {{
            window.opener.postMessage(message, "*");
            posted = true;
          }}
        }} catch (err) {{
          console.error('postMessage failed', err);
        }}
        try {{
          window.close();
        }} catch (err) {{
          console.warn('Unable to close window', err);
        }}
        if (!posted) {{
          redirectFallback();
        }}
      }})();
    </script>
  </body>
</html>
"""
    return HttpResponse(html)


class BaseOAuthCallbackView(APIView):
    permission_classes = [AllowAny]
    provider_name = ""

    def handle(self, request, exchange_func):
        state = request.query_params.get("state")
        code = request.query_params.get("code")
        error = request.query_params.get("error")

        if error:
            return _popup_response("error", {"error": error}, settings.MAIL_INTEGRATION_OAUTH_ERROR_URL)

        if not state or not code:
            return _popup_response("error", {"error": "missing_parameters"}, settings.MAIL_INTEGRATION_OAUTH_ERROR_URL)

        try:
            payload = verify_oauth_state(state)
        except Exception:
            return _popup_response("error", {"error": "invalid_state"}, settings.MAIL_INTEGRATION_OAUTH_ERROR_URL)

        integration_id = payload.get("integration_id")
        integration = MailIntegration.objects.filter(id=integration_id).first()
        if not integration:
            return _popup_response(
                "error",
                {"error": "integration_not_found"},
                settings.MAIL_INTEGRATION_OAUTH_ERROR_URL,
            )
        metadata = integration.provider_metadata or {}
        oauth_context = metadata.get("oauth_context") or {}
        return_url = oauth_context.pop("return_url", None)
        metadata["oauth_context"] = oauth_context
        metadata.pop("pending_state", None)
        success_redirect = return_url or settings.MAIL_INTEGRATION_OAUTH_SUCCESS_URL
        error_redirect = return_url or settings.MAIL_INTEGRATION_OAUTH_ERROR_URL

        try:
            token_data = exchange_func(code)
        except Exception as exc:
            logger.exception("OAuth token exchange failed: %s", exc)
            integration.mark_failure(str(exc))
            integration.provider_metadata = metadata
            integration.save(update_fields=["provider_metadata"])
            return _popup_response(
                "error",
                {"error": "token_exchange_failed"},
                error_redirect,
            )

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        integration.set_secret("oauth_access_token", access_token)
        if refresh_token:
            integration.set_secret("oauth_refresh_token", refresh_token)
        integration.oauth_expires_at = token_data.get("expires_at")
        metadata["oauth"] = {
            "scope": token_data.get("scope"),
            "token_type": token_data.get("token_type"),
            "connected_at": timezone.now().isoformat(),
        }

        # Populate mailbox email if missing and we can fetch it from the provider.
        if not integration.email_address:
            email_address = None
            if self.provider_name == "google" and access_token:
                try:
                    profile = fetch_google_userinfo(access_token)
                    email_address = profile.get("email")
                except Exception:
                    logger.info("oauth_userinfo_fetch_failed", extra={"integration_id": integration.id, "provider": "google"})
            if email_address:
                integration.email_address = email_address
                metadata["oauth"]["email"] = email_address

        integration.provider_metadata = metadata
        integration.mark_success()
        # Persist encrypted tokens + expiry + metadata + optional email.
        update_fields = [
            "oauth_access_token_encrypted",
            "oauth_refresh_token_encrypted",
            "oauth_expires_at",
            "provider_metadata",
        ]
        if integration.email_address:
            update_fields.append("email_address")
        integration.save(update_fields=update_fields)

        return _popup_response(
            "success",
            {"provider": self.provider_name, "integration": integration.id},
            success_redirect,
        )


class GoogleOAuthCallbackView(BaseOAuthCallbackView):
    provider_name = "google"

    def get(self, request, *args, **kwargs):
        return self.handle(request, exchange_google_code)


class MicrosoftOAuthCallbackView(BaseOAuthCallbackView):
    provider_name = "microsoft"

    def get(self, request, *args, **kwargs):
        return self.handle(request, exchange_microsoft_code)
