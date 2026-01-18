import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Globe,
  Clock,
  Tag,
  Home,
  Mail,
  Building2,
  Bot,
  Globe2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ConfigLayoutProps {
  children: React.ReactNode;
}

const ConfigLayout: React.FC<ConfigLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'General', href: '/config/general', icon: Globe, current: location.pathname === '/config' || location.pathname === '/config/general' },
    { name: 'SLA Management', href: '/config/sla', icon: Clock, current: location.pathname.startsWith('/config/sla') },
    { name: 'Ticket Categories', href: '/config/categories', icon: Tag, current: location.pathname.startsWith('/config/categories') },
    { name: 'Departments', href: '/config/departments', icon: Home, current: location.pathname.startsWith('/config/departments') },
    { name: 'Email', href: '/config/email', icon: Mail, current: location.pathname.startsWith('/config/email') },
    { name: 'Help Centre', href: '/config/help-center', icon: Bot, current: location.pathname.startsWith('/config/help-center') },
    { name: 'Domains', href: '/config/domains', icon: Globe2, current: location.pathname.startsWith('/config/domains') },
  ];

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    const stored = localStorage.getItem('configSidebarCollapsed');
    return stored === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('configSidebarCollapsed', String(next));
      return next;
    });
  };

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 relative transition-all duration-200`}>
        <button
          onClick={toggleSidebar}
          className="absolute right-5 top-6 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className={`p-6 ${isCollapsed ? 'flex items-center justify-center' : ''}`}>
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-gray-100 transition-opacity ${isCollapsed ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
            Configuration
          </h1>
          {!isCollapsed && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage system settings</p>
          )}
        </div>
        <nav className="mt-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-6'} py-3 text-sm font-medium transition-colors ${item.current
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ConfigLayout;
