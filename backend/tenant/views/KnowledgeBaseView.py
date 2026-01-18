from django.db.models import Q, Count, Avg, Max, Min, Sum, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.paginator import Paginator
from django.db import transaction
from django.db import IntegrityError
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse, Http404
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods

from django.conf import settings
import logging

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination

from tenant.models.KnowledgeBase import (
    KBCategory, KBArticle, KBInteraction, KBAnalytics, KBSettings, get_kb_setting
)
from tenant.serializers.KnowledgeBaseSerializer import (
    KBCategorySerializer, KBCategoryDetailSerializer,
    KBArticleSerializer, KBArticleDetailSerializer, KBArticleCreateUpdateSerializer,
    KBInteractionSerializer, KBAnalyticsSerializer, KBSettingsSerializer
)

import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image

logger = logging.getLogger(__name__)

# CORS mixin for KB endpoints
class CORSMixin:
    """Mixin to add CORS headers to all responses"""
    
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        
        # Add CORS headers
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    def options(self, request, *args, **kwargs):
        """Handle CORS preflight requests"""
        response = Response(status=200)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for KB views"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class KBCategoryViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    Complete Category Management ViewSet
    Handles categories with hierarchy, SEO, and analytics
    """
    serializer_class = KBCategorySerializer
    lookup_field = 'slug'
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Dynamic queryset with business filtering"""
        queryset = KBCategory.objects.all().order_by('sort_order', 'name')
        
        # If show_all_statuses param is provided, return all categories
        # This is used by admin management interfaces
        show_all = self.request.query_params.get('show_all_statuses', 'false').lower() == 'true'
        
        if not show_all:
            # Default: only show active categories for public/regular views
            queryset = queryset.filter(status='A')
        
        return queryset
    
    def get_serializer_class(self):
        """Dynamic serializer selection based on action"""
        if self.action == 'retrieve':
            return KBCategoryDetailSerializer
        return KBCategorySerializer
    
    def get_permissions(self):
        """Dynamic permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        """Get all published articles in a category"""
        category = self.get_object()
        articles = KBArticle.objects.all().filter(
            category=category,
            status='published',
            is_public=True
        ).order_by('-published_at')

        # Apply search filter
        search = request.GET.get('search', '')
        if search:
            articles = articles.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(excerpt__icontains=search)
            )
        
        # Apply difficulty filter
        # difficulty = request.GET.get('difficulty', '')
        # if difficulty:
        #     articles = articles.filter(difficulty_level=difficulty)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(articles, request)
        
        # Simple serialization for now
        articles_data = []
        for article in page:
            articles_data.append({
                'id': article.id,
                'title': article.title,
                'slug': article.slug,
                'excerpt': article.excerpt,
                'view_count': article.view_count,
                'helpful_count': article.helpful_count,
                'published_at': article.published_at,
                'reading_time': article.reading_time,
                # 'difficulty_level': article.difficulty_level, # Commented out as requested
            })
        
        return paginator.get_paginated_response(articles_data)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get hierarchical category tree with article counts"""
        def build_tree(categories):
            tree = []
            for category in categories:
                children = KBCategory.objects.all().filter(
                    parent=category, status='A'
                ).order_by('sort_order', 'name')
                tree.append({
                    'id': category.id,
                    'name': category.name,
                    'slug': category.slug,
                    'description': category.description,
                    'icon': category.icon,
                    'color': category.color,
                    'article_count': category.article_count,
                    'children': build_tree(children) if children.exists() else []
                })
            return tree
        
        root_categories = KBCategory.objects.all().filter(
            parent=None, 
            status='A'
        ).order_by('sort_order', 'name')
        
        return Response(build_tree(root_categories))

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """
        Provides a list of all public KB categories for a specific business,
        including the count of published articles in each. Not paginated.
        """
        business_id = request.query_params.get('business_id')
        if not business_id:
            return Response({'error': 'Business ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        categories = KBCategory.objects.filter(
            business_id=business_id,
            status='A'
        ).exclude(
            name__iexact='internal'
        ).annotate(
            published_article_count=Count(
                'articles',
                filter=Q(articles__status='published', articles__is_public=True)
            )
        ).order_by('sort_order', 'name')

        data = [{
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'description': category.description,
            'icon': category.icon,
            'color': category.color,
            'article_count': category.published_article_count
        } for category in categories]

        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def count(self, request):
        """Get count of categories for the current business"""
        queryset = self.get_queryset()
        count = queryset.count()
        return Response({'count': count}, status=status.HTTP_200_OK)


class KBArticleViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    Complete Article Management ViewSet
    Handles articles with SEO, analytics, versioning, and interactions
    """
    serializer_class = KBArticleSerializer
    lookup_field = 'slug'
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'content', 'excerpt', 'tags']
    ordering_fields = ['created_at', 'published_at', 'view_count', 'helpful_count']
    ordering = ['-published_at', '-created_at']

    def _resolve_business_id(self):
        user = self.request.user
        if user and user.is_authenticated and getattr(user, 'business_id', None):
            return user.business_id

        business_id = self.request.query_params.get('business_id')
        if business_id:
            return business_id

        custom_business = getattr(self.request, 'custom_domain_business', None)
        if custom_business:
            return custom_business.id

        return None

    def _get_role_key(self, user):
        if getattr(user, 'is_superuser', False):
            return 'superuser'
        if getattr(user, 'is_staff', False):
            return 'admin'
        role = getattr(user, 'role', None)
        role_name = role if isinstance(role, str) else getattr(role, 'name', None)
        return str(role_name).strip().lower().replace(' ', '_') if role_name else None
    
    def get_queryset(self):
        """Filter articles based on user permissions and status"""
        business_id = self._resolve_business_id()
        if business_id:
            queryset = KBArticle.objects.all()
        else:
            queryset = KBArticle.objects.all()
        
        # Apply status filter from query params
        status_filter = self.request.GET.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by status for non-authenticated users
        if not self.request.user.is_authenticated and not status_filter:
            queryset = queryset.filter(status='published', is_public=True)
        elif not self.request.user.is_staff and not status_filter:
            # Regular users can see published articles + their own drafts
            queryset = queryset.filter(
                Q(status='published', is_public=True) |
                Q(author=self.request.user)
            )
        
        # Apply other filters
        category_slug = self.request.GET.get('category', '')
        if category_slug:
            try:
                if business_id:
                    category = KBCategory.objects.all().get(slug=category_slug)
                else:
                    category = KBCategory.objects.for_business(user=self.request.user).get(slug=category_slug)
                queryset = queryset.filter(category=category)
            except KBCategory.DoesNotExist:
                pass
        
        # difficulty = self.request.GET.get('difficulty', '')
        # if difficulty:
        #     queryset = queryset.filter(difficulty_level=difficulty)
        
        is_featured = self.request.GET.get('featured', '')
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)
        
        language = self.request.GET.get('language', '')
        if language:
            queryset = queryset.filter(language=language)
        
        return queryset
    
    def get_serializer_class(self):
        """Dynamic serializer selection based on action"""
        if self.action == 'retrieve':
            return KBArticleDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return KBArticleCreateUpdateSerializer
        return KBArticleSerializer
    
    def get_permissions(self):
        """Dynamic permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create a new article with approval workflow"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Save article with approval workflow logic"""
        # Check if approval is required from settings
        require_approval = get_kb_setting(
            'require_approval',
            True,
            
        )
        
        # Get the requested status from the serializer
        requested_status = serializer.validated_data.get('status', 'draft')
        
        # Apply approval workflow logic
        if require_approval and requested_status == 'published':
            # If approval is required and user wants to publish
            # Only admins (role='admin' or 'super_admin') can publish directly
            role_key = self._get_role_key(self.request.user)
            if role_key not in ['admin', 'super_admin', 'superuser']:
                # Agents and other users need approval - set to draft
                serializer.validated_data['status'] = 'draft'
                # Add a flag to indicate this needs approval
                if 'metadata' not in serializer.validated_data:
                    serializer.validated_data['metadata'] = {}
                serializer.validated_data['metadata']['pending_approval'] = True
                serializer.validated_data['metadata']['requested_status'] = 'published'
        
        # Set the author to the current user
        serializer.save(author=self.request.user)

    def update(self, request, *args, **kwargs):
        """Update article with approval workflow"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        """Save article updates with approval workflow logic"""
        # Check if approval is required from settings
        require_approval = get_kb_setting(
            'require_approval',
            True,
            
        )
        
        # Get the requested status from the serializer
        requested_status = serializer.validated_data.get('status', None)
        current_status = serializer.instance.status
        
        # Apply approval workflow logic only if status is changing to published
        if require_approval and requested_status == 'published' and current_status != 'published':
            # Only admins (role='admin' or 'super_admin') can publish directly
            role_key = self._get_role_key(self.request.user)
            if role_key not in ['admin', 'super_admin', 'superuser']:
                # Agents and other users need approval - set to draft
                serializer.validated_data['status'] = 'draft'
                # Add a flag to indicate this needs approval
                if 'metadata' not in serializer.validated_data:
                    serializer.validated_data['metadata'] = serializer.instance.metadata or {}
                serializer.validated_data['metadata']['pending_approval'] = True
                serializer.validated_data['metadata']['requested_status'] = 'published'
        
        # Save the updated article
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def count(self, request):
        """Get count of articles for the current business"""
        queryset = self.get_queryset()
        count = queryset.count()
        return Response({'count': count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, slug=None):
        """Approve an article for publication (admin only)"""
        role_key = self._get_role_key(request.user)
        if role_key not in ['admin', 'super_admin', 'superuser']:
            return Response(
                {'error': 'Permission denied. Only admins can approve articles.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        article = self.get_object()
        
        # Update article status to published
        article.status = 'published'
        article.published_at = timezone.now()
        
        # Update metadata to remove pending approval
        if article.metadata:
            article.metadata.pop('pending_approval', None)
            article.metadata.pop('requested_status', None)
            article.metadata['approved_by'] = request.user.id
            article.metadata['approved_at'] = timezone.now().isoformat()
        else:
            article.metadata = {
                'approved_by': request.user.id,
                'approved_at': timezone.now().isoformat()
            }
        
        article.save()
        
        # TODO: Send notification to article author about approval
        
        return Response({
            'message': 'Article approved successfully',
            'status': 'published'
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, slug=None):
        """Reject an article submission (admin only)"""
        role_key = self._get_role_key(request.user)
        if role_key not in ['admin', 'super_admin', 'superuser']:
            return Response(
                {'error': 'Permission denied. Only admins can reject articles.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        article = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        # Update metadata to record rejection
        if article.metadata:
            article.metadata.pop('pending_approval', None)
            article.metadata.pop('requested_status', None)
            article.metadata['rejected_by'] = request.user.id
            article.metadata['rejected_at'] = timezone.now().isoformat()
            article.metadata['rejection_reason'] = reason
        else:
            article.metadata = {
                'rejected_by': request.user.id,
                'rejected_at': timezone.now().isoformat(),
                'rejection_reason': reason
            }
        
        # Keep article as draft
        article.status = 'draft'
        article.save()
        
        # TODO: Send notification to article author about rejection
        
        return Response({
            'message': 'Article rejected successfully',
            'status': 'draft',
            'reason': reason
        })
        
    def retrieve(self, request, *args, **kwargs):
        """Get article and track view"""
        instance = self.get_object()
        
        # Track view if this is not the author viewing their own article
        should_track_view = not request.user.is_authenticated or request.user != instance.author
        
        if should_track_view:
            # Ensure session exists
            if not request.session.session_key:
                request.session.create()
            
            session_key = request.session.session_key or 'anonymous'
            
            # Check if this session already viewed this article (prevent double counting)
            cache_key = f'kb_view_{instance.id}_{session_key}'
            try:
                has_viewed = cache.get(cache_key)
            except Exception:
                has_viewed = None
            
            if not has_viewed:
                # Check if analytics record exists for this session/article
                existing_view = KBAnalytics.objects.filter(
                    article=instance,
                    event_type='view',
                    session_id=session_key
                ).exists()
                
                if not existing_view:
                    # Increment view count once (atomic)
                    KBArticle.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
                    instance.refresh_from_db(fields=['view_count'])
                    
                    # Create analytics record
                    KBAnalytics.objects.create(
                        article=instance,
                        category=instance.category,
                        event_type='view',
                        user=request.user if request.user.is_authenticated else None,
                        session_id=session_key,
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        referrer=request.META.get('HTTP_REFERER', ''),
                    )
                    
                    # Cache for 30 minutes to prevent duplicate counting
                    try:
                        cache.set(cache_key, True, 30 * 60)
                    except Exception:
                        pass
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def helpful(self, request, slug=None):
        """Mark article as helpful or not helpful"""
        article = self.get_object()
        is_helpful = request.data.get('is_helpful', True)
        
        # Ensure session exists for anonymous users
        if not request.session.session_key:
            request.session.create()
        
        # Check if user already voted
        session_key = request.session.session_key or 'anonymous'
        ip_address = request.META.get('REMOTE_ADDR', '')
        
        existing_vote = None
        if request.user.is_authenticated:
            # For authenticated users, check by user and interaction type
            existing_vote = KBInteraction.objects.filter(
                article=article,
                user=request.user,
                interaction_type__in=['helpful', 'not_helpful']
            ).first()
        else:
            # For anonymous users, check by session and IP 
            existing_vote = KBInteraction.objects.filter(
                article=article,
                user__isnull=True,
                session_id=session_key,
                interaction_type__in=['helpful', 'not_helpful']
            ).first()
        
        if existing_vote:
            return Response(
                {'error': 'You have already voted on this article'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create vote interaction
        interaction_type = 'helpful' if is_helpful else 'not_helpful'
        
        try:
            # Try to create the interaction
            # The save() method will automatically increment the counter
            interaction = KBInteraction.objects.create(
                article=article,
                user=request.user if request.user.is_authenticated else None,
                interaction_type=interaction_type,
                is_helpful=is_helpful,
                session_id=session_key,
                ip_address=ip_address,
                metadata={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
            )
            
            # Refresh article to get updated counts
            article.refresh_from_db()
            
            return Response({
                'message': 'Vote recorded successfully',
                'helpful_count': article.helpful_count,
                'not_helpful_count': article.not_helpful_count,
                'helpful_percentage': article.helpful_percentage
            })
            
        except IntegrityError:
            return Response(
                {'error': 'You have already voted on this article'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # If creation fails (likely due to unique constraint), return error
            return Response(
                {'error': 'Unable to record vote. You may have already voted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, slug=None):
        """Get or create comments for an article"""
        article = self.get_object()
        
        if request.method == 'GET':
            comments = KBInteraction.objects.all().filter(
                article=article,
                interaction_type='comment',
                is_approved=True,
                is_public=True
            ).order_by('-created_at')
            
            paginator = self.pagination_class()
            page = paginator.paginate_queryset(comments, request)
            serializer = KBInteractionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            if not get_kb_setting('enable_comments', True, ):
                return Response(
                    {'error': 'Comments are disabled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            content = request.data.get('content', '').strip()
            if not content:
                return Response(
                    {'error': 'Comment content is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create comment
            # The save() method will automatically increment the counter
            comment = KBInteraction.objects.create(
                article=article,
                user=request.user if request.user.is_authenticated else None,
                interaction_type='comment',
                content=content,
                is_approved=True,  # Auto-approve for now
                session_id=request.session.session_key,
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'user_agent': request.META.get('HTTP_USER_AGENT', '')}
            )
            
            serializer = KBInteractionSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_articles(self, request):
        """
        Provides a list of public, published knowledge base articles.
        This endpoint is designed for unauthenticated access from customer portals.
        """
        business_id = self.request.query_params.get('business_id')
        if not business_id:
            return Response({'results': [], 'count': 0})

        queryset = KBArticle.objects.filter(
            business_id=business_id,
            status='published',
            is_public=True
        )
        
        # Add category filtering by slug
        category_slug = self.request.query_params.get('category_slug', '')
        if category_slug:
            try:
                # Ensure the category belongs to the same business to prevent data leakage
                category = KBCategory.objects.get(business_id=business_id, slug=category_slug)
                queryset = queryset.filter(category=category)
            except KBCategory.DoesNotExist:
                # If an invalid category slug is passed, return no articles
                queryset = queryset.none()

        queryset = queryset.order_by('-published_at')
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = self.get_serializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_search(self, request):
        """
        Provides a public search endpoint for knowledge base articles,
        scoped to a specific business.
        """
        business_id = self.request.query_params.get('business_id')
        query = self.request.query_params.get('q', '')

        if not business_id:
            return Response({'error': 'Business ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not query:
            return Response({'results': [], 'count': 0})

        queryset = KBArticle.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(excerpt__icontains=query),
            business_id=business_id,
            status='published',
            is_public=True
        ).order_by('-published_at')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
        

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search with filters and analytics"""
        query = request.GET.get('q', '')
        if not query:
            return Response({'results': [], 'count': 0})
        
        # Build search query
        articles = self.get_queryset().filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(excerpt__icontains=query) |
            Q(tags__icontains=query) |
            Q(metadata__icontains=query)  # Search in metadata as well
        )
        
        # Track search
        KBAnalytics.objects.create(
            event_type='search',
            user=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            event_data={
                'query': query,
                'results_count': articles.count(),
                'timestamp': timezone.now().isoformat(),
            }
        )
        
        # Paginate results
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(articles, request)
        
        # Simple serialization
        results = []
        for article in page:
            results.append({
                'id': article.id,
                'title': article.title,
                'slug': article.slug,
                'excerpt': article.excerpt,
                'category': article.category.name,
                'view_count': article.view_count,
                'helpful_count': article.helpful_count,
                'published_at': article.published_at,
                'reading_time': article.reading_time,
                # 'difficulty_level': article.difficulty_level, # Commented out as requested
            })
        
        return paginator.get_paginated_response(results)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        articles = self.get_queryset().filter(
            is_featured=True,
            status='published',
            is_public=True
        ).order_by('-published_at')[:10]
        
        results = []
        for article in articles:
            results.append({
                'id': article.id,
                'title': article.title,
                'slug': article.slug,
                'excerpt': article.excerpt,
                'category': article.category.name,
                'view_count': article.view_count,
                'helpful_count': article.helpful_count,
                'published_at': article.published_at,
                'reading_time': article.reading_time,
            })
        
        return Response(results)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular articles based on view count"""
        articles = self.get_queryset().filter(
            status='published',
            is_public=True
        ).order_by('-view_count')[:10]
        
        results = []
        for article in articles:
            results.append({
                'id': article.id,
                'title': article.title,
                'slug': article.slug,
                'excerpt': article.excerpt,
                'category': article.category.name,
                'view_count': article.view_count,
                'helpful_count': article.helpful_count,
                'published_at': article.published_at,
                'reading_time': article.reading_time,
            })
        
        return Response(results)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_image(self, request):
        """Upload an image for articles"""
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file type by both extension and MIME type
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        
        file_extension = os.path.splitext(image_file.name)[1].lower()
        content_type = image_file.content_type
        
        # Check extension
        if file_extension not in allowed_extensions:
            return Response({
                'error': f'Invalid file extension: {file_extension}. Allowed types: JPG, JPEG, PNG, GIF, WEBP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check MIME type
        if content_type not in allowed_mime_types:
            return Response({
                'error': f'Invalid file type: {content_type}. Allowed types: {", ".join(allowed_mime_types)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({
                'error': 'File too large. Maximum size is 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Create directory path - save directly to MEDIA_ROOT (which is /mnt/safaridesk or /data/safaridesk-uploads/)
            upload_dir = settings.MEDIA_ROOT
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
            
            # Generate URL using the system-wide FILE_BASE_URL pattern
            # FILE_BASE_URL should be something like https://api.dev.safaridesk.io/uploads
            # So we just append the filename
            file_url = f"{settings.FILE_BASE_URL}/{unique_filename}"
            
            return Response({
                'url': file_url,
                'name': image_file.name,
                'path': unique_filename
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_featured_image(self, request, slug=None):
        """Upload a featured image for an article"""
        article = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate and upload using the same logic as general image upload
        upload_response = self.upload_image(request)
        
        if upload_response.status_code == 201:
            # Update article metadata with featured image
            if not article.metadata:
                article.metadata = {}
            
            article.metadata['featured_image'] = upload_response.data['url']
            article.save()
            
            return Response({
                'message': 'Featured image uploaded successfully',
                'url': upload_response.data['url'],
                'article': article.slug
            }, status=status.HTTP_200_OK)
        
        return upload_response


class KBAnalyticsViewSet(CORSMixin, viewsets.ReadOnlyModelViewSet):
    """
    Analytics ViewSet for Knowledge Base metrics
    Provides insights and performance data
    """
    serializer_class = KBAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Dynamic queryset with business filtering"""
        return KBAnalytics.objects.all()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard analytics"""
        # Date range
        days = int(request.GET.get('days', 7))
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Basic metrics
        total_articles = KBArticle.objects.all().filter(status='published').count()
        total_categories = KBCategory.objects.all().filter(status='A').count()
        
        # Views in period
        period_views = KBAnalytics.objects.all().filter(
            event_type='view',
            timestamp__gte=start_date
        ).count()
        
        # Popular articles
        popular_articles = KBArticle.objects.all().filter(
            status='published'
        ).order_by('-view_count')[:5]
        
        # Search queries
        search_queries = KBAnalytics.objects.all().filter(
            event_type='search',
            timestamp__gte=start_date
        ).values_list('event_data', flat=True)
        
        popular_articles_data = []
        for article in popular_articles:
            popular_articles_data.append({
                'title': article.title,
                'slug': article.slug,
                'view_count': article.view_count,
                'helpful_count': article.helpful_count,
                'category': article.category.name,
            })
        
        return Response({
            'total_articles': total_articles,
            'total_categories': total_categories,
            'period_views': period_views,
            'popular_articles': popular_articles_data,
            'search_count': len(search_queries),
            'period_days': days,
        })

    @action(detail=False, methods=['get'])
    def activity_feed(self, request):
        """Get recent knowledge base activity for dashboard"""
        limit = int(request.GET.get('limit', 10))
        
        activities = []
        
        # Get recent article publications (approved articles)
        recent_published = KBArticle.objects.all().filter(
            status='published',
            published_at__isnull=False,
            metadata__icontains='approved_by'
        ).order_by('-published_at')[:limit//2]
        
        for article in recent_published:
            activities.append({
                'id': f'approve-{article.id}',
                'type': 'approved',
                'article': {
                    'title': article.title,
                    'slug': article.slug,
                    'author': article.author.get_full_name() if article.author else 'Unknown'
                },
                'user': f'Admin User',  # Could get from metadata['approved_by'] if needed
                'timestamp': article.published_at.isoformat() if article.published_at else article.updated_at.isoformat(),
            })
        
        # Get recent article submissions (draft articles with pending_approval)
        recent_submissions = KBArticle.objects.all().filter(
            status='draft',
            metadata__icontains='pending_approval'
        ).order_by('-updated_at')[:limit//2]
        
        for article in recent_submissions:
            activities.append({
                'id': f'submit-{article.id}',
                'type': 'submitted',
                'article': {
                    'title': article.title,
                    'slug': article.slug,
                    'author': article.author.get_full_name() if article.author else 'Unknown'
                },
                'user': article.author.get_full_name() if article.author else 'Unknown',
                'timestamp': article.updated_at.isoformat(),
            })
        
        # Get recent rejections
        recent_rejections = KBArticle.objects.all().filter(
            status='draft',
            metadata__icontains='rejected_by'
        ).order_by('-updated_at')[:limit//4]
        
        for article in recent_rejections:
            rejection_reason = ''
            if article.metadata and 'rejection_reason' in article.metadata:
                rejection_reason = article.metadata['rejection_reason']
            
            activities.append({
                'id': f'reject-{article.id}',
                'type': 'rejected',
                'article': {
                    'title': article.title,
                    'slug': article.slug,
                    'author': article.author.get_full_name() if article.author else 'Unknown'
                },
                'user': 'Admin User',  # Could get from metadata['rejected_by'] if needed
                'timestamp': article.updated_at.isoformat(),
                'metadata': {
                    'rejection_reason': rejection_reason
                } if rejection_reason else {}
            })
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Return only the requested limit
        return Response(activities[:limit])
        

class KBSettingsViewSet(CORSMixin, viewsets.ModelViewSet):
    """
    Settings ViewSet for Knowledge Base configuration
    """
    serializer_class = KBSettingsSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'key'
    
    def get_queryset(self):
        """Dynamic queryset with business filtering"""
        return KBSettings.objects.all()
    
    def get_permissions(self):
        """Dynamic permissions based on action"""
        if self.action == 'public':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create a new setting"""
        # Check if user is admin
        user_role = request.user.role.name if request.user.role else None
        if user_role not in ['admin']:
            return Response(
                {'error': 'Permission denied. Only admins can modify settings.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        setting = serializer.save()
        return Response(self.get_serializer(setting).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update an existing setting by key"""
        # Check if user is admin
        user_role = request.user.role.name if request.user.role else None
        if user_role not in ['admin']:
            return Response(
                {'error': 'Permission denied. Only admins can modify settings.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        key = kwargs.get('key')
        
        try:
            setting = KBSettings.objects.all().get(key=key)
        except KBSettings.DoesNotExist:
            return Response({'error': f'Setting with key "{key}" not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Get the value from request data
        value = request.data.get('value')
        if value is not None:
            setting.value = str(value) if not isinstance(value, str) else value
            setting.save()
            
        serializer = self.get_serializer(setting)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Get a specific setting by key"""
        key = kwargs.get('key')
        
        try:
            setting = KBSettings.objects.all().get(key=key)
        except KBSettings.DoesNotExist:
            return Response({'error': f'Setting with key "{key}" not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(setting)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get public settings that can be accessed by all users"""
        public_settings = KBSettings.objects.all().filter(is_public=True)
        
        settings_data = {}
        for setting in public_settings:
            settings_data[setting.key] = setting.get_value()
        
        return Response(settings_data)
