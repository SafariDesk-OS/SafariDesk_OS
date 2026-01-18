from django.contrib import admin

from tenant.models import Asset
from tenant.models.SlaModel import SLAPolicy
# Register your models here.
admin.site.register(Asset)
@admin.register(SLAPolicy)
class SLAPolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description')