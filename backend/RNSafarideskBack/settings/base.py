
import os
from datetime import timedelta
from pathlib import Path
from celery.schedules import crontab
from corsheaders.defaults import default_headers
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-mn5i2vgz1md6mmm_&$*k+n#d0&5si-t0^4$fv*y8&+q6)5&1#_"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# Optional Fernet key used for encrypting mailbox credentials/OAuth tokens.
SECRET_ENCRYPTION_KEY = config("SECRET_ENCRYPTION_KEY", default=None)

# Mail integration configuration
MAIL_INTEGRATION_OAUTH_SUCCESS_URL = config(
    "MAIL_INTEGRATION_OAUTH_SUCCESS_URL",
    default="https://app.safaridesk.io/settings/mailbox/success",
)
MAIL_INTEGRATION_OAUTH_ERROR_URL = config(
    "MAIL_INTEGRATION_OAUTH_ERROR_URL",
    default="https://app.safaridesk.io/settings/mailbox/error",
)
GOOGLE_OAUTH_CLIENT_ID = config("GOOGLE_OAUTH_CLIENT_ID", default="")
GOOGLE_OAUTH_CLIENT_SECRET = config("GOOGLE_OAUTH_CLIENT_SECRET", default="")
GOOGLE_OAUTH_REDIRECT_URI = config(
    "GOOGLE_OAUTH_REDIRECT_URI",
    default="https://api.safaridesk.io/settings/mail/integrations/google/callback/",
)
MICROSOFT_OAUTH_CLIENT_ID = config("MICROSOFT_OAUTH_CLIENT_ID", default="")
MICROSOFT_OAUTH_CLIENT_SECRET = config("MICROSOFT_OAUTH_CLIENT_SECRET", default="")
MICROSOFT_OAUTH_TENANT = config("MICROSOFT_OAUTH_TENANT", default="common")
MICROSOFT_OAUTH_REDIRECT_URI = config(
    "MICROSOFT_OAUTH_REDIRECT_URI",
    default="https://api.safaridesk.io/settings/mail/integrations/microsoft/callback/",
)
SAFARIDESK_FORWARDING_DOMAIN = config(
    "SAFARIDESK_FORWARDING_DOMAIN", default="mail.safaridesk.io"
)
MAILGUN_SIGNING_KEY = config("MAILGUN_SIGNING_KEY", default="")
MAILGUN_API_KEY = config("MAILGUN_API_KEY", default="")
MAILGUN_DOMAIN = config("MAILGUN_DOMAIN", default="mail.safaridesk.io")

CELERY_BEAT_SCHEDULE = {
    "refresh-mail-integration-tokens": {
        "task": "shared.tasks.refresh_mail_integration_tokens",
        "schedule": crontab(minute="0", hour="*/1"),
    },
    "sync-mail-integrations": {
        "task": "shared.tasks.sync_mail_integrations",
        "schedule": crontab(minute="*/5"),
    },
}

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework_simplejwt.token_blacklist",
    "rest_framework.authtoken",
    "rest_framework",
    "django_otp",
    "django_otp.plugins.otp_static",
    "django_otp.plugins.otp_totp",
    "rest_framework_simplejwt",
    "corsheaders",
    'django_celery_beat',
    'django_cron',
    "drf_yasg",
    "oauth2_provider",
    "channels",
    "users",
    "shared",
    "main",
    "tenant",
]


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),  # Token expires after 1 day
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=30),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# Swagger configuration
SWAGGER_SETTINGS = {
    "DEFAULT_INFO": {
        "description": "SafariDesk Documentation",
        "version": "1.0",
    },
    "SECURITY_DEFINITIONS": {
        "basicAuth": {
            "type": "basic",
        },
        # 'ClientDomain': {
        #     'type': 'apiKey',
        #     'in': 'header',
        #     'name': 'X-CLIENT-DOMAIN',
        # },
    },
    "SECURITY_REQUIREMENTS": [
        {"ClientDomain": []},
        {"basicAuth": []},
    ],
}


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "shared.middleware.CustomDomainMiddleware.CustomDomainMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_currentuser.middleware.ThreadLocalUserMiddleware",
    "django_otp.middleware.OTPMiddleware",
]

ROOT_URLCONF = "RNSafarideskBack.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "RNSafarideskBack.wsgi.application"

ASGI_APPLICATION = "RNSafarideskBack.asgi.application"
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("localhost", 6379)],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"



LANGUAGE_CODE = "en-us"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
TIME_ZONE = "Africa/Nairobi"

# Media files configuration
MEDIA_URL = "/uploads/"
MEDIA_ROOT = "/mnt/safaridesk"

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = []

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Start
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-client-domain",
]


CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOWED_ORIGINS = [
#     "http://127.0.0.1:3000",
#     "http://localhost:3000",
#     "http://31.97.42.73:6900",
# ]
#
# CORS_ALLOWED_ORIGIN_REGEXES = [
#     r"^https?://([a-zA-Z0-9-]+\.)*localhost:3000$",
#     r"^https?://127\.0\.0\.1:3000$",
# ]


PASSWORD_RESET_TIMEOUT = 60 * 60 * 24
AUTH_USER_MODEL = "users.Users"

# ==========================
# Email Configuration
# ==========================
EMAIL_HOST = config("EMAIL_HOST")
EMAIL_PORT = config("EMAIL_PORT", cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", default=False, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL")
DEFAULT_FROM_NAME = config("DEFAULT_FROM_NAME")

# ==========================
# Superuser
# ==========================
SUPERUSER_USERNAME = config("SUPERUSER_USERNAME")
SUPERUSER_PASSWORD = config("SUPERUSER_PASSWORD")
SUPERUSER_EMAIL = config("SUPERUSER_EMAIL")
SUPERUSER_FIRST_NAME = config("SUPERUSER_FIRST_NAME")
SUPERUSER_LAST_NAME = config("SUPERUSER_LAST_NAME")
SUPERUSER_PHONE_NUMBER = config("SUPERUSER_PHONE_NUMBER")

CORE_USERNAME = config("CORE_USERNAME")
CORE_PASSWORD = config("CORE_PASSWORD")
CORE_EMAIL = config("CORE_EMAIL")
CORE_FIRST_NAME = config("CORE_FIRST_NAME")
CORE_LAST_NAME = config("CORE_LAST_NAME")
CORE_PHONE_NUMBER = config("CORE_PHONE_NUMBER")

# Django Cron
CRON_CLASSES = [
    'shared.cron.RunEmailsCommand',
    'shared.cron.RunSLACommand',
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
           "handlers": ["console"],
           "level": "INFO",
           "propagate": True,
        },
        "tenant": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "shared": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        # Keep embeddings verbose for diagnostics
        "tenant.services.ai.embedding_service": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "tenant.services.ai.kb_search": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "tenant.services.ai.gemini_client": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "tenant.consumers.ChatConsumer": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
