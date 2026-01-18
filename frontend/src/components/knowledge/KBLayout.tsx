import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  BarChart3, 
  // Settings, // Commented out with KB settings
  Home,
  FolderOpen,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { APIS } from '../../services/apis';
import http from '../../services/http';
import { 
  canViewAnalytics, 
  // canManageSettings, // Commented out with KB settings
  canViewApprovalQueue 
} from '../../utils/kbPermissions';

interface KBLayoutProps {
  children: React.ReactNode;
}

const KBLayout: React.FC<KBLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pagination, categories, articles } = useKnowledgeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  
  // Fetch KB counts
  const fetchCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        http.get(APIS.KB_ARTICLES_COUNT),
        http.get(APIS.KB_CATEGORIES_COUNT)
      ]);
      setArticleCount(articlesRes.data.count);
      setCategoryCount(categoriesRes.data.count);
    } catch (error) {
      console.error('Error fetching KB counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, location.pathname, pagination.count, categories.length, articles.length]);
  
  const navigation = [
    { name: 'Overview', href: '/knowledge', icon: Home, current: location.pathname === '/knowledge', end: true },
    { name: 'Articles', href: '/knowledge/articles', icon: BookOpen, current: location.pathname.startsWith('/knowledge/articles'), count: articleCount },
    { name: 'Categories', href: '/knowledge/categories', icon: FolderOpen, current: location.pathname.startsWith('/knowledge/categories'), count: categoryCount },
    // Search functionality temporarily commented out
    // { name: 'Search', href: '/knowledge/search', icon: Search, current: location.pathname.startsWith('/knowledge/search') },
    ...(canViewAnalytics(user) ? [
      { name: 'Analytics', href: '/knowledge/analytics', icon: BarChart3, current: location.pathname.startsWith('/knowledge/analytics') }
    ] : []),
    ...(canViewApprovalQueue(user) ? [
      { name: 'Approval', href: '/knowledge/admin/approval', icon: CheckCircle, current: location.pathname.startsWith('/knowledge/admin/approval') }
    ] : []),
    // Settings temporarily commented out - do not uncomment for now
    // ...(canManageSettings(user) ? [
    //   { name: 'Settings', href: '/knowledge/settings', icon: Settings, current: location.pathname.startsWith('/knowledge/settings') }
    // ] : []),
  ];

  const activeItem = navigation.find(item => item.current);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className={`font-semibold text-gray-800 dark:text-gray-200 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Knowledge Base</h2>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-200"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Sidebar Items */}
        <div className="flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            
            return (
              <div
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  item.current ? 'bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <Icon size={16} className={`mr-3 ${item.current ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${item.current ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-gray-300'} ${sidebarCollapsed ? 'hidden' : 'block'}`}>
                    {item.name}
                  </span>
                </div>
                {!sidebarCollapsed && 'count' in item && item.count !== null && (
                  <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                    {item.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your knowledge base content
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        {/* <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{activeItem?.name || 'Knowledge Base'}</h1>
            </div>
          </div>
        </header> */}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default KBLayout;
