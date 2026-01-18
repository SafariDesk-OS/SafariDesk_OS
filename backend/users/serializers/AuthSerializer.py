from rest_framework import serializers
from django.contrib.auth import authenticate
from django_otp.plugins.otp_totp.models import TOTPDevice


class LoginInitiateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            # Check if user exists to provide better error message
            try:
                User.objects.get(email=data['username'])
                raise serializers.ValidationError({"message": "Wrong password", "error_code": "wrong_password"})
            except User.DoesNotExist:
                raise serializers.ValidationError({"message": "Invalid username", "error_code": "invalid_username"})
        
        if not user.is_active:
            raise serializers.ValidationError({"message": "User account is disabled", "error_code": "account_disabled"})
        
        self.context['user'] = user
        return data


class OTPVerifySerializer(serializers.Serializer):
    otp = serializers.CharField()
    session_key = serializers.CharField()

    def validate(self, data):
        from django.contrib.sessions.models import Session

        try:
            session = Session.objects.get(session_key=data['session_key'])
            user_id = session.get_decoded().get('_auth_user_id')
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(pk=user_id)
        except Exception:
            raise serializers.ValidationError("Invalid session")

        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not device or not device.verify_token(data['otp']):
            raise serializers.ValidationError("Invalid OTP")

        self.context['user'] = user
        return data

class ResendOTPSerializer(serializers.Serializer):
    session_key = serializers.CharField()

class SendPasswordResetLinkSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=200)
    new_password = serializers.CharField(max_length=200)
    uid = serializers.CharField(max_length=200)


class UpdatePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(max_length=200)
    old_password = serializers.CharField(max_length=200)
