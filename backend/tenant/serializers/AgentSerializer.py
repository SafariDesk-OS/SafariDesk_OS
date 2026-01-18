from rest_framework import serializers

from users.models import Users


class AgentSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=100)
    phone_number = serializers.CharField(max_length=50)
    gender = serializers.CharField(max_length=10, required=False, allow_blank=True)  # Make optional
    departments = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )



class AgentReadSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()  # Override to return list of dicts
    role = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = [
            'id',
            'name',
            'email',
            'phone_number',
            'gender',
            'department',         # this now includes both id and name
            'avatar_url',         # this now includes both id and name
            'role',
            'status',
            'is_active',
            'date_joined',
            'last_login',
            'created_at',
        ]

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_department(self, obj):
        return [
            {"id": dept.id, "name": dept.name}
            for dept in obj.department.all()
        ]

    def get_role(self, obj):
        return obj.role.name if obj.role else None

    def get_created_at(self, obj):
        """Get created_at - use date_joined as Users doesn't have created_at from BaseEntity"""
        return obj.date_joined

    

