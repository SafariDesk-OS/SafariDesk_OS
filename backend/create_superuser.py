#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'RNSafarideskBack.settings')
django.setup()

from django.contrib.auth.models import Group
from users.models import Users

# Create or get Admin group
admin_group, created = Group.objects.get_or_create(name='Admin')
print(f"{'✅ Created' if created else '✅ Found'} Admin group")

# Delete existing admin user if it exists
deleted_count, _ = Users.objects.filter(username='admin').delete()
if deleted_count:
    print(f"✅ Deleted existing admin user")

# Create superuser
user = Users.objects.create_superuser(
    username='admin',
    email='admin@safarideskopenlocal.test',
    password='admin123456',
    role=admin_group
)
user.is_staff = True
user.is_active = True
user.category = 'BUSINESS'
user.save()

print("✅ Superuser 'admin' created successfully with Admin role")
print(f"   Username: admin")
print(f"   Password: admin123456")
print(f"   Email: admin@safarideskopenlocal.test")
