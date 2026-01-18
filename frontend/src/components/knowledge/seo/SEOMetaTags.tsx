import React, { useEffect } from 'react';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  type?: 'website' | 'article';
  image?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  articleSection?: string;
  readingTime?: number;
}

const SEOMetaTags: React.FC<SEOMetaTagsProps> = ({
  title,
  description,
  keywords = [],
  type = 'website',
  image,
  url,
  author,
  publishedAt,
  modifiedAt,
  articleSection,
  readingTime,
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    // Open Graph tags
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:site_name', 'SafariDesk', true);

    if (url) {
      updateMetaTag('og:url', url, true);
    }

    if (image) {
      updateMetaTag('og:image', image, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);

    if (image) {
      updateMetaTag('twitter:image', image);
    }

    // Article-specific tags
    if (type === 'article') {
      if (author) updateMetaTag('author', author);
      if (publishedAt) updateMetaTag('article:published_time', publishedAt, true);
      if (modifiedAt) updateMetaTag('article:modified_time', modifiedAt, true);
      if (articleSection) updateMetaTag('article:section', articleSection, true);
      if (author) updateMetaTag('article:author', author, true);
    }
  }, [title, description, keywords, type, image, url, author, publishedAt, modifiedAt, articleSection, readingTime]);

  // This component doesn't render anything
  return null;
};

export default SEOMetaTags;
