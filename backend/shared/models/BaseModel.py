from django.db import models
from django.conf import settings
from django_currentuser.middleware import get_current_user

from util.Constants import STATUS_CHOICES


class FilterManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()

    def for_user(self, user=None, filter_by_client=True):
        user = user or get_current_user()
        queryset = self.get_queryset()
        # if filter_by_client and user and user.is_authenticated and hasattr(user, 'business'):
        #     # queryset = queryset.filter(business=user.business, created_by=user).distinct()
        #     queryset = queryset.filter(business=user.business).distinct()

        return queryset
    
    def for_business(self, user=None, filter_by_client=True):
        user = user or get_current_user()
        queryset = self.get_queryset()
        # if filter_by_client and user and user.is_authenticated and hasattr(user, 'business'):
        #     queryset = queryset.filter(business=user.business).distinct()

        return queryset
    
    def for_me(self, user=None, filter_by_client=True):
        user = user or get_current_user()
        queryset = self.get_queryset()
        # if filter_by_client and user and user.is_authenticated and hasattr(user, 'business'):
        #     queryset = queryset.filter(business=user.business, created_by=user).distinct()

        return queryset




class BaseEntity(models.Model):

    id = models.BigAutoField(primary_key=True)
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='A')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_%(class)s_objects',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    date_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='updated_%(class)s_objects',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # business = models.ForeignKey(
    #     "users.Business",
    #     on_delete=models.CASCADE,
    #     null=True,
    #     blank=True,
    # )

    objects = FilterManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        current_user = get_current_user()

        if current_user and current_user.is_authenticated:
            if not self.pk:
                self.created_by = current_user
                # if hasattr(current_user, 'business') and current_user.business:
                #     self.business = current_user.business

            self.updated_by = current_user

        super(BaseEntity, self).save(*args, **kwargs)
