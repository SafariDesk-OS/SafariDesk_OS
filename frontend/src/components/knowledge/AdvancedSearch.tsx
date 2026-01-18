import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { KBCategory } from '../../types/knowledge';

export interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  sortBy: 'relevance' | 'date' | 'views' | 'title';
  sortOrder: 'asc' | 'desc';
  dateRange: {
    start?: string;
    end?: string;
  };
  minRating?: number;
  author: string;
}

interface AdvancedSearchProps {
  categories: KBCategory[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  categories,
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  className = '',
}) => {
  const updateFilter = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      category: '',
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      dateRange: {},
      minRating: undefined,
      author: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy' && value === 'relevance') return false;
    if (key === 'sortOrder' && value === 'desc') return false;
    if (key === 'dateRange' && (!value.start && !value.end)) return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== undefined;
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Advanced Search
            </h3>
          </div>
        {hasActiveFilters && (            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Keywords
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter keywords..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              icon={Search}
              iconPosition="left"
            />
          </div>
        </div>

        {/* Category and Author Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author
            </label>          <Input
            type="text"
            placeholder="Author name..."
            value={filters.author}
            onChange={(e) => updateFilter('author', e.target.value)}
          />
          </div>
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="views">Views</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              placeholder="Start date"
              value={filters.dateRange.start || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
            />
            <Input
              type="date"
              placeholder="End date"
              value={filters.dateRange.end || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onSearch}
            disabled={isLoading}
            className="min-w-24"
            variant="primary"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
