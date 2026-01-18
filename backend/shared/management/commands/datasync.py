from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django.contrib.auth.hashers import make_password

from RNSafarideskBack.settings import SUPERUSER_EMAIL, SUPERUSER_FIRST_NAME, SUPERUSER_LAST_NAME, SUPERUSER_USERNAME, \
    SUPERUSER_PHONE_NUMBER, SUPERUSER_PASSWORD, CORE_EMAIL, CORE_FIRST_NAME, CORE_LAST_NAME, CORE_USERNAME, \
    CORE_PHONE_NUMBER, CORE_PASSWORD
from users.models import SuspiciousActivityType, Users
from util.Seeder import SUSPICIOUS_ACTIVITY_TYPES


class Command(BaseCommand):
    help = 'Syncs data for Safari Desk (Single Tenant)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting data synchronization...")
        self.create_groups()
        self.createActivies()
        self.create_superuser()
        self.create_system_user()
        self.stdout.write("Data synchronization complete")

    def createActivies(self):
        for activity_type in SUSPICIOUS_ACTIVITY_TYPES:
            if not SuspiciousActivityType.objects.filter(type_name=activity_type["type_name"]).exists():
                SuspiciousActivityType.objects.create(**activity_type)
                self.stdout.write(self.style.SUCCESS(f'Created activity type: {activity_type["type_name"]}'))

    def create_groups(self):
        """Create default user groups if they do not exist."""
        groups = ['admin', 'agent', 'customer', 'superuser']
        for group_name in groups:
            if not Group.objects.filter(name=group_name).exists():
                Group.objects.create(name=group_name)
                self.stdout.write(f"Group '{group_name}' created.")

    def create_superuser(self):
        """Create a superuser if one does not exist."""
        if not Users.objects.filter(is_superuser=True, email=SUPERUSER_EMAIL).exists():
            self.stdout.write("Creating superuser...")
            role, _ = Group.objects.get_or_create(name='admin')
            superuser = Users.objects.create(
                first_name=SUPERUSER_FIRST_NAME,
                last_name=SUPERUSER_LAST_NAME,
                username=SUPERUSER_USERNAME,
                email=SUPERUSER_EMAIL,
                phone_number=SUPERUSER_PHONE_NUMBER,
                is_superuser=True,
                is_active=True,
                is_staff=True,
                role=role,
                category="CUSTOMER",
                password=make_password("Super@12345"),
            )
            superuser.department.set([])
            superuser.groups.add(role)
            self.stdout.write(f"Superuser '{SUPERUSER_USERNAME}' created successfully.")
            return superuser
        self.stdout.write("Superuser already exists.")
        return Users.objects.get(is_superuser=True, email=SUPERUSER_EMAIL)

    def create_system_user(self):
        if not Users.objects.filter(is_superuser=True, email="system@safaridesk.io").exists():
            self.stdout.write("Creating system user ...")
            role, _ = Group.objects.get_or_create(name='admin')
            system = Users.objects.create(
                first_name="System",
                last_name="User",
                username="system",
                email="system@safaridesk.io",
                phone_number="254700000000",
                is_superuser=True,
                is_active=True,
                is_staff=True,
                role=role,
                category="SYSTEM",
                password=make_password("System@12345"),
            )
            system.department.set([])
            system.groups.add(role)
            self.stdout.write(f"System user created successfully.")
            return None
        self.stdout.write("System user already exists.")
        return None
