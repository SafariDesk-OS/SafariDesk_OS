import React, { useEffect, useState } from 'react';
import { Search, List, Grid3X3 } from 'lucide-react';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { CustomerLayout } from './layout/CustomerLayout';
import ArticleCard from '../../components/knowledge/ArticleCard';
import { KBArticle, KBCategory } from '../../types/knowledge';
import { Button } from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const CategorySkeleton: React.FC = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    ))}
  </div>
);

const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

const KBSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2 mx-auto animate-pulse"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mx-auto mt-4 animate-pulse"></div>
    </div>
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-1/4">
        <div className="sticky top-24">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2 mb-4 animate-pulse"></div>
          <CategorySkeleton />
        </div>
      </aside>
      <main className="w-full lg:w-3/4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      </main>
    </div>
  </div>
);


const KnowledgeBasePage: React.FC = () => {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      
      setLoading(true);
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          http.get(APIS.PUBLIC_KB_ARTICLES),
          http.get(APIS.PUBLIC_KB_CATEGORIES)
        ]);
        setArticles(articlesRes.data.results);
        setCategories(categoriesRes.data);
      } catch (err) {
        setError('Failed to load knowledge base. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (slug: string | null) => {
    setSelectedCategory(slug);
    setArticlesLoading(true);
    http.get(APIS.PUBLIC_KB_ARTICLES, { 
      params: { 
        ...(slug && { category_slug: slug })
      } 
    })
    .then(res => setArticles(res.data.results))
    .catch(() => setError('Failed to filter articles.'))
    .finally(() => setArticlesLoading(false));
  };

  const handleSearch = (query: string) => {
    setArticlesLoading(true);
    http.get(APIS.PUBLIC_KB_SEARCH, {
      params: {
        q: query,
      },
    })
    .then(res => setArticles(res.data.results))
    .catch(() => setError('Failed to search articles.'))
    .finally(() => setArticlesLoading(false));
  };

  useEffect(() => {
    if (searchQuery.length === 0) {
      // Optionally, refetch all articles when search is cleared
      handleCategoryClick(selectedCategory);
    }
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch(searchQuery);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  if (loading) {
    return (
      <CustomerLayout>
        <KBSkeleton />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Knowledge Base</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Find answers and solutions to common questions.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <aside className="w-full lg:w-1/4">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg flex justify-between items-center transition-colors ${
                    selectedCategory === null
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>All Articles</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`w-full text-left px-4 py-2 rounded-lg flex justify-between items-center transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{cat.article_count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="w-full lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-700' : ''}><Grid3X3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700' : ''}><List className="h-4 w-4" /></Button>
                
              </div>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-10">{error}</div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {articles.map(article => <ArticleCard key={article.id} article={article} baseUrl="/kb" />)}
                  </div>
                )}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {articles.map(article => <ArticleCard key={article.id} article={article} baseUrl="/kb" />)}
                  </div>
                )}
                {articles.length === 0 && (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <EmptyState title='Empty Data' message='No data found for your search'/>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default KnowledgeBasePage;
