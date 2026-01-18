from __future__ import annotations

from types import SimpleNamespace
from unittest import mock

from django.test import SimpleTestCase

from tenant.serializers.MailValidationSerializer import MailCredentialValidationSerializer
from tenant.services.ai.intent_analyzer import IntentAnalyzer
from tenant.services.ai.context_builder import ContextBuilder
from tenant.services.ai.ticket_extractor import TicketExtractor
from util.mail.oauth import sign_oauth_state, verify_oauth_state
from util.mail.ingestion import MailIntegrationIngestionService


class GeminiClientTests(SimpleTestCase):
    """Covers regressions we observed when Google SDKs changed their return types."""

    @mock.patch("tenant.services.ai.gemini_client.genai.GenerativeModel")
    @mock.patch("tenant.services.ai.gemini_client.genai.list_models")
    @mock.patch("tenant.services.ai.gemini_client.genai.configure")
    def test_generate_content_handles_usage_metadata_objects(self, mock_configure, mock_list_models, mock_generative_model):
        """Simulate a response where usage_metadata is an object without dict methods."""
        fake_usage = SimpleNamespace(prompt_token_count=11, candidates_token_count=17)
        fake_response = SimpleNamespace(text="Mock reply", usage_metadata=fake_usage)
        mock_generative_model.return_value.generate_content.return_value = fake_response
        mock_list_models.return_value = [
            SimpleNamespace(
                name="projects/demo/models/gemini-flash-latest",
                supported_generation_methods=["generateContent"],
            )
        ]

        def fake_config(key, default=None):
            overrides = {
                "GEMINI_API_KEY": "local-test-key",
                "GEMINI_MODEL": "gemini-flash-latest",
                "GEMINI_MAX_RETRIES": 1,
                "GEMINI_RETRY_DELAY": 0.01,
                "GEMINI_TIMEOUT": 30,
            }
            return overrides.get(key, default)

        with mock.patch("tenant.services.ai.gemini_client.config", side_effect=fake_config):
            from tenant.services.ai.gemini_client import GeminiClient

            client = GeminiClient()
            result = client.generate_content(prompt="Hello SafariDesk")

        self.assertEqual(result["content"], "Mock reply")
        self.assertEqual(result["input_tokens"], 11)
        self.assertEqual(result["output_tokens"], 17)
        mock_configure.assert_called_once_with(api_key="local-test-key")


class EmbeddingServiceTests(SimpleTestCase):
    @mock.patch("tenant.services.ai.embedding_service.genai.configure")
    @mock.patch("tenant.services.ai.embedding_service.genai.embed_content")
    def test_embed_text_supports_list_payloads(self, mock_embed, mock_configure):
        """Ensure we can parse the latest embed_content list responses."""
        mock_embed.return_value = [{"values": [0.1, 0.2, 0.3]}]

        def fake_config(key, default=None):
            overrides = {
                "GEMINI_API_KEY": "local-test-key",
                "EMBEDDING_MODEL": "gemini-embedding-001",
                "EMBEDDING_OUTPUT_DIM": 1536,
            }
            return overrides.get(key, default)

        with mock.patch("tenant.services.ai.embedding_service.config", side_effect=fake_config):
            from tenant.services.ai.embedding_service import EmbeddingService

            service = EmbeddingService()
            vector = service._embed_text("Hello world")

        self.assertEqual(vector, [0.1, 0.2, 0.3])
        mock_configure.assert_called_once_with(api_key="local-test-key")


class AIPipelineSmokeTests(SimpleTestCase):
    def test_rule_based_pipeline_smoke(self):
        """Exercise the intent analyzer, context builder, and ticket extractor together."""
        analyzer = IntentAnalyzer()
        message = "Hi team, please create a high priority ticket for broken Wi-Fi"
        analysis = analyzer.analyze(message)
        self.assertEqual(analysis["intent"], "create_ticket")

        kb_results = [
            {"title": "Wi-Fi Troubleshooting", "excerpt": "Restart the router and check logs."},
        ]
        builder = ContextBuilder()
        system_prompt = builder.build_system_prompt()
        user_prompt = builder.build_user_prompt(message=message, kb_results=kb_results, history=[{"role": "user", "content": "Hello"}])

        extractor = TicketExtractor()
        ticket_payload = extractor.extract(business_id=1, text=message)

        self.assertIn("SafariDesk AI Assistant", system_prompt)
        self.assertIn("Wi-Fi Troubleshooting", user_prompt)
        self.assertTrue(ticket_payload["title"])
        self.assertEqual(ticket_payload["priority"], "high")


class MailOAuthUtilsTests(SimpleTestCase):
    def test_state_round_trip(self):
        payload = {"integration_id": 7, "provider": "google"}
        state = sign_oauth_state(payload)
        decoded = verify_oauth_state(state)
        self.assertEqual(decoded["integration_id"], 7)
        self.assertEqual(decoded["provider"], "google")


class MailValidationSerializerTests(SimpleTestCase):
    def test_requires_imap_or_smtp(self):
        serializer = MailCredentialValidationSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_accepts_imap_only(self):
        serializer = MailCredentialValidationSerializer(
            data={"imap_host": "imap.example.com", "imap_username": "user", "imap_password": "pass"}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


class MailIngestionHelpersTests(SimpleTestCase):
    def test_extract_ticket_code(self):
        code = MailIntegrationIngestionService._extract_ticket_code("Re: [#INC123AB] Issue")
        self.assertEqual(code, "INC123AB")

    def test_extract_message_ids(self):
        header = "<abc@example.com> <def@example.com>"
        ids = list(MailIntegrationIngestionService._extract_message_ids(header))
        self.assertEqual(ids, ["<abc@example.com>", "<def@example.com>"])
