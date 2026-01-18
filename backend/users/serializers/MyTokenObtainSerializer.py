from django.contrib.auth.models import Permission
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        User = get_user_model()
        
        authenticate_kwargs = {
            self.username_field: attrs[self.username_field],
            'password': attrs['password'],
        }
        try:
            self.user = authenticate(**authenticate_kwargs)
        except Exception:
            self.user = None
        
        if self.user is None:
            # Check if user exists to provide better error message
            try:
                User.objects.get(email=attrs.get('username'))
                raise serializers.ValidationError({"detail": "Wrong password", "error_code": "wrong_password"})
            except User.DoesNotExist:
                raise serializers.ValidationError({"detail": "Invalid username", "error_code": "invalid_username"})
        
        if not self.user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled", "error_code": "account_disabled"})
        
        # Update last_login timestamp
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])
        
        # Call parent's validate to get the tokens
        data = super(TokenObtainPairSerializer, self).validate(attrs)
        
        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add user details to the token
        token['email'] = user.email
        token['role'] = user.role.name if user.role else None
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['first_login'] = user.first_login
        token['phone_number'] = user.phone_number
        token['status'] = user.status
        token['is_active'] = user.is_active
        token['is_staff'] = user.is_staff
        token['category'] = user.category
        token['role'] = user.role.name if user.role else None
        
        # Add department info (ManyToMany field)
        departments = user.department.all()
        token['departments'] = [{"id": dept.id, "name": dept.name} for dept in departments]

        # Add user permissions
        if user.role and user.role.name:
            auth_perms = Permission.objects.filter(group__name=user.role.name)
            permissions_data = [{"name": perm.name, "codename": perm.codename} for perm in auth_perms]
            token["permissions"] = permissions_data

        return token



