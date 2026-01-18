import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Search, Plus, Filter, Grid3X3, List, FileText, Table as TableIcon, Edit, Trash2, Eye } from 'lucide-react';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import ArticleCard from '../../../components/knowledge/ArticleCard';
import MasonryGrid from '../../../components/knowledge/MasonryGrid';
import SEOMetaTags from '../../../components/knowledge/seo/SEOMetaTags';
import { KBArticle, KBSearchFilters } from '../../../types/knowledge';
import { useAuthStore } from '../../../stores/authStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { successNotification, errorNotification } from '../../../components/ui/Toast';
import { canCreateArticles } from '../../../utils/kbPermissions';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

// ArticleCard Skeleton Component
const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

const ArticleList: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const {
    articles,
    categories,
    isLoading,
    error,
    fetchArticles,
    fetchCategories,
    deleteArticle,
    duplicateArticle,
    setActiveFilters,
  } = useKnowledgeStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<KBSearchFilters>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<KBArticle | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [fetchArticles, fetchCategories]);

  // Filter by category if slug is provided
  useEffect(() => {
    if (slug && categories) {
      const category = categories.find(cat => cat.slug === slug);
      if (category) {
        const categoryFilters = { category: category.id.toString() };
        setLocalFilters(categoryFilters);
        setActiveFilters(categoryFilters);
        fetchArticles(categoryFilters);
      }
    }
  }, [slug, categories, setActiveFilters, fetchArticles]);

  const handleFilterChange = (key: keyof KBSearchFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    setActiveFilters(newFilters);
    fetchArticles(newFilters);
  };

  const handleColumnClick = (key: keyof KBSearchFilters, value: string) => {
    handleFilterChange(key, value);
  };

  const handleEdit = (article: KBArticle) => {
    navigate(`/knowledge/articles/${article.slug}/edit`);
  };

  const handleDelete = async (article: KBArticle) => {
    setArticleToDelete(article);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;

    try {
      await deleteArticle(articleToDelete.slug);
      setShowDeleteConfirm(false);
      setArticleToDelete(null);
      successNotification('Article deleted successfully!');
    } catch (error) {
      console.error('Failed to delete article:', error);
      errorNotification('Failed to delete article. Please try again.');
    }
  };

  const handleDuplicate = async (article: KBArticle) => {
    try {
      const duplicated = await duplicateArticle(article.slug);
      navigate(`/knowledge/articles/${duplicated.slug}/edit`);
    } catch (error) {
      console.error('Failed to duplicate article:', error);
    }
  };

  const clearFilters = () => {
    setLocalFilters({});
    setActiveFilters({});
    fetchArticles();
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  // Find the current category for SEO if we're filtering by category
  const currentCategory = localFilters.category ? 
    categories?.find(cat => cat.id.toString() === localFilters.category) : 
    undefined;

  const canCreateOrEdit = canCreateArticles(user);

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Articles
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse and manage knowledge base articles
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to Load Articles
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => fetchArticles()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMetaTags
        title={currentCategory ? 
          `${currentCategory.name} Articles | SafariDesk Knowledge Base` :
          `Articles | SafariDesk Knowledge Base`
        }
        description={currentCategory ?
          `Browse articles in the ${currentCategory.name} category of SafariDesk Knowledge Base.` :
          `Browse and search all knowledge base articles in SafariDesk.`
        }
        keywords={currentCategory ?
          [currentCategory.name, 'articles', 'knowledge base', 'documentation', 'help'] :
          ['articles', 'knowledge base', 'documentation', 'help', 'search']
        }
        type="website"
        articleSection={currentCategory?.name}
      />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentCategory ? `${currentCategory.name} Articles` : 'Articles'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentCategory 
                ? `Browse articles in the ${currentCategory.name} category`
                : 'Browse and manage knowledge base articles'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">              
            <div className="flex-1 min-w-0 lg:min-w-[300px] relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={localFilters.q || ''}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            {canCreateOrEdit && (
              <Link
                to="/knowledge/articles/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            )}
          </div>
        </div>
        
        {/* Filters and View Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              {hasActiveFilters && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.keys(localFilters).filter(key => localFilters[key as keyof KBSearchFilters]).length} filter(s) applied
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Table View"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Expandable Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={localFilters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) && categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="review">Under Review</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created After
                  </label>
                  <input
                    type="date"
                    value={localFilters.created_after || ''}
                    onChange={(e) => handleFilterChange('created_after', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Published After
                  </label>
                  <input
                    type="date"
                    value={localFilters.published_after || ''}
                    onChange={(e) => handleFilterChange('published_after', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by author..."
                    value={localFilters.author || ''}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by tags..."
                    value={localFilters.tags || ''}
                    onChange={(e) => handleFilterChange('tags', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {/* Loading State */}
        {isLoading && (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Articles Grid/List/Table */}
        {!isLoading && articles && articles.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <MasonryGrid
                articles={articles}
                showActions={canCreateOrEdit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    showActions={canCreateOrEdit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table
                  data={articles}
                  columns={[
                    {
                      key: 'title',
                      header: 'Title',
                      sortable: true,
                      render: (value, article) => (
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/knowledge/articles/${article.slug}`)}>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-xs" title={value}>
                              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                            </div>
                            {article.excerpt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'category',
                      header: 'Category',
                      sortable: true,
                      render: (value, article) => (
                        <button
                          onClick={() => handleColumnClick('category', article.category?.id?.toString() || '')}
                          className="text-left"
                        >
                          <Badge variant="secondary" className="text-xs hover:bg-gray-300 dark:hover:bg-gray-600">
                            {article.category?.name || 'Uncategorized'}
                          </Badge>
                        </button>
                      ),
                    },
                    {
                      key: 'author',
                      header: 'Author',
                      sortable: true,
                      render: (value, article) => (
                        <button
                          onClick={() => handleColumnClick('author', article.author?.id?.toString() || '')}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
                        >
                          {article.author?.first_name && article.author?.last_name 
                            ? `${article.author.first_name} ${article.author.last_name}`
                            : article.author?.username || 'Unknown'}
                        </button>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      sortable: true,
                      render: (value) => (
                        <button
                          onClick={() => handleColumnClick('status', value)}
                          className="text-left"
                        >
                          <Badge
                            variant={
                              value === 'published'
                                ? 'success'
                                : value === 'draft'
                                ? 'warning'
                                : value === 'review'
                                ? 'info'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {value === 'published' ? 'Published' : value === 'draft' ? 'Draft' : value === 'review' ? 'Under Review' : 'Archived'}
                          </Badge>
                        </button>
                      ),
                    },
                    /*{
                      key: 'difficulty_level',
                      header: 'Difficulty',
                      sortable: true,
                      render: (value) => (
                        <Badge
                          variant={
                            value === 'beginner'
                              ? 'success'
                              : value === 'intermediate'
                              ? 'warning'
                              : 'error'
                          }
                          className="text-xs"
                        >
                          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'}
                        </Badge>
                      ),
                    },*/
                    /*{
                      key: 'view_count',
                      header: 'Views',
                      sortable: true,
                      render: (value) => (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {value || 0}
                        </span>
                      ),
                    },*/
                    {
                      key: 'created_at',
                      header: 'Created',
                      sortable: true,
                      render: (value, article) => (
                        <button
                          onClick={() => handleColumnClick('created_after', new Date(value).toISOString().split('T')[0])}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
                        >
                          {new Date(value).toLocaleDateString()}
                        </button>
                      ),
                    },
                    {
                      key: 'published_at',
                      header: 'Published',
                      sortable: true,
                      render: (value, article) => (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {value ? (
                            <button
                              onClick={() => handleColumnClick('published_after', new Date(value).toISOString().split('T')[0])}
                              className="hover:text-primary-600 dark:hover:text-primary-400 text-left"
                            >
                              {new Date(value).toLocaleDateString()}
                            </button>
                          ) : (
                            <span>Not published</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'tags',
                      header: 'Tags',
                      sortable: false,
                      render: (value, article) => (
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {article.tags && article.tags.length > 0 ? (
                            article.tags.slice(0, 2).map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => handleColumnClick('tags', tag)}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                              >
                                {tag}
                              </button>
                            ))
                          ) : (
                            <span className="text-gray-400">No tags</span>
                          )}
                          {article.tags && article.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{article.tags.length - 2}</span>
                          )}
                        </div>
                      ),
                    },
                    ...(canCreateOrEdit ? [{
                      key: 'actions' as keyof KBArticle,
                      header: 'Actions',
                      render: (_: any, article: KBArticle) => (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/knowledge/articles/${article.slug}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(article)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/*<Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(article)}
                            className="text-orange-600 hover:text-orange-800"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>*/}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(article)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    }] : []),
                  ]}
                  showPagination={false}
                />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && articles && articles.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {hasActiveFilters ? 'No articles match your filters' : 'No articles yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {hasActiveFilters 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first knowledge base article.'
                }
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              ) : canCreateOrEdit && (
                <Link
                  to="/knowledge/articles/new"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Article
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={showDeleteConfirm}
        cancel={() => {
          setShowDeleteConfirm(false);
          setArticleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Article"
        message={articleToDelete ? `Are you sure you want to delete "${articleToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default ArticleList;
