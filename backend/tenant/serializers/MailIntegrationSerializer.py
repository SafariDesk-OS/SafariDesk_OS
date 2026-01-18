from __future__ import annotations

from typing import Dict, Optional

from rest_framework import serializers

from tenant.models import Department, MailIntegration


class MailIntegrationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = MailIntegration
        fields = [
            "id",
            "email_address",
            "display_name",
            "provider",
            "direction",
            "department",
            "department_name",
            "imap_host",
            "imap_port",
            "imap_use_ssl",
            "smtp_host",
            "smtp_port",
            "smtp_use_ssl",
            "smtp_use_tls",
            "connection_status",
            "connection_status_detail",
            "forwarding_address",
            "forwarding_status",
            "is_active",
            "last_success_at",
            "last_error_at",
            "last_error_message",
            "provider_metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "connection_status",
            "connection_status_detail",
            "forwarding_status",
            "last_success_at",
            "last_error_at",
            "last_error_message",
            "provider_metadata",
            "created_at",
            "updated_at",
        ]


class MailIntegrationWriteSerializer(serializers.ModelSerializer):
    imap_username = serializers.CharField(write_only=True, allow_blank=True, required=False)
    imap_password = serializers.CharField(write_only=True, allow_blank=True, required=False, style={"input_type": "password"})
    smtp_username = serializers.CharField(write_only=True, allow_blank=True, required=False)
    smtp_password = serializers.CharField(write_only=True, allow_blank=True, required=False, style={"input_type": "password"})
    oauth_access_token = serializers.CharField(write_only=True, allow_blank=True, required=False)
    oauth_refresh_token = serializers.CharField(write_only=True, allow_blank=True, required=False)

    class Meta:
        model = MailIntegration
        fields = [
            "id",
            "email_address",
            "display_name",
            "provider",
            "direction",
            "department",
            "connection_status",
            "connection_status_detail",
            "forwarding_address",
            "forwarding_status",
            "is_active",
            "imap_host",
            "imap_port",
            "imap_use_ssl",
            "imap_username",
            "imap_password",
            "smtp_host",
            "smtp_port",
            "smtp_use_ssl",
            "smtp_use_tls",
            "smtp_username",
            "smtp_password",
            "oauth_access_token",
            "oauth_refresh_token",
            "oauth_expires_at",
            "provider_metadata",
        ]
        read_only_fields = ["connection_status", "connection_status_detail", "forwarding_status", "provider_metadata"]
        extra_kwargs = {
            "email_address": {"required": False, "allow_blank": True},
        }

    secret_field_map = {
        "imap_username": "imap_username_encrypted",
        "imap_password": "imap_password_encrypted",
        "smtp_username": "smtp_username_encrypted",
        "smtp_password": "smtp_password_encrypted",
        "oauth_access_token": "oauth_access_token_encrypted",
        "oauth_refresh_token": "oauth_refresh_token_encrypted",
    }

    def _pop_secret_values(self, validated_data: Dict) -> Dict[str, Optional[str]]:
        secrets: Dict[str, Optional[str]] = {}
        for plain_field in list(self.secret_field_map.keys()):
            if plain_field in validated_data:
                secrets[plain_field] = validated_data.pop(plain_field)
        return secrets

    def _persist_secrets(self, instance: MailIntegration, secrets: Dict[str, Optional[str]]):
        update_fields = []
        for plain_field, value in secrets.items():
            instance.set_secret(plain_field, value)
            update_fields.append(self.secret_field_map[plain_field])
        if update_fields:
            instance.save(update_fields=update_fields)

    def validate_department(self, department: Optional[Department]):
        request = self.context.get("request")
        if department and request and department.business != request.user.business:
            raise serializers.ValidationError("Department must belong to your business.")
        return department

    def create(self, validated_data):
        secrets = self._pop_secret_values(validated_data)
        instance = super().create(validated_data)
        self._persist_secrets(instance, secrets)
        return instance

    def update(self, instance, validated_data):
        secrets = self._pop_secret_values(validated_data)
        instance = super().update(instance, validated_data)
        self._persist_secrets(instance, secrets)
        return instance


class MailIntegrationRoutingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailIntegration
        fields = ["display_name", "department", "direction"]

    def validate_department(self, department: Optional[Department]):
        request = self.context.get("request")
        if department and request and department.business != request.user.business:
            raise serializers.ValidationError("Department must belong to your business.")
        return department
