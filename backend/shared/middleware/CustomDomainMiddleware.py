"""
Custom Domain Middleware (Disabled for Single-Tenant)
"""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CustomDomainMiddleware(MiddlewareMixin):
    """
    Middleware disabled for single-tenant setup
    All custom domain routing is no longer needed
    """

    def process_request(self, request):
        """
        No-op for single-tenant - all requests go to the same instance
        """
        request.custom_domain = None
        request.custom_domain_business = None
        return None

    @staticmethod
    def clear_domain_cache(domain: str):
        """
        No-op for single-tenant
        """
        pass

    @classmethod
    def clear_domain_cache(cls, domain: str):
        """
        No-op for single-tenant
        """
        pass


