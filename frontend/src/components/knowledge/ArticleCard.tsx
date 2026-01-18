import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { Calendar, Eye, User, Tag, Clock, Star, Edit, Copy, Trash2 } from 'lucide-react';
import { Calendar, Eye, User, Tag, Clock, Star, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { KBArticle } from '../../types/knowledge';

interface ArticleCardProps {
  article: KBArticle;
  baseUrl?: string;
  showActions?: boolean;
  onEdit?: (article: KBArticle) => void;
  onDelete?: (article: KBArticle) => void;
  onDuplicate?: (article: KBArticle) => void;
  className?: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  baseUrl = '/knowledge/articles',
  showActions = false,
  onEdit,
  onDelete,
  // onDuplicate,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div style={{
      cursor: 'pointer',
    }} onClick={() => navigate(`/helpcenter/kb/${article.slug}`)} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Featured Image */}
      {article.metadata?.featured_image && typeof article.metadata.featured_image === 'string' ? (
        <div className="relative">
          <img
            src={article.metadata.featured_image}
            alt={article.title}
            className="w-full h-48 object-cover bg-gray-200 dark:bg-gray-700"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            onLoad={(e) => {
              // Ensure image is visible once loaded
              e.currentTarget.style.display = 'block';
            }}
          />
          {article.is_featured && (
            <div className="absolute top-2 right-2">
              <Badge variant="warning" className="bg-accent text-white border-accent">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            </div>
          )}
        </div>
      ) : article.is_featured ? (
        <div className="relative">
          <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
            <Star className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="warning" className="bg-accent text-white border-accent">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        </div>
      ) : null}
      
      {/* Article Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(article.status)}>
              {article.status}
            </Badge>
            {article.is_featured && (
              <Star className="h-4 w-4 text-accent fill-accent" />
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(article)}
                  className="h-10 w-10 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(article)}
                  className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          <Link 
            to={`/helpcenter/kb/${article.slug}`}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {article.title}
          </Link>
        </h3>

        {/* Summary */}
        {article.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs rounded-md"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Article Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {/* Category */}
            {article.category && (
              <span className="flex items-center gap-1">
                <Tag className="h-5 w-5" />
                {article.category.name}
              </span>
            )}
            
            {/* Views */}
            {/* <span className="flex items-center gap-1">
              <Eye className="h-5 w-5" />
              {article.view_count || 0}
            </span> */}
          </div>

          <div className="flex items-center gap-4">
            {/* Author */}
            {/* {article.author && (
              <span className="flex items-center gap-1">
                <User className="h-5 w-5" />
                {article.author.display_name || `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || 'Unknown Author'}
              </span>
            )} */}
            
            {/* Date */}
            <span className="flex items-center gap-1">
              {article.status === 'published' ? (
                <>
                  <Calendar className="h-5 w-5" />
                  {formatDate(article.published_at || article.created_at)}
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5" />
                  {formatDate(article.updated_at)}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
