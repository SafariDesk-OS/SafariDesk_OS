from django.contrib import admin
from django.contrib.auth.models import Group

from users.models import Users

# Register your models here.
admin.site.register(Users)
