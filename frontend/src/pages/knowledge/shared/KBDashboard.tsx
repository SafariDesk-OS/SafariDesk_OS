import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  ThumbsUp, 
  Clock, 
  ArrowRight,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import ActivityFeed from '../../../components/knowledge/ActivityFeed';
import { useAuthStore } from '../../../stores/authStore';
import { canCreateArticles } from '../../../utils/kbPermissions';

const KBDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    articles, 
    categories, 
    featuredArticles, 
    popularArticles,
    isLoading, 
    fetchArticles, 
    fetchCategories, 
    fetchFeaturedArticles,
    fetchPopularArticles 
  } = useKnowledgeStore();

  useEffect(() => {
    // Load initial data
    fetchCategories();
    fetchArticles({ status: 'published', page_size: 10 });
    fetchFeaturedArticles();
    fetchPopularArticles();
  }, [fetchCategories, fetchArticles, fetchFeaturedArticles, fetchPopularArticles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalViews = articles.reduce((sum, article) => sum + (article.view_count || 0), 0);
  const totalHelpful = articles.reduce((sum, article) => sum + (article.helpful_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Knowledge Base Overview
              </h1>
              <p className="text-primary-100 text-lg">
                Manage and organize your help content effectively
              </p>
            </div>
            {canCreateArticles(user) && (
              <button
                onClick={() => navigate('/knowledge/articles/new')}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Create Article
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             onClick={() => navigate('/knowledge/articles')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Published Articles</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{articles.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {articles.filter(a => a.status === 'published').length} published
          </p>
        </div>
        
        <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             onClick={() => navigate('/knowledge/categories')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Categories</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{categories.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Organized content
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Views</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            All-time article views
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
              <ThumbsUp className="h-6 w-6 text-white" />
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Helpful Ratings</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {totalHelpful.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Positive feedback
          </p>
        </div>
      </div>

      {/* Featured & Popular Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Featured Articles</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Highlighted content</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {featuredArticles.slice(0, 4).map((article) => (
                  <div 
                    key={article.id} 
                    onClick={() => navigate(`/knowledge/articles/${article.slug}`)}
                    className="group flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {article.view_count || 0}
                        </span>
                        {article.category && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {typeof article.category === 'string' ? article.category : (article.category as any).name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Popular Articles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Popular Articles</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Most viewed content</p>
          </div>
          <div className="p-6">
            {popularArticles.length > 0 ? (
              <div className="space-y-4">
                {popularArticles.slice(0, 4).map((article, index) => (
                  <div 
                    key={article.id}
                    onClick={() => navigate(`/knowledge/articles/${article.slug}`)}
                    className="group flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {article.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {article.helpful_count || 0}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No popular articles yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Articles</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Latest published content</p>
            </div>
            <button
              onClick={() => navigate('/knowledge/articles')}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {articles.length > 0 ? (
            articles.slice(0, 5).map((article) => (
              <div 
                key={article.id}
                onClick={() => navigate(`/knowledge/articles/${article.slug}`)}
                className="group p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                        {article.category?.name || 'Uncategorized'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {article.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {article.helpful_count || 0} helpful
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      article.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : article.status === 'review'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : article.status === 'draft'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : article.status === 'archived'
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {article.status === 'review' ? 'Under Review' : article.status}
                    </span>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No articles found. Create your first article to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ActivityFeed limit={10} />
      </div>
    </div>
  );
};

export default KBDashboard;
