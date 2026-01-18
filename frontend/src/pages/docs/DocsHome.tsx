import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../docs';

const DocsHome: React.FC = () => {
  const { theme } = useTheme();

  const quickLinks = [
    {
      title: 'Getting Started',
      description: 'Learn how to set up and configure SafariDesk for your team',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      links: [
        { title: 'Installation Guide', path: '/docs/getting-started/installation' },
        { title: 'Quick Setup', path: '/docs/getting-started/quick-setup' },
        { title: 'Basic Configuration', path: '/docs/getting-started/configuration' },
      ]
    },
    {
      title: 'Ticket Management',
      description: 'Master the art of handling tickets efficiently',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      links: [
        { title: 'Creating Tickets', path: '/docs/tickets/creating-tickets' },
        { title: 'Managing Workflows', path: '/docs/tickets/workflows' },
        { title: 'Automation Rules', path: '/docs/tickets/automation' },
      ]
    },
    {
      title: 'Knowledge Base',
      description: 'Build and manage your organizational knowledge',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      links: [
        { title: 'Article Management', path: '/docs/knowledge-base/articles' },
        { title: 'Categories & Tags', path: '/docs/knowledge-base/organization' },
        { title: 'Search & Discovery', path: '/docs/knowledge-base/search' },
      ]
    },
    {
      title: 'API Reference',
      description: 'Integrate SafariDesk with your existing tools',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      links: [
        { title: 'Authentication', path: '/docs/api/authentication' },
        { title: 'Tickets API', path: '/docs/api/tickets' },
        { title: 'Users API', path: '/docs/api/users' },
      ]
    }
  ];

  const features = [
    {
      title: 'Multi-tenant Architecture',
      description: 'Support multiple organizations with complete data isolation'
    },
    {
      title: 'Docker Ready',
      description: 'Deploy easily with our pre-configured Docker containers'
    },
    {
      title: 'REST API',
      description: 'Full-featured API for integrations and custom applications'
    },
    {
      title: 'Real-time Updates',
      description: 'Stay informed with live notifications and updates'
    },
    {
      title: 'Advanced Reporting',
      description: 'Generate insights with powerful analytics and reporting tools'
    },
    {
      title: 'Customizable Workflows',
      description: 'Tailor ticket workflows to match your business processes'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to SafariDesk
          </h1>
          <p className={`text-xl leading-relaxed max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your comprehensive help desk and ticket management solution. Get started with our 
            guides, explore advanced features, or dive into the API documentation.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link
            to="/docs/getting-started/installation"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Started
          </Link>
          
          <Link
            to="/docs/api/authentication"
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            API Docs
          </Link>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {quickLinks.map((section, index) => (
          <div
            key={index}
            className={`rounded-lg border p-6 transition-all duration-200 hover:shadow-lg ${
              theme === 'dark'
                ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${
                theme === 'dark' ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-600'
              }`}>
                {section.icon}
              </div>
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {section.title}
              </h3>
            </div>
            
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {section.description}
            </p>
            
            <ul className="space-y-2">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <Link
                    to={link.path}
                    className={`text-sm font-medium hover:underline ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    → {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className={`text-3xl font-bold text-center mb-8 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Key Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border ${
                theme === 'dark'
                  ? 'border-gray-700 bg-gray-800'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Support Section */}
      <div className={`rounded-lg border p-8 text-center ${
        theme === 'dark'
          ? 'border-gray-700 bg-gray-800'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <h2 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Need Help?
        </h2>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Can't find what you're looking for? We're here to help you succeed with SafariDesk.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://safaridesk.com/support"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Contact Support
          </a>
          
          <a
            href="https://github.com/SafariDeskTicketing/SafariDesk/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center px-4 py-2 rounded-md font-medium border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            Community Discussions
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocsHome;
