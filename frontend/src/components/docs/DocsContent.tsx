import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../../docs';

interface DocsContentProps {
  content: string;
  title: string;
  description: string;
}

const DocsContent: React.FC<DocsContentProps> = ({ content, title, description }) => {
  const { theme } = useTheme();

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className={`text-2xl font-bold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={`text-xl font-semibold mb-3 mt-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={`text-lg font-medium mb-2 mt-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className={`text-base font-medium mb-2 mt-3 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className={`mb-3 text-sm leading-normal ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className={`list-disc pl-5 mb-3 text-sm ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className={`list-decimal pl-5 mb-3 text-sm ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="mb-1 text-sm">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 border-primary-500 pl-4 py-2 mb-4 italic ${
        theme === 'dark' 
          ? 'bg-gray-800 text-gray-300' 
          : 'bg-primary-50 text-gray-700'
      }`}>
        {children}
      </blockquote>
    ),
    code: ({ inline, children }: any) => 
      inline ? (
        <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${
          theme === 'dark' 
            ? 'bg-gray-700 text-pink-300' 
            : 'bg-gray-100 text-pink-600'
        }`}>
          {children}
        </code>
      ) : (
        <code className={`block px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-300' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {children}
        </code>
      ),
    pre: ({ children }: any) => (
      <pre className={`mb-4 rounded-lg overflow-x-auto ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        {children}
      </pre>
    ),
    a: ({ href, children }: any) => (
      <a
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`font-medium underline decoration-2 underline-offset-2 hover:no-underline ${
          theme === 'dark' 
            ? 'text-primary-400 hover:text-primary-300' 
            : 'text-primary-600 hover:text-primary-800'
        }`}
      >
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className={`w-full border-collapse border ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className={`border px-4 py-2 text-left font-medium ${
        theme === 'dark' 
          ? 'border-gray-700 bg-gray-800 text-white' 
          : 'border-gray-200 bg-gray-50 text-gray-900'
      }`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`border px-4 py-2 ${
        theme === 'dark' 
          ? 'border-gray-700 text-gray-300' 
          : 'border-gray-200 text-gray-700'
      }`}>
        {children}
      </td>
    ),
    img: ({ src, alt, title }: any) => {
      // Handle relative image paths
      const imageSrc = src?.startsWith('/') ? src : `/src/assets/docs/${src}`;
      return (
        <div className="my-6">
          <img
            src={imageSrc}
            alt={alt || 'Documentation image'}
            title={title}
            className={`max-w-full h-auto rounded-lg border shadow-sm ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
            loading="lazy"
          />
          {(alt || title) && (
            <p className={`text-sm text-center mt-2 italic ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {alt || title}
            </p>
          )}
        </div>
      );
    },
    hr: () => (
      <hr className={`my-8 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`} />
    ),
  };

  return (
    <div className="min-h-screen">
      {/* Content Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h1>
        {description && (
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {description}
          </p>
        )}
      </div>

      {/* Markdown Content */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Navigation Footer */}
      <div className={`mt-16 pt-8 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Found an issue with this page? 
            <a 
              href="https://github.com/SafariDeskTicketing/SafariDesk/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`ml-1 font-medium hover:underline ${
                theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
              }`}
            >
              Report it on GitHub
            </a>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Last updated: {new Date().toLocaleDateString()}
            </span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`flex items-center space-x-1 hover:underline ${
                theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
              }`}
            >
              <span>Back to top</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsContent;
