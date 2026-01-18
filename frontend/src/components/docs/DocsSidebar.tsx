import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../docs';
import navigationConfig from '../../docs/navigation.json';

interface DocsSidebarProps {
  onItemClick?: () => void;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ onItemClick }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['Getting Started']);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (slug: string) => {
    return location.pathname.includes(slug);
  };

  return (
    <aside className={`h-full overflow-y-auto border-r ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="p-4">
        <nav className="space-y-2">
          {navigationConfig.navigation.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <span>{section.title}</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    expandedSections.includes(section.title) ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Section Items */}
              {expandedSections.includes(section.title) && (
                <div className="ml-4 mt-2 space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/docs/${item.slug}`}
                      onClick={onItemClick}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive(item.slug)
                          ? theme === 'dark'
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-100 text-primary-700 font-medium'
                          : theme === 'dark'
                          ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default DocsSidebar;
