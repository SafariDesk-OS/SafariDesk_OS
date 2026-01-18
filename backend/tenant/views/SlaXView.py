from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status # Import status

from tenant.models import SLA, SLATarget, SLACondition, SLAReminder, SLAEscalations, Department, BusinessHoursx, \
    Holidays, SLAEscalation, SLAConfiguration
from tenant.serializers.SlaXSerializer import SLASerializer, BusinessHoursSerializer, HolidaySerializer, SLAConfigurationSerializer
from users.models import Users


class SLAConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing SLA configuration settings"""
    queryset = SLAConfiguration.objects.all()
    serializer_class = SLAConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SLAConfiguration.objects.all()
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current SLA configuration (create if doesn't exist)"""
        config, created = SLAConfiguration.objects.get_or_create(
            pk=1,
            defaults={'allow_sla': True, 'allow_holidays': True}
        )
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_config(self, request):
        """Update the current SLA configuration"""
        config, created = SLAConfiguration.objects.get_or_create(pk=1)
        serializer = self.get_serializer(config, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'SLA configuration updated successfully',
                'data': serializer.data
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holidays.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Holidays.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

class SLAViewSet(viewsets.ModelViewSet):
    queryset = SLA.objects.all()
    serializer_class = SLASerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        queryset = SLA.objects.prefetch_related(
            'conditions',
            'targets__reminders__notify_groups',
            'targets__reminders__notify_agents',
            'targets__escalations__escalate_to_groups',
            'targets__escalations__escalate_to_agents'
        )

        # Filter by active status if requested
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset.all()

    @action(detail=False, methods=['get'])
    def choices(self, request):
        """Get all choice options for dropdowns"""
        return Response({
            'operational_hours': SLA.OPERATIONAL_HOURS_CHOICES,
            'evaluation_methods': SLA.EVALUATION_CHOICES,
            'priorities': SLATarget.PRIORITY_CHOICES,
            'time_units': SLATarget.TIME_UNITS,
            'condition_types': SLACondition.CONDITION_TYPES,
            'operators': SLACondition.OPERATORS,
            'reminder_types': SLAReminder.REMINDER_TYPES,
            'escalation_types': SLAEscalation.ESCALATION_TYPES,
        })
    @action(detail=False, methods=['get'])
    def users_and_groups(self, request):
        """Get available users and groups for assignment"""
        agents = Users.objects.filter(is_active=True, role__name='agent').values('id', 'username', 'first_name', 'last_name', 'email')
        departments = Department.objects.all().values('id', 'name')

        return Response({
            'agents': list(agents),
            'groups': list(departments)
        })

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an SLA"""
        sla = self.get_object()
        sla.is_active = True
        sla.save()
        return Response({'status': 'SLA activated'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an SLA"""
        sla = self.get_object()
        sla.is_active = False
        sla.save()
        return Response({'status': 'SLA deactivated'})

    @action(detail=False, methods=['get'])
    def business_hours(self, request):
        """
        Get all business hours configurations for the authenticated user's business.
        """
        try:
            business_hours_queryset = BusinessHoursx.objects.all()
            serializer = BusinessHoursSerializer(business_hours_queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "message": "Error retrieving business hours",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
