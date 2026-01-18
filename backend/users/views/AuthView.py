from django.db.models import Q
from django_otp.oath import totp
from django_otp.util import random_hex
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from RNSafarideskBack.settings import DOMAIN_NAME
from shared.tasks import send_otp
from users.models import Users
from users.serializers.AuthSerializer import LoginInitiateSerializer, OTPVerifySerializer, ResendOTPSerializer, \
    SendPasswordResetLinkSerializer, ResetPasswordSerializer, UpdatePasswordSerializer
from django.contrib.auth import get_user_model
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

from users.serializers.MyTokenObtainSerializer import MyTokenObtainPairSerializer
from util.Mailer import Mailer


class LoginInitiateView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=LoginInitiateSerializer)
    def post(self, request):
        serializer = LoginInitiateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.context['user']
            # Get existing confirmed device or create one
            device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
            if not device:
                device = TOTPDevice.objects.create(
                    user=user,
                    name='email_otp',
                    key=random_hex(),
                    confirmed=True
                )

            # Ensure it's always exactly 6 digits by formatting the result as a string with leading zeros
            otp = totp(device.bin_key, step=30, t0=0, digits=6)
            # Format the OTP to ensure it's exactly 6 digits
            otp = f"{int(otp):06d}"

            print(f"Generated OTP ======> {otp}")

            # Create session
            session = SessionStore()
            session['_auth_user_id'] = user.id
            session.create()

            
            # Send email
            # send_otp.apply(args=[otp, user.email]).get()
            Mailer().send_otp(otp, user.email)

            return Response({
                "sessionKey": session.session_key,
                "detail": "OTP sent to your email.",
            }, status=status.HTTP_200_OK)
        
        return Response({
            "detail": "Incorrect login credentials"
        }, status=status.HTTP_400_BAD_REQUEST)

class OTPVerifyView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(request_body=OTPVerifySerializer)
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.context['user']
            refresh = RefreshToken.for_user(user)
            from ..serializers.MyTokenObtainSerializer import MyTokenObtainPairSerializer
            token = MyTokenObtainPairSerializer.get_token(user)  # this is a RefreshToken with custom claims
            access = token.access_token  # get access token from it
            data = {
                "refresh": str(token),
                "access": str(access),
            }
            return Response(data)
        return Response({"message": "Invalid or expired OTP!"}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=ResendOTPSerializer)
    def post(self, request):
        session_key = request.data.get('session_key')
        if not session_key:
            return Response({"detail": "Session key is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            session = Session.objects.get(session_key=session_key)
            user_id = session.get_decoded().get('_auth_user_id')
            User = get_user_model()
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"detail": "Invalid session."}, status=status.HTTP_400_BAD_REQUEST)
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not device:
            device = TOTPDevice.objects.create(
                user=user,
                name='email_otp',
                key=random_hex(),
                confirmed=True
            )
        otp = totp(device.bin_key, step=120, t0=0, digits=6)  # 2 minutes
        print(f"Resend OTP ======> {otp}")


        # Send email
        # send_otp.apply(args=[otp, user.email]).get()
        Mailer().send_otp(otp, user.email)


#         Mailing().send_otp(user, otp)
        return Response({
            "detail": "OTP resent to your email.",
        }, status=status.HTTP_200_OK)


class SendPasswordResetLinkView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=SendPasswordResetLinkSerializer)
    def post(self, request):
        identifier = request.data.get('identifier')
        if not identifier:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = Users.objects.filter(Q(username=identifier) | Q(email=identifier)).first()
        if not user:
            return Response({
                "message": f"User with {identifier} not found! Please check and try again"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate token and UID
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Get protocol (http or https) from request
        protocol = "https" if request.is_secure() else "http"

        # Get user business subdomain
        user_subdomain = None
        if not user_subdomain:
            return Response({
                "message": "Business domain is not configured for this user."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Build reset URL
        reset_url = f"{protocol}://{user_subdomain}.{DOMAIN_NAME}/new-password?token={token}&uid={uid}"

        try:
            Mailer().send_password_reset_link(reset_url, user.email)
        except Exception:
            return Response({"message": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Password reset link has been sent to your email."
        }, status=status.HTTP_200_OK)


class LoginView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    authentication_classes = []

class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    @swagger_auto_schema(request_body=ResetPasswordSerializer)
    def post(self, request):
        token = request.data.get('token')
        uid = request.data.get('uid')
        new_password = request.data.get('new_password')

        if not all([token, uid, new_password]):
            return Response(
                {"message": "Token, UID, and new password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode UID
            user_id = urlsafe_base64_decode(uid).decode()
            User = get_user_model()
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"message": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token
        if not default_token_generator.check_token(user, token):
            return Response(
                {"message": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {"message": e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()
        return Response({
            "message": "Password has been reset successfully."
        }, status=status.HTTP_200_OK)


class UpdatePassword(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=UpdatePasswordSerializer)
    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        old_password = request.data.get('old_password')

        # Check if old password is correct
        if not user.check_password(old_password):
            return Response({
                "message": "Old password is incorrect."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if new password is not the same as old one
        if old_password == new_password:
            return Response({
                "message": "New password cannot be the same as the old password."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set the new password
        user.set_password(new_password)
        user.first_login = False
        user.save()

        # Generate fresh tokens
        refresh = MyTokenObtainPairSerializer.get_token(user)
        access = refresh.access_token

        return Response({
            "message": "Password has been updated successfully.",
             "refresh": str(refresh),
            "access": str(access),
        }, status=status.HTTP_200_OK)
