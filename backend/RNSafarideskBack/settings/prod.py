import os
from decouple import config
from .base import *

DEBUG = False
SECRET_KEY = config("SECRET_KEY")

DATABASES = {
    'default': {
        'ENGINE': config("DB_ENGINE", default='django.db.backends.postgresql'),
        'NAME': config("DB_NAME"),
        'USER': config("DB_USER"),
        'PASSWORD': config("DB_PASSWORD"),
        'HOST': config("DB_HOST", default='127.0.0.1'),
        'PORT': config("DB_PORT", default='5432'),
        'OPTIONS': {},
    }
}

HOST_IP = config("REDIS_HOST")
REDIS_PORT = config("REDIS_PORT", cast=int)
REDIS_PASSWORD = config("REDIS_PASSWORD", default="")

if REDIS_PASSWORD:
    REDIS_URL = f'redis://:{REDIS_PASSWORD}@{HOST_IP}:{REDIS_PORT}'
else:
    REDIS_URL = f'redis://{HOST_IP}:{REDIS_PORT}'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [f"{REDIS_URL}/0"] if REDIS_PASSWORD else [(HOST_IP, REDIS_PORT)],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Celery settings
CELERY_BROKER_URL = f'{REDIS_URL}/0'
CELERY_RESULT_BACKEND = f'{REDIS_URL}/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

FILE_BASE_URL = config("FILE_BASE_URL")
FILE_URL = config("FILE_URL")
AVATARS_URL = config("AVATARS_URL")
TASK_FILE_URL = config("TASK_FILE_URL")
KB_IMAGE_URL = config("KB_IMAGE_URL")

MEDIA_URL = config("MEDIA_URL")
MEDIA_ROOT = config("MEDIA_ROOT")

FRONTEND_URL = config("FRONTEND_URL")
FRONTEND_URL_BASE = config("FRONTEND_URL_BASE")
DOMAIN_NAME = config("DOMAIN_NAME")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        }
    }
}
