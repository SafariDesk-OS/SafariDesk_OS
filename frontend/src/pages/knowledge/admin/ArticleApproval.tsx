import React, { useState, useEffect } from 'react';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { 
  Clock, 
  CheckCircle, 
  User, 
  Folder, 
  Calendar, 
  Eye, 
  Check, 
  X, 
  Trash2 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { KBArticle } from '../../../types/knowledge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { successNotification, errorNotification } from '../../../components/ui/Toast';

// Simple date formatter
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown date';
  }
};

const ArticleApproval: React.FC = () => {
  const { 
    articles, 
    isLoading, 
    fetchArticles, 
    deleteArticle,
    approveArticle,
    rejectArticle 
  } = useKnowledgeStore();
  
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingArticle, setProcessingArticle] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<KBArticle | null>(null);

  // Filter articles that need approval (review status = pending approval)
  const pendingArticles = articles.filter(article => article.status === 'review');

  useEffect(() => {
    // Fetch articles under review (pending approval)
    fetchArticles({ status: 'review' });
  }, [fetchArticles]);

  const handleApprove = async (article: KBArticle) => {
    if (processingArticle) return;
    
    setProcessingArticle(article.slug);
    try {
      await approveArticle(article.slug);
      successNotification('Article approved successfully!');
    } catch (error) {
      console.error('Failed to approve article:', error);
      errorNotification('Failed to approve article. Please try again.');
    } finally {
      setProcessingArticle(null);
    }
  };

  const handleReject = async () => {
    if (!selectedArticle || processingArticle) return;
    
    setProcessingArticle(selectedArticle.slug);
    try {
      await rejectArticle(selectedArticle.slug, rejectReason);
      
      setShowRejectModal(false);
      setSelectedArticle(null);
      setRejectReason('');
      
      successNotification('Article rejected successfully!');
    } catch (error) {
      console.error('Failed to reject article:', error);
      errorNotification('Failed to reject article. Please try again.');
    } finally {
      setProcessingArticle(null);
    }
  };

  const handleDelete = async (article: KBArticle) => {
    if (processingArticle) return;
    
    setArticleToDelete(article);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    setProcessingArticle(articleToDelete.slug);
    try {
      await deleteArticle(articleToDelete.slug);
      setShowDeleteConfirm(false);
      setArticleToDelete(null);
      // Refresh the list with review status
      fetchArticles({ status: 'review' });
      successNotification('Article deleted successfully!');
    } catch (error) {
      console.error('Failed to delete article:', error);
      errorNotification('Failed to delete article. Please try again.');
    } finally {
      setProcessingArticle(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Article Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve articles submitted for publication
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{pendingArticles.length} articles pending approval</span>
        </div>
      </div>

      {/* Articles List */}
      {pendingArticles.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no articles pending approval at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingArticles.map(article => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.title}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200">
                      Pending Approval
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {article.author?.display_name || 
                         (article.author?.first_name && article.author?.last_name
                           ? `${article.author.first_name} ${article.author.last_name}`
                           : article.author?.username || 'Unknown Author')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Folder className="h-4 w-4" />
                      <span>{article.category?.name || 'Uncategorized'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(article.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{article.reading_time} min read</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedArticle(article);
                      setShowPreviewModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(article)}
                    disabled={processingArticle === article.slug}
                  >
                    {processingArticle === article.slug ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedArticle(article);
                      setShowRejectModal(true);
                    }}
                    disabled={processingArticle === article.slug}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(article)}
                    disabled={processingArticle === article.slug}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedArticle && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedArticle(null);
          }}
          title="Article Preview"
          size="xl"
        >
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedArticle.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedArticle.excerpt}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span>By {selectedArticle.author?.display_name || 'Unknown Author'}</span>
                <span>•</span>
                <span>{selectedArticle.category?.name}</span>
                <span>•</span>
                <span>{selectedArticle.reading_time} min read</span>
              </div>
            </div>
            
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
            />
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedArticle(null);
          setRejectReason('');
        }}
        title="Reject Article"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please provide a reason for rejecting this article. This will help the author improve their submission.
          </p>
          
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedArticle(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processingArticle === selectedArticle?.slug}
            >
              {processingArticle === selectedArticle?.slug ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Reject Article
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        show={showDeleteConfirm}
        cancel={() => {
          setShowDeleteConfirm(false);
          setArticleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Article"
        message={articleToDelete ? `Are you sure you want to delete "${articleToDelete.title}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ArticleApproval;
