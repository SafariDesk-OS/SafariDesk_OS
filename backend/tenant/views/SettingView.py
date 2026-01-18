import json
import os
import uuid

from django.core.mail import EmailMessage, get_connection
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

from RNSafarideskBack import settings
from RNSafarideskBack.settings import FILE_URL
from tenant.models import Ticket, Requests, DepartmentEmails, Department
from tenant.models.SettingModel import SettingSMTP, EmailTemplateCategory, EmailTemplate, EmailConfig, EmailSettings
from users.models.BusinessModel import Business
from tenant.serializers.AgentSerializer import AgentSerializer
from tenant.serializers.DepartmentSerializer import DepartmentEmailSerializer, DepartmentEmailUpdateSerializer
from tenant.serializers.SettingSerializer import SMTPSettingsSerializer, SMTPTestSerializer, \
    EmailTemplateCategorySerializer, EmailTemplateSerializer, EmailConfigSerializer, EmailSettingsSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, filters, status

from util.Mailer import Mailer
from util.email.parser import TemplateParser
from util.email.mappings import PLACEHOLDER_FIELDS
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, UpdateAPIView


class TemplateTest(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        template = None  # ("NEW_ACTIVITY_NOTICE")

        ticket = Ticket.objects.get(id=2)

        # prepare objects
        objects = {
            "ticket": ticket,
        }

        # create parser instance
        parser = TemplateParser(objects=objects)

        # build context for this template
        context = parser.build_context(template)

        mailer = Mailer()
        mailer.send_templated_email(
            template=template,
            context=context,
            receiver_email="titus.eddys@gmail.com",
            
        )

        return Response(context)


class DepartmentEmailView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DepartmentEmailSerializer

    def get_queryset(self):
        return DepartmentEmails.objects.filter()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DepartmentEmailUpdateSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        department_id = self.request.data.get('department')
        department = get_object_or_404(
            Department,
            id=department_id,
            
        )
        serializer.save(
            
            department=department,
            created_by=self.request.user,
            updated_by=self.request.user
        )


class DepartmentEmailUpdateView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DepartmentEmailUpdateSerializer
    queryset = DepartmentEmails.objects.all()

    def get_queryset(self):
        return self.queryset.filter()

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        super().update(request, *args, **kwargs)
        return Response({"message": "Updated successfully"})


class EmailConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        config, created = EmailConfig.objects.get_or_create()
        serializer = EmailConfigSerializer(config)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        config, created = EmailConfig.objects.get_or_create()
        serializer = EmailConfigSerializer(config, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailSignatureView(APIView):
    """API to get/update email signature settings."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        settings_obj, created = EmailSettings.objects.get_or_create()
        serializer = EmailSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        settings_obj, created = EmailSettings.objects.get_or_create()
        serializer = EmailSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailPlaceholdersView(APIView):
    """
    A view to retrieve the available email placeholders.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(PLACEHOLDER_FIELDS)


class EmailTemplateCategoryView(viewsets.ModelViewSet):
    serializer_class = EmailTemplateCategorySerializer
    permission_classes = [IsAuthenticated]
    queryset = EmailTemplateCategory.objects.all()

    def get_queryset(self):
        return self.queryset.filter()

    def perform_create(self, serializer):
        serializer.save( created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class EmailTemplateView(viewsets.ModelViewSet):
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = EmailTemplate.objects.all()

    def get_queryset(self):
        return self.queryset.filter()

    def perform_create(self, serializer):
        category_id = self.request.data.get('category')
        category = EmailTemplateCategory.objects.get(id=category_id, )
        serializer.save( created_by=self.request.user, category=category)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SMTPSettingsView(viewsets.ModelViewSet):
    """
    A viewset for managing SMTP settings.
    """
    serializer_class = SMTPSettingsSerializer
    permission_classes = [IsAuthenticated]
    queryset = SettingSMTP.objects.all()

    def get_serializer_class(self):
        """
        Return the serializer class based on the action.
        """
        if self.action in "test":
            return SMTPTestSerializer
        return SMTPSettingsSerializer




    def create_smtp(self, request, *args, **kwargs):
        """
        Create or update the SMTP setting.
        If one already exists, update it instead of creating a new one.
        """
        smtp_setting = SettingSMTP.objects.filter().first()

        data = {
            'host': request.data.get('host'),
            'port': request.data.get('port'),
            'username': request.data.get('username'),
            'password': request.data.get('password'),
            'use_tls': request.data.get('use_tls', True),
            'use_ssl': request.data.get('use_ssl', False),
            'default_from_email': request.data.get('default_from_email'),
            'sender_name': request.data.get('sender_name', ''),
            'reply_to_email': request.data.get('reply_to_email', ''),
        }

        if smtp_setting:
            for field, value in data.items():
                setattr(smtp_setting, field, value)
            smtp_setting.save()
            return Response({"message": "SMTP settings updated successfully."}, status=status.HTTP_200_OK)
        else:
            SettingSMTP.objects.create(**data)
            return Response({"message": "SMTP settings created successfully."}, status=status.HTTP_201_CREATED)

    def update_general(self, request, *args, **kwargs):
        business = Business.objects.first()
        if not business:
            return Response({"message": "Business profile not found"}, status=status.HTTP_404_NOT_FOUND)

        business.name = request.data.get('name', business.name)
        business.email = request.data.get('email', business.email)
        business.phone = request.data.get('phone', business.phone)
        business.timezone = request.data.get('timezone', business.timezone)

        if request.FILES:
            uploaded_files = request.FILES

            for uploaded_file_name, uploaded_file in uploaded_files.items():
                try:
                    file_extension = os.path.splitext(uploaded_file.name)[1].lower()

                    # Optional: validate file extension
                    allowed_extensions = ['.jpg', '.jpeg', '.png', '.svg', '.ico']
                    if file_extension not in allowed_extensions:
                        return Response({
                            "error": f"Unsupported file type for {uploaded_file_name}"
                        }, status=status.HTTP_400_BAD_REQUEST)

                    # Generate unique filename
                    unique_filename = f"{uuid.uuid4()}{file_extension}"

                    # Create directory if it doesn't exist
                    properties_dir = os.path.join(settings.MEDIA_ROOT, 'files')
                    os.makedirs(properties_dir, exist_ok=True)

                    # Full file path
                    file_path = os.path.join(properties_dir, unique_filename)

                    # Save file to disk
                    with open(file_path, 'wb+') as destination:
                        for chunk in uploaded_file.chunks():
                            destination.write(chunk)

                    # Generate public URL
                    file_url = f"{FILE_URL}/{unique_filename}"

                    # Assign URL to corresponding field
                    if uploaded_file_name == "logo":
                        business.logo_url = file_url
                    elif uploaded_file_name == "favicon":
                        business.favicon_url = file_url

                except Exception as file_error:
                    return Response({
                        "error": f"Failed to save file '{uploaded_file_name}'",
                        "details": str(file_error)
                    }, status=status.HTTP_400_BAD_REQUEST)

        business.save()

        # ✅ Return object matching frontend structure
        return Response({
            "message": "Settings updated successfully",
            "business": {
                "id": business.id,
                "name": business.name,
                "domain": business.domain,
                "email": business.email,
                "logo_url": business.logo_url,
                "favicon_url": business.favicon_url,
                "phone": business.phone,
                "timezone": business.timezone,
            }
        }, status=status.HTTP_200_OK)

    def get_business_info(self, request, *args, **kwargs):
        """
        Get current business information including logo and favicon URLs.
        """
        business = Business.objects.first()
        if not business:
            return Response({"message": "Business profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "id": business.id,
            "name": business.name,
            "domain": business.domain,
            "email": business.email,
            "logo_url": business.logo_url,
            "favicon_url": business.favicon_url,
            "phone": business.phone,
            "timezone": business.timezone,
            "support_url": business.support_url,
        }, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        config = SettingSMTP.objects.filter().first()
        if config:
            serializer = self.get_serializer(config)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"message": "SMTP settings not found."}, status=status.HTTP_200_OK)

    def test(self, request):
        """
        Test sending an email using the current SMTP settings.
        """
        smtp_setting = SettingSMTP.objects.filter().first()
        to_email = request.data.get("email")

        if not to_email:
            return Response({"message": "Missing 'email' in request body."}, status=status.HTTP_400_BAD_REQUEST)

        if not smtp_setting:
            return Response({"message": "SMTP settings not configured for this business."}, status=status.HTTP_404_NOT_FOUND)

        try:
            connection = get_connection(
                host=smtp_setting.host,
                port=smtp_setting.port,
                username=smtp_setting.username,
                password=smtp_setting.password,
                use_tls=smtp_setting.use_tls,
                use_ssl=smtp_setting.use_ssl
            )

            from_email = (
                f"{smtp_setting.sender_name} <{smtp_setting.default_from_email}>"
                if smtp_setting.sender_name
                else smtp_setting.default_from_email
            )

            email = EmailMessage(
                subject="SMTP Test Email",
                body="This is a test email sent using your configured SMTP settings.",
                from_email=from_email,
                to=[to_email],
                connection=connection
            )
            email.send()
            return Response({"message": f"Test email sent to {to_email}."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"message": f"Failed to send test email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
