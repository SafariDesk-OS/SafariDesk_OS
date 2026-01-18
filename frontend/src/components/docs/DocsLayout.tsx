import React from 'react';
import { useTheme } from '../../docs';
import { DocsHeader, DocsSidebar } from './';

interface DocsLayoutProps {
  children: React.ReactNode;
}

const DocsLayout: React.FC<DocsLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <DocsHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-16 left-0 bottom-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:top-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <DocsSidebar onItemClick={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
