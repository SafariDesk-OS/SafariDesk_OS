import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Save, X } from 'lucide-react';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { useAuthStore } from '../../../stores/authStore';
import { CreateKBArticleDto, UpdateKBArticleDto } from '../../../types/knowledge';
import { errorNotification, warningNotification, successNotification } from '../../../components/ui/Toast';
import SafariDeskEditor from '../../../components/editor/SafariDeskEditor';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { KBArticleService } from '../../../services/kb/articles';

interface FormData {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  visibility: 'public' | 'internal' | 'restricted';
  featured: boolean;
}

const ArticleEditor: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentArticle, 
    categories, 
    isLoading, 
    fetchArticle, 
    fetchCategories,
    createArticle, 
    updateArticle 
  } = useKnowledgeStore();
  
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    visibility: 'public',
    featured: false,
  });

  const [originalFormData, setOriginalFormData] = useState(formData);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEditMode = Boolean(slug);
  const canEdit = user?.role === 'admin' || user?.role === 'agent';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'superuser';

  // Track changes for unsaved warning
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasUnsavedChanges(formChanged);
  }, [formData, originalFormData]);

  // Set up beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Enhanced navigation handler
  const handleNavigation = useCallback((targetPath: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(targetPath);
      setShowUnsavedWarning(true);
    } else {
      navigate(targetPath);
    }
  }, [hasUnsavedChanges, navigate]);

  const confirmNavigation = () => {
    if (pendingNavigation) {
      setHasUnsavedChanges(false);
      navigate(pendingNavigation);
      setShowUnsavedWarning(false);
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowUnsavedWarning(false);
    setPendingNavigation(null);
  };

  useEffect(() => {
    if (!canEdit) {
      navigate('/knowledge');
      return;
    }
    
    fetchCategories();
    
    if (isEditMode && slug) {
      fetchArticle(slug);
    }
  }, [slug, isEditMode, fetchArticle, fetchCategories, canEdit, navigate]);

  useEffect(() => {
    if (isEditMode && currentArticle) {
      const newFormData = {
        title: currentArticle.title,
        summary: currentArticle.excerpt || '',
        content: currentArticle.content || '',
        category: typeof currentArticle.category === 'object' 
          ? currentArticle.category.id.toString() 
          : currentArticle.category || '',
        tags: currentArticle.tags || [],
        status: currentArticle.status,
        visibility: currentArticle.is_public ? 'public' : 'internal',
        featured: currentArticle.is_featured || false,
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
    }
  }, [isEditMode, currentArticle]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      warningNotification('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const submitData: CreateKBArticleDto = {
        title: formData.title,
        excerpt: formData.summary,
        content: formData.content,
        category: parseInt(formData.category),
        tags: formData.tags,
        status: formData.status,
        is_public: formData.visibility === 'public',
        is_featured: formData.featured,
        language: 'en',
        difficulty_level: 'beginner'
      };

      
      if (isEditMode && slug && currentArticle) {
        const updateData: UpdateKBArticleDto = {
          id: currentArticle.id,
          title: formData.title,
          excerpt: formData.summary,
          content: formData.content,
          category: parseInt(formData.category),
          tags: formData.tags,
          status: formData.status,
          is_public: formData.visibility === 'public',
          is_featured: formData.featured,
          language: 'en',
          difficulty_level: 'beginner'
        };
        await updateArticle(slug, updateData);
        
        // Reset unsaved changes flag
        setOriginalFormData(formData);
        setHasUnsavedChanges(false);
        
        successNotification('Article updated successfully!');
        navigate(`/knowledge/articles/${slug}`);
      } else {
        const newArticle = await createArticle(submitData);
        
        // Reset unsaved changes flag
        setOriginalFormData(formData);
        setHasUnsavedChanges(false);
        
        successNotification('Article created successfully!');
        navigate(`/knowledge/articles/${newArticle.slug}`);
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      errorNotification('Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && slug) {
      handleNavigation(`/knowledge/articles/${slug}`);
    } else {
      handleNavigation('/knowledge/articles');
    }
  };

  // Handle image upload for the rich text editor
  const handleImageUpload = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      // Validate file type client-side first
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type: ${file.type}. Allowed types: JPG, JPEG, PNG, GIF, WEBP`);
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 5MB');
      }
      
      console.group('Article Editor Image Upload Debug');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Upload using service
      const result = await KBArticleService.uploadImage(file);
      console.log('Upload result:', result);
      
      // Construct proper URL
      let imageUrl = result.url;
      if (!imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
      }
      console.log('Final image URL:', imageUrl);
      console.groupEnd();
      
      successNotification('Image uploaded successfully');
      return imageUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      errorNotification(`Image upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  if (isLoading && isEditMode) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Article' : 'Create New Article'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {formData.title || 'Article Title'}
          </h2>
          {formData.summary && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              {formData.summary}
            </p>
          )}
          <div 
            className="prose prose-gray dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formData.content || '<p>Article content...</p>' }}
          />
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter article title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="Brief summary of the article"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <SafariDeskEditor
              content={formData.content}
              onChange={(content: string) => handleInputChange('content', content)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg"
              onImageUpload={handleImageUpload}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use the toolbar above for rich text formatting
              {uploadingImage && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Uploading image...
                </span>
              )}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'review' | 'published' | 'archived')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="draft">Draft</option>
                {isAdmin ? (
                  <option value="published">Publish Now</option>
                ) : (
                  <option value="review">Under Review</option>
                )}
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'internal' | 'restricted')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="public">Public</option>
                <option value="internal">Internal Only</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                Featured Article
              </label>
            </div>
          </div>
        </form>
      )}
      
      {/* Unsaved Changes Warning Dialog */}
      <ConfirmDialog
        show={showUnsavedWarning}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave? All unsaved changes will be lost."
        confirmText="Leave"
        cancelText="Stay"
        variant="warning"
        onConfirm={confirmNavigation}
        cancel={cancelNavigation}
      />
    </div>
  );
};

export default ArticleEditor;
