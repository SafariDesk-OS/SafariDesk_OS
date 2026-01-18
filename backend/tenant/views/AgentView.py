from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from shared.tasks import send_welcome_message
from tenant.models import Department
from tenant.serializers.AgentSerializer import AgentSerializer, AgentReadSerializer
from users.models import Users
from util.Helper import Helper


class AgentView(viewsets.ModelViewSet):

    queryset = Users.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AgentReadSerializer
        return AgentSerializer

    def list(self, request):
        # Show all users (admin, agent, staff) for role management
        queryset = Users.objects.filter(
            is_active=True
        ).exclude(
            is_superuser=True  # Exclude superuser only
        ).order_by('-id')
        # Check for pagination query param
        pagination = request.query_params.get('pagination', 'yes').lower()

        if pagination != 'no':
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

        # If pagination=no or pagination fails
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        queryset = Users.objects.get(id=kwargs.get('id'))
        serializer = self.get_serializer(queryset)

        return Response(serializer.data)


    def deactivate_activate_agent(self, request, *args, **kwargs):
        agent = Users.objects.filter(id=kwargs.get('id')).first()

        if not agent:
            return Response({
                "message": "Agent not found"
            }, status=status.HTTP_404_NOT_FOUND)

        agent.is_active = not agent.is_active
        agent.save()

        status_msg = "activated" if agent.is_active else "deactivated"

        return Response({
            "message": f"Agent successfully {status_msg}"
        }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        try:
            name = request.data.get('name', '').strip()
            email = request.data.get('email')
            phone_number = request.data.get('phone_number')
            gender = request.data.get('gender', 'other')  # Default to 'other' if not provided
            departments_ids = request.data.get('departments')  # list of department IDs

            # Validate required fields (gender is now optional with default)
            if not name or not email or not phone_number or not departments_ids:
                return Response({"message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

            name_parts = name.split()
            f_name = name_parts[0] if name_parts else ""
            l_name = " ".join(name_parts[1:]).strip() if len(name_parts) > 1 else ""
            if not f_name:
                return Response({"message": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)

            first_for_username = f_name or "agent"
            last_for_username = l_name or f_name or "agent"
            username = Helper().generate_unique_username(
                first_name=first_for_username,
                last_name=last_for_username
            )


            # Check for existing email or phone
            if Users.objects.filter(email=email).exists():
                return Response({"message": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            if Users.objects.filter(phone_number=phone_number).exists():
                return Response({"message": "Phone number already exists."}, status=status.HTTP_400_BAD_REQUEST)

            # Validate all department IDs
            departments = Department.objects.filter(id__in=departments_ids)
            if len(departments) != len(departments_ids):
                return Response({"message": "One or more departments are invalid."}, status=status.HTTP_400_BAD_REQUEST)

            # Create user
            role, _ = Group.objects.get_or_create(name='agent')
            password = Helper().generate_random_password()

            print("The user password ==========> ", password)

            agent = Users.objects.create(
                first_name=f_name,
                last_name=l_name,
                username=username,
                email=email,
                phone_number=phone_number,
                is_superuser=False,
                gender=gender,
                is_active=True,
                is_staff=True,
                role=role,
                category="CUSTOMER",
                password=make_password(password),
            )
            agent.groups.add(role)

            # Set many-to-many departments
            agent.department.set(departments)

            # Send welcome message
            send_welcome_message.apply(args=[agent.id, password]).get()

            return Response({
                "message": "Agent created successfully.",
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"message": f"An error occurred while creating the agent: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        try:
            agent_id = kwargs.get("id")

            # Get the agent to update
            try:
                agent = Users.objects.get(id=agent_id)
            except Users.DoesNotExist:
                return Response({"message": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

            # Get data from request
            name = request.data.get('name', '').strip()
            email = request.data.get('email')
            phone_number = request.data.get('phone_number')
            gender = request.data.get('gender', 'other')  # Default to 'other' if not provided
            departments_ids = request.data.get('departments')
            role_name = request.data.get('role')  # Get role from request

            # Validate required fields (gender is now optional with default)
            if not name or not email or not phone_number or not departments_ids:
                return Response({"message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

            name_parts = name.split()
            f_name = name_parts[0] if name_parts else ""
            l_name = " ".join(name_parts[1:]).strip() if len(name_parts) > 1 else ""
            if not f_name:
                return Response({"message": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Check for existing email (exclude current agent)
            if Users.objects.filter(email=email).exclude(id=agent_id).exists():
                return Response({"message": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            # Check for existing phone number (exclude current agent)
            if Users.objects.filter(phone_number=phone_number).exclude(id=agent_id).exists():
                return Response({"message": "Phone number already exists."}, status=status.HTTP_400_BAD_REQUEST)

            # Validate all department IDs
            departments = Department.objects.filter(id__in=departments_ids)
            if len(departments) != len(departments_ids):
                return Response({"message": "One or more departments are invalid."}, status=status.HTTP_400_BAD_REQUEST)

            # Update agent fields
            agent.first_name = f_name
            agent.last_name = l_name
            agent.email = email
            agent.phone_number = phone_number
            agent.gender = gender

            # Update role if provided
            if role_name:
                try:
                    role, _ = Group.objects.get_or_create(name=role_name)
                    # Clear existing roles and assign the new one
                    agent.groups.clear()
                    agent.groups.add(role)
                    # Also update the agent's role field if it exists
                    agent.role = role
                except Exception as e:
                    return Response(
                        {"message": f"Error updating role: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            agent.save()

            # Update many-to-many departments
            agent.department.set(departments)

            return Response({
                "message": "Agent updated successfully.",
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"message": f"An error occurred while updating the agent: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
