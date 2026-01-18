import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft, 
  ChevronRight, 
  Share2, 
  Bookmark, 
  Edit, 
  User, 
  Calendar, 
  Clock, 
  Eye, 
  Tag 
} from 'lucide-react';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import SEOMetaTags from '../../../components/knowledge/seo/SEOMetaTags';
import { useAuthStore } from '../../../stores/authStore';
import { canEditArticle } from '../../../utils/kbPermissions';
import { successNotification } from '../../../components/ui/Toast';

// Simple date formatter
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Unknown date';
  }
};

// Article Detail Skeleton
const ArticleDetailSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  </div>
);

// Rating Widget Component
const RatingWidget: React.FC<{
  helpfulCount: number;
  notHelpfulCount: number;
  onRate: (rating: number) => void;
}> = ({ helpfulCount, notHelpfulCount, onRate }) => {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onRate(1)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
      >
        <ThumbsUp className="h-4 w-4" />
        <span>Helpful ({helpfulCount})</span>
      </button>
      <button
        onClick={() => onRate(-1)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        <ThumbsDown className="h-4 w-4" />
        <span>Not Helpful ({notHelpfulCount})</span>
      </button>
    </div>
  );
};

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentArticle, isLoading, fetchArticle, markArticleHelpful, markArticleNotHelpful } = useKnowledgeStore();

  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug, fetchArticle]);

  const handleRating = async (rating: number) => {
    if (currentArticle) {
      try {
        if (rating === 1) {
          await markArticleHelpful(currentArticle.slug);
        } else if (rating === -1) {
          await markArticleNotHelpful(currentArticle.slug);
        }
      } catch (error) {
        console.error('Failed to submit rating:', error);
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/helpcenter/kb/${slug}`;
    if (navigator.share && currentArticle) {
      try {
        await navigator.share({
          title: currentArticle.title,
          text: (currentArticle.content || '').substring(0, 200) + '...',
          url: shareUrl,
        });
      } catch {
        navigator.clipboard.writeText(shareUrl);
        successNotification("Link copied to clipboard");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      successNotification("Link copied to clipboard");
    }
  };
 
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const canEdit = canEditArticle(user, currentArticle?.author?.id);

  if (isLoading || !currentArticle) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <ArticleDetailSkeleton />
      </div>
    );
  }

  return (
    <>
      <SEOMetaTags
        title={`${currentArticle.title} | SafariDesk Knowledge Base`}
        description={currentArticle.excerpt || (currentArticle.content || '').substring(0, 160)}
        keywords={[
          currentArticle.title,
          ...(currentArticle.tags || []),
          currentArticle.category?.name || '',
          'knowledge base',
          'help'
        ].filter(Boolean)}
        type="article"
        author={
          currentArticle.author && currentArticle.author.display_name
            ? currentArticle.author.display_name
            : currentArticle.author?.first_name && currentArticle.author?.last_name
            ? `${currentArticle.author.first_name} ${currentArticle.author.last_name}`.trim()
            : currentArticle.author?.username || 'Unknown Author'
        }
        publishedAt={currentArticle.published_at}
        modifiedAt={currentArticle.updated_at}
        articleSection={currentArticle.category?.name}
        readingTime={currentArticle.reading_time}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <a href="/knowledge" className="hover:text-gray-700 dark:hover:text-gray-300">
              Articles
            </a>
            {currentArticle.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span>{currentArticle.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {String(currentArticle.title)}
            </span>
          </nav>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {String(currentArticle.title)}
                </h1>
                {/* Public/Internal Badge */}
                {currentArticle.is_public ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Internal
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Share article"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              
              {canEdit && (
                <button
                  onClick={() => navigate(`/knowledge/articles/${currentArticle.slug}/edit`)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Edit article"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {currentArticle.excerpt && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {currentArticle.excerpt}
            </p>
          )}

          {/* Featured Image */}
          {currentArticle.metadata?.featured_image && 
           typeof currentArticle.metadata.featured_image === 'string' && 
           currentArticle.metadata.featured_image.trim() !== '' ? (
            <div className="mb-6">
              <img
                src={currentArticle.metadata.featured_image}
                alt={String(currentArticle.title)}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : null}

          {/* Article Metadata */}
          <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>By {currentArticle.author 
                ? currentArticle.author.display_name || `${currentArticle.author.first_name || ''} ${currentArticle.author.last_name || ''}`.trim() || 'Unknown Author'
                : 'Unknown Author'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(currentArticle.created_at)}</span>
            </div>
            
            {currentArticle.updated_at && currentArticle.updated_at !== currentArticle.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(currentArticle.updated_at)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{(currentArticle.view_count || 0).toLocaleString()} views</span>
            </div>

            {/* Status Badge */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              currentArticle.status === 'published' 
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                : currentArticle.status === 'review'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : currentArticle.status === 'draft'
                ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200'
                : currentArticle.status === 'archived'
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {currentArticle.status === 'review' ? 'Under Review' : currentArticle.status}
            </span>
          </div>
          
          {/* Tags */}
          {currentArticle.tags && currentArticle.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {currentArticle.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Article Content */}
        <main className="prose prose-lg prose-gray dark:prose-invert max-w-none mb-12">
          <div 
            className="kb-content text-gray-800 dark:text-gray-200 leading-relaxed"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: currentArticle.content || '' }}
          />
        </main>

        {/* Article Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Was this article helpful?
              </h3>
              <RatingWidget
                helpfulCount={currentArticle.helpful_count || 0}
                notHelpfulCount={currentArticle.not_helpful_count || 0}
                onRate={handleRating}
              />
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Last updated
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(currentArticle.updated_at || currentArticle.created_at)}
              </p>
            </div>
          </div>

          {/* Related Articles Section */}
          {currentArticle.category && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                More from {currentArticle.category.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore more articles in this category.
              </p>
              <button
                onClick={() => navigate(`/knowledge/categories/${currentArticle.category?.slug}`)}
                className="mt-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                View all {currentArticle.category.name} articles →
              </button>
            </div>
          )}
        </footer>
      </div>
    </>
  );
};

export default ArticleDetail;
