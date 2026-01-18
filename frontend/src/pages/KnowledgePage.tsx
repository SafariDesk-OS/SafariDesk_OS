import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import KBLayout from '../components/knowledge/KBLayout';
import KBDashboard from './knowledge/shared/KBDashboard';
import PublicKBInterface from './knowledge/public/PublicKBInterface';
import ArticleList from './knowledge/agent/ArticleList';
import ArticleDetail from './knowledge/agent/ArticleDetail';
import ComprehensiveArticleEditor from './knowledge/agent/ComprehensiveArticleEditor';
import CategoryManager from './knowledge/shared/CategoryManager';
import KBAnalytics from './knowledge/admin/KBAnalytics';
import KBSettings from './knowledge/admin/KBSettings';
import ArticleApproval from './knowledge/admin/ArticleApproval';
import { useAuthStore } from '../stores/authStore';
import { 
  shouldShowPublicInterface,
  canAccessKBDashboard, 
  canCreateArticles, 
  canViewAnalytics, 
  canManageSettings, 
  canViewApprovalQueue 
} from '../utils/kbPermissions';

const KnowledgePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  // For non-authenticated users or customers, show the public interface
  if (!isAuthenticated || shouldShowPublicInterface(user)) {
    return <PublicKBInterface />;
  }

  // Users must have dashboard access to proceed
  if (!canAccessKBDashboard(user)) {
    return <PublicKBInterface />;
  }

  return (
    <KBLayout>
      <Routes>
        {/* Default route - show dashboard */}
        <Route index element={<KBDashboard />} />
        
        {/* Article routes */}
        <Route path="articles">
          <Route index element={<ArticleList />} />
          <Route path="new" element={
            canCreateArticles(user) ? 
              <ComprehensiveArticleEditor /> : 
              <Navigate to="/knowledge" replace />
          } />
          <Route path=":slug" element={<ArticleDetail />} />
          <Route path=":slug/edit" element={
            canCreateArticles(user) ? 
              <ComprehensiveArticleEditor /> : 
              <Navigate to="/knowledge" replace />
          } />
        </Route>
        
        {/* Category routes */}
        <Route path="categories" element={<CategoryManager />} />
        <Route path="categories/:slug" element={<ArticleList />} />
        
        {/* Analytics route - internal users */}
        <Route path="analytics" element={
          canViewAnalytics(user) ? 
            <KBAnalytics /> : 
            <Navigate to="/knowledge" replace />
        } />
        
        {/* Settings route - admin only */}
        <Route path="settings" element={
          canManageSettings(user) ? 
            <KBSettings /> : 
            <Navigate to="/knowledge" replace />
        } />
        
        {/* Article Approval route - admin only */}
        <Route path="admin/approval" element={
          canViewApprovalQueue(user) ? 
            <ArticleApproval /> : 
            <Navigate to="/knowledge" replace />
        } />
        
        {/* Catch all - redirect to main page */}
        <Route path="*" element={<Navigate to="/knowledge" replace />} />
      </Routes>
    </KBLayout>
  );
};

export default KnowledgePage;