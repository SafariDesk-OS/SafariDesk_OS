import React from 'react';
import ArticleCard from './ArticleCard';
import { KBArticle } from '../../types/knowledge';

interface MasonryGridProps {
  articles: KBArticle[];
  baseUrl?: string;
  showActions?: boolean;
  onEdit?: (article: KBArticle) => void;
  onDelete?: (article: KBArticle) => void;
  onDuplicate?: (article: KBArticle) => void;
  className?: string;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  articles,
  baseUrl = '/knowledge/articles',
  showActions = false,
  onEdit,
  onDelete,
  onDuplicate,
  className = '',
}) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No articles found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your search criteria or create a new article.
        </p>
      </div>
    );
  }

  return (
    <div className={`columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 ${className}`}>
      {articles.map((article) => (
        <div key={article.slug} className="break-inside-avoid mb-6">
          <ArticleCard
            article={article}
            baseUrl={baseUrl}
            showActions={showActions}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
