import React, { useEffect, useState, useCallback } from 'react';
import { 
  Lock, 
  RefreshCw, 
  FileText, 
  Eye, 
  Folder, 
  CheckCircle, 
  Edit, 
  ThumbsUp, 
  ThumbsDown, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Award,
  Activity,
  Zap,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { useAuthStore } from '../../../stores/authStore';

interface AnalyticsData {
  totalArticles: number;
  totalViews: number;
  totalCategories: number;
  publishedArticles: number;
  draftArticles: number;
  reviewArticles: number;
  archivedArticles: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  topArticles: Array<{
    id: number;
    title: string;
    views: number;
    helpfulCount: number;
  }>;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: string;
}> = ({ title, value, icon: IconComponent, color, change }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {change && (
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">{change}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <IconComponent className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const KBAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { articles, categories, fetchArticles, fetchCategories } = useKnowledgeStore();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalArticles: 0,
    totalViews: 0,
    totalCategories: 0,
    publishedArticles: 0,
    draftArticles: 0,
    reviewArticles: 0,
    archivedArticles: 0,
    helpfulVotes: 0,
    notHelpfulVotes: 0,
    topArticles: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const canViewAnalytics = user?.role === 'admin' || user?.role === 'agent';

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchArticles(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchArticles, fetchCategories]);

  useEffect(() => {
    if (canViewAnalytics) {
      loadAnalytics();
    }
  }, [canViewAnalytics, loadAnalytics]);

  useEffect(() => {
    const calculateAnalytics = () => {
      if (!articles || !categories) return;

      const totalViews = articles.reduce((sum, article) => sum + (article.view_count || 0), 0);
      const publishedArticles = articles.filter(article => article.status === 'published').length;
      const draftArticles = articles.filter(article => article.status === 'draft').length;
      const reviewArticles = articles.filter(article => article.status === 'review').length;
      const archivedArticles = articles.filter(article => article.status === 'archived').length;
      const helpfulVotes = articles.reduce((sum, article) => sum + (article.helpful_count || 0), 0);
      const notHelpfulVotes = articles.reduce((sum, article) => sum + (article.not_helpful_count || 0), 0);

      const topArticles = articles
        .filter(article => article.view_count && article.view_count > 0)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5)
        .map(article => ({
          id: article.id,
          title: article.title,
          views: article.view_count || 0,
          helpfulCount: article.helpful_count || 0,
        }));

      setAnalytics({
        totalArticles: articles.length,
        totalViews,
        totalCategories: categories.length,
        publishedArticles,
        draftArticles,
        reviewArticles,
        archivedArticles,
        helpfulVotes,
        notHelpfulVotes,
        topArticles,
      });
    };

    if (articles && categories) {
      calculateAnalytics();
    }
  }, [articles, categories]);

  if (!canViewAnalytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to view analytics.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const avgViewsPerArticle = analytics.totalArticles > 0 
    ? Math.round(analytics.totalViews / analytics.totalArticles) 
    : 0;
  
  const satisfactionRate = (analytics.helpfulVotes + analytics.notHelpfulVotes) > 0
    ? Math.round((analytics.helpfulVotes / (analytics.helpfulVotes + analytics.notHelpfulVotes)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl p-5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/20 rounded backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Analytics Dashboard
                </h1>
              </div>
              <p className="text-primary-100 text-sm">
                Comprehensive insights into your knowledge base performance
              </p>
            </div>
            <button
              onClick={loadAnalytics}
              className="flex items-center gap-2 px-3 py-2 bg-white text-primary-700 rounded text-sm font-medium hover:bg-primary-50 transition-all shadow hover:shadow-md"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             onClick={() => navigate('/knowledge/articles')}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Views</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{avgViewsPerArticle}</p>
            </div>
          </div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Articles</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalArticles}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
              {analytics.publishedArticles} published
            </span>
            {analytics.draftArticles > 0 && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                {analytics.draftArticles} drafts
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-accent-500 to-accent-600 rounded shadow-md">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <TrendingUp className="h-4 w-4 text-accent-500" />
          </div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Views</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Across all articles
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded shadow-md">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rate</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{satisfactionRate}%</p>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User Satisfaction</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.helpfulVotes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Helpful votes received
          </p>
        </div>

        <div className="group bg-gradient-to-br from-secondary-500 to-secondary-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
             onClick={() => navigate('/knowledge/categories')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Folder className="h-6 w-6 text-white" />
            </div>
            <Award className="h-6 w-6 text-white/80" />
          </div>
          <h3 className="text-sm font-medium text-secondary-100 mb-1">Categories</h3>
          <p className="text-3xl font-bold text-white">{analytics.totalCategories}</p>
          <p className="text-xs text-secondary-100 mt-2">
            Organized content structure
          </p>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Score Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement Score</h3>
          </div>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">{satisfactionRate}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">User satisfaction rate</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.helpfulVotes}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Helpful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.notHelpfulVotes}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Not Helpful</p>
            </div>
          </div>
        </div>

        {/* Content Health Card */}
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Content Health</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {analytics.publishedArticles} of {analytics.totalArticles}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.totalArticles > 0 ? (analytics.publishedArticles / analytics.totalArticles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Drafts</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {analytics.draftArticles} of {analytics.totalArticles}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.totalArticles > 0 ? (analytics.draftArticles / analytics.totalArticles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Publish Rate</span>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {analytics.totalArticles > 0 ? Math.round((analytics.publishedArticles / analytics.totalArticles) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Views/Article</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{avgViewsPerArticle}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {analytics.helpfulVotes + analytics.notHelpfulVotes}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{analytics.publishedArticles}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">In Draft</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{analytics.draftArticles}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Top Performing Articles
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Most viewed and helpful content</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {analytics.topArticles.length > 0 ? (
            <div className="space-y-3">
              {analytics.topArticles.map((article, index) => {
                const rankColors = [
                  'from-yellow-400 to-yellow-500',
                  'from-gray-400 to-gray-500', 
                  'from-amber-600 to-amber-700',
                  'from-primary-400 to-primary-500',
                  'from-accent-400 to-accent-500'
                ];
                
                return (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/knowledge/articles/${articles.find(a => a.id === article.id)?.slug}`)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${rankColors[index]} rounded-lg shadow-lg flex items-center justify-center`}>
                      {index === 0 ? (
                        <Award className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1 line-clamp-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {article.views.toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {article.helpfulCount} helpful
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {article.views.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">total views</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Article performance data will appear here once you have content with views
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Distribution and Feedback Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Article Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Content Distribution
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Article status breakdown</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Published Articles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {analytics.publishedArticles} ({analytics.totalArticles > 0 ? ((analytics.publishedArticles / analytics.totalArticles) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.totalArticles > 0 ? (analytics.publishedArticles / analytics.totalArticles) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Draft Articles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Draft</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {analytics.draftArticles} ({analytics.totalArticles > 0 ? ((analytics.draftArticles / analytics.totalArticles) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.totalArticles > 0 ? (analytics.draftArticles / analytics.totalArticles) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Articles</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalArticles}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Feedback Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  User Feedback
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Content helpfulness ratings</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Satisfaction Rate Circle */}
              {(analytics.helpfulVotes + analytics.notHelpfulVotes) > 0 ? (
                <>
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-4 border-green-500 mb-3">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">{satisfactionRate}%</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Rate</p>
                  </div>

                  {/* Feedback Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <ThumbsUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Helpful Votes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.helpfulVotes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {((analytics.helpfulVotes / (analytics.helpfulVotes + analytics.notHelpfulVotes)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="p-3 bg-red-500 rounded-lg">
                        <ThumbsDown className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Not Helpful Votes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.notHelpfulVotes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {((analytics.notHelpfulVotes / (analytics.helpfulVotes + analytics.notHelpfulVotes)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Feedback Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    User feedback will appear here once articles receive votes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights Banner */}
      <div className="bg-gradient-to-r from-accent-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Keep Your Content Fresh</h3>
              <p className="text-primary-100">Regular updates improve search rankings and user satisfaction</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/knowledge/articles')}
            className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-all shadow-lg"
          >
            View All Articles
          </button>
        </div>
      </div>
    </div>
  );
};

export default KBAnalytics;
