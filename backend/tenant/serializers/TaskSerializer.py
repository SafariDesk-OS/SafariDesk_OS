from rest_framework import serializers
from tenant.models import Department
from tenant.models.TaskModel import Task, TaskAttachment, TaskComment, TaskReplayAttachment
from tenant.models.TicketModel import Ticket
from tenant.serializers.DepartmentSerializer import DepartmentListSerializer
from users.models import Users

class UserMiniSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = Users
        fields = ['id', 'name', 'email', 'phone_number', 'avatar_url', 'first_name', 'last_name']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class TicketMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'title', 'ticket_id', 'status', 'priority']

class TaskListSerializer(serializers.ModelSerializer):
    assigned_to = UserMiniSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    linked_ticket = TicketMiniSerializer(read_only=True)
    department = DepartmentListSerializer(read_only=True)

    class Meta:
        model = Task
        exclude = ['updated_by']



class TaskSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=True)
    task_status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=Users.objects.all(), required=False, allow_null=True)
    due_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'business', 'completed_at', 'created_at', 'updated_at']

class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    due_date = serializers.DateTimeField(required=True)
    department_id = serializers.IntegerField(required=True)
    priority = serializers.CharField(required=False, allow_blank=True, default='medium')
    ticket_id = serializers.IntegerField(required=False, allow_null=True)


class TaskAssignSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField(required=True)

class TaskAttachToTicketSerializer(serializers.Serializer):
    ticket_id = serializers.IntegerField(required=True)




class TaskAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAttachment
        fields = ['id', 'file_url', 'filename', 'description', 'created_at']

class TaskReplayAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskReplayAttachment
        fields = ['id', 'file_url', 'filename']

class TaskCommentAuthorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = ['id', 'name', 'email']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class TaskCommentSerializer(serializers.ModelSerializer):
    author = TaskCommentAuthorSerializer(read_only=True)
    attachments = TaskReplayAttachmentSerializer(source='attachment', many=True, read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'author', 'content', 'created_at', 'is_internal', 'attachments']


class TaskDetailSerializer(serializers.ModelSerializer):
    is_completed = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    linked_ticket = TicketMiniSerializer(read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    department = DepartmentListSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'task_status', 'task_trackid',
            'is_completed', 'is_overdue', 'due_date', 'completed_at', 'created_at',
            'assigned_to', 'linked_ticket', 'attachments', 'comments', 'department', 'created_by'
        ]

class TaskAddComment(serializers.Serializer):
    comment = serializers.CharField(max_length=500)
    is_internal = serializers.BooleanField()
