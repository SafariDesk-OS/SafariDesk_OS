from django.contrib.auth.models import Group
from django.db import models

from shared.models.BaseUser import BaseUser
from tenant.models.DepartmentModel import Department
# from users.models.BusinessModel import Business  # Removed
from util.Constants import STATUS_CHOICES


class Users(BaseUser):
    email = models.EmailField(unique=False)
    role = models.ForeignKey(Group, on_delete=models.CASCADE)
    department = models.ManyToManyField(Department, blank=True)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default="A")
    avatar_url = models.URLField(null=True, blank=True)
    is_superuser = models.BooleanField(default=False)
    # business = models.ForeignKey(
    #     Business,
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='user_members'
    # )
    category = models.CharField(
        max_length=100,
        choices=[('BUSINESS', 'BUSINESS'), ('CUSTOMER', 'CUSTOMER')],
        default="CUSTOMER"
    )

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="user_group",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="usergroups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="user_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = "Users"
        db_table = "users"
        verbose_name_plural = "Users"


class Customer(BaseUser):
    email = models.EmailField(unique=True)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default="A")
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    allow_login = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    # business = models.ForeignKey(
    #     Business,
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='customer_members'
    # )
    category = models.CharField(
        max_length=100,
        choices=[('BUSINESS', 'BUSINESS'), ('CUSTOMER', 'CUSTOMER'), ('ANONYMOUS', 'ANONYMOUS')],
        default="CUSTOMER"
    )

    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = "Customers"
        db_table = "customers"
        verbose_name_plural = "Customers"

