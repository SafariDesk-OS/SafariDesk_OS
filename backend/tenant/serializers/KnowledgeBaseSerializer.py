"""
Optimized Knowledge Base Serializers - Complete API Serialization
Provides efficient serialization for all KB models with proper field handling.
"""

from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from tenant.models.KnowledgeBase import (
    KBCategory, KBArticle, KBInteraction, KBAnalytics, KBSettings
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for KB references"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'display_name']
        read_only_fields = ['id']
    
    def get_display_name(self, obj):
        """Get the display name for the user"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        elif obj.username:
            return obj.username
        return obj.email


class KBCategorySerializer(serializers.ModelSerializer):
    """Serializer for KB Categories with hierarchy support"""
    children = serializers.SerializerMethodField()
    article_count = serializers.ReadOnlyField()
    slug = serializers.SlugField(required=False)  # Auto-generated if not provided
    
    class Meta:
        model = KBCategory
        fields = [
            'id', 'name', 'slug', 'description', 'parent', 'seo_title', 
            'seo_description', 'seo_keywords', 'icon', 'color', 'sort_order',
            'is_public', 'is_featured', 'metadata', 'article_count', 'level',
            'path', 'children', 'created_at', 'updated_at', 'status'
        ]
        read_only_fields = ['id', 'article_count', 'level', 'path', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        """Get child categories"""
        if hasattr(obj, 'children'):
            children = obj.children.filter(status='A').order_by('sort_order', 'name')
            return KBCategorySerializer(children, many=True, context=self.context).data
        return []


class KBCategoryDetailSerializer(KBCategorySerializer):
    """Detailed category serializer with additional information"""
    recent_articles = serializers.SerializerMethodField()
    
    class Meta(KBCategorySerializer.Meta):
        fields = KBCategorySerializer.Meta.fields + ['recent_articles']
    
    def get_recent_articles(self, obj):
        """Get recent published articles in this category"""
        recent = obj.articles.filter(
            status='published', 
            is_public=True
        ).order_by('-published_at')[:5]
        
        return [{
            'id': article.id,
            'title': article.title,
            'slug': article.slug,
            'excerpt': article.excerpt,
            'published_at': article.published_at,
            'view_count': article.view_count,
            'reading_time': article.reading_time,
        } for article in recent]


class KBArticleSerializer(serializers.ModelSerializer):
    """Serializer for KB Articles - List view"""
    category = KBCategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    author = UserBasicSerializer(read_only=True)
    helpful_percentage = serializers.ReadOnlyField()
    is_published = serializers.ReadOnlyField()
    
    class Meta:
        model = KBArticle
        fields = [
            'id', 'title', 'slug', 'excerpt', 'status', 'category', 'category_id',
            'author', 'published_at', 'created_at', 'updated_at', 'view_count',
            'helpful_count', 'not_helpful_count', 'comment_count', 'reading_time',
            # 'difficulty_level', # Commented out as requested
            'tags', 'is_featured', 'is_public', 'is_pinned',
            'helpful_percentage', 'is_published', 'language', 'quality_score',
            'seo_score', 'engagement_score', 'metadata'
        ]
        read_only_fields = [
            'id', 'author', 'view_count', 'helpful_count', 'not_helpful_count',
            'comment_count', 'created_at', 'updated_at', 'helpful_percentage',
            'is_published', 'quality_score', 'seo_score', 'engagement_score'
        ]


class KBArticleDetailSerializer(KBArticleSerializer):
    """Detailed article serializer with full content"""
    interactions = serializers.SerializerMethodField()
    related_articles = serializers.SerializerMethodField()
    
    class Meta(KBArticleSerializer.Meta):
        fields = KBArticleSerializer.Meta.fields + [
            'content', 'seo_title', 'seo_description', 'seo_keywords',
            'seo_canonical_url', 'metadata', 'version', 'previous_version_data',
            'translation_source', 'scheduled_publish_at', 'last_reviewed_at',
            'interactions', 'related_articles'
        ]
    
    def get_interactions(self, obj):
        """Get recent interactions for this article"""
        recent_interactions = obj.interactions.filter(
            is_approved=True,
            is_public=True
        ).order_by('-created_at')[:10]
        
        return [{
            'id': interaction.id,
            'type': interaction.interaction_type,
            'content': interaction.content,
            'user': interaction.user.username if interaction.user else 'Anonymous',
            'created_at': interaction.created_at,
            'rating': interaction.rating,
        } for interaction in recent_interactions]
    
    def get_related_articles(self, obj):
        """Get related articles based on category and tags"""
        related = KBArticle.objects.filter(
            status='published',
            is_public=True,
            category=obj.category
        ).exclude(id=obj.id).order_by('-view_count')[:5]
        
        return [{
            'id': article.id,
            'title': article.title,
            'slug': article.slug,
            'excerpt': article.excerpt,
            'view_count': article.view_count,
            'reading_time': article.reading_time,
        } for article in related]


class KBArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating articles"""
    
    class Meta:
        model = KBArticle
        fields = [
            'title', 'content', 'excerpt', 'category', 'status', 'is_public',
            'is_featured', 'is_pinned', 'seo_title', 'seo_description',
            'seo_keywords', 'seo_canonical_url', 'tags', 
            # 'difficulty_level', # Commented out as requested
            'language', 'metadata', 'scheduled_publish_at'
        ]
    
    def create(self, validated_data):
        """Create article with current user as author"""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class KBInteractionSerializer(serializers.ModelSerializer):
    """Serializer for KB Interactions"""
    user = UserBasicSerializer(read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    
    class Meta:
        model = KBInteraction
        fields = [
            'id', 'article', 'article_title', 'user', 'interaction_type',
            'content', 'rating', 'is_helpful', 'is_approved', 'is_public',
            'created_at', 'updated_at', 'metadata'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create interaction with current user"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class KBAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for KB Analytics"""
    article_title = serializers.CharField(source='article.title', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = KBAnalytics
        fields = [
            'id', 'article', 'article_title', 'category', 'category_name',
            'event_type', 'event_data', 'user', 'user_username', 'session_id',
            'ip_address', 'user_agent', 'referrer', 'device_type', 'browser',
            'country', 'region', 'city', 'timestamp', 'duration', 'date', 'hour'
        ]
        read_only_fields = [
            'id', 'timestamp', 'date', 'hour', 'article_title', 
            'category_name', 'user_username'
        ]


class KBSettingsSerializer(serializers.ModelSerializer):
    """Serializer for KB Settings"""
    parsed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = KBSettings
        fields = [
            'id', 'key', 'category', 'value', 'value_type', 'default_value',
            'label', 'description', 'help_text', 'is_public', 'is_required',
            'is_editable', 'validation_rules', 'sort_order', 'parsed_value',
            'created_at', 'updated_at', 'status'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'parsed_value']
    
    def get_parsed_value(self, obj):
        """Get the parsed value based on type"""
        return obj.get_value()


class KBSearchResultSerializer(serializers.Serializer):
    """Serializer for search results"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    excerpt = serializers.CharField()
    category = serializers.CharField()
    view_count = serializers.IntegerField()
    helpful_count = serializers.IntegerField()
    published_at = serializers.DateTimeField()
    reading_time = serializers.IntegerField()
    # difficulty_level = serializers.CharField() # Commented out as requested
    relevance_score = serializers.FloatField(required=False)


class KBStatsSerializer(serializers.Serializer):
    """Serializer for KB statistics"""
    total_articles = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_interactions = serializers.IntegerField()
    popular_articles = KBArticleSerializer(many=True)
    recent_searches = serializers.ListField(child=serializers.CharField())
    top_categories = KBCategorySerializer(many=True)


# Export all serializers
__all__ = [
    'UserBasicSerializer',
    'KBCategorySerializer',
    'KBCategoryDetailSerializer', 
    'KBArticleSerializer',
    'KBArticleDetailSerializer',
    'KBArticleCreateUpdateSerializer',
    'KBInteractionSerializer',
    'KBAnalyticsSerializer',
    'KBSettingsSerializer',
    'KBSearchResultSerializer',
    'KBStatsSerializer',
]
