import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  // Eye, 
  // EyeOff, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus,
  Settings,
  Globe,
  Star,
  AlertCircle,
  ChevronDown,
  Folder
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import SafariDeskEditor from '../../../components/editor/SafariDeskEditor';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { successNotification, errorNotification, warningNotification } from '../../../components/ui/Toast';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { useAuthStore } from '../../../stores/authStore';
import { CreateKBArticleDto, UpdateKBArticleDto } from '../../../types/knowledge';
import { KBArticleService } from '../../../services/kb/articles';

interface FormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  is_public: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  // difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  featured_image?: string;
  // seo_title?: string;
  // seo_description?: string;
  // seo_keywords?: string;
  scheduled_publish_at?: string;
}

const ComprehensiveArticleEditor: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentArticle, 
    categories, 
    fetchArticle, 
    fetchCategories,
    createArticle, 
    updateArticle 
  } = useKnowledgeStore();
  
  const [saving, setSaving] = useState(false);
  // const [previewMode, setPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Initialize form data with default values
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'review' | 'published' | 'archived',
    is_public: true,
    is_featured: false,
    is_pinned: false,
    // difficulty_level: 'beginner',
    featured_image: '',
    // seo_title: '',
    // seo_description: '',
    // seo_keywords: '',
    scheduled_publish_at: '',
  });
  
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const isEditMode = Boolean(slug);
  const canEdit = user?.role === 'admin' || user?.role === 'agent';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'superuser';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCategories();
    if (isEditMode && slug) {
      fetchArticle(slug);
    }
  }, [isEditMode, slug, fetchCategories, fetchArticle]);

  useEffect(() => {
    if (currentArticle && isEditMode) {
      setFormData({
        title: currentArticle.title,
        excerpt: currentArticle.excerpt || '',
        content: currentArticle.content || '',
        category: (currentArticle.category?.id ? currentArticle.category.id.toString() : '') || '',
        tags: currentArticle.tags || [],
        status: currentArticle.status,
        is_public: currentArticle.is_public,
        is_featured: currentArticle.is_featured,
        is_pinned: currentArticle.is_pinned || false,
        difficulty_level: currentArticle.difficulty_level,
        featured_image: (currentArticle.metadata?.featured_image as string) || '',
        // seo_title: currentArticle.seo_title || '',
        // seo_description: currentArticle.seo_description || '',
        // seo_keywords: currentArticle.seo_keywords || '',
        scheduled_publish_at: currentArticle.scheduled_publish_at 
          ? new Date(currentArticle.scheduled_publish_at).toISOString().slice(0, 16) 
          : '',
      });
    }
  }, [currentArticle, isEditMode]);

  // Track changes for unsaved warning
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasUnsavedChanges(formChanged);
  }, [formData, originalFormData]);

  // Set up beforeunload warning for unsaved changes (browser refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Use custom message for better UX
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Enhanced navigation handler for unsaved changes - only for specific editor buttons
  const handleEditorNavigation = useCallback((targetPath: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(targetPath);
      setShowUnsavedWarning(true);
    } else {
      navigate(targetPath);
    }
  }, [hasUnsavedChanges, navigate]);

  const confirmNavigation = () => {
    if (pendingNavigation) {
      setHasUnsavedChanges(false); // Clear flag to prevent beforeunload warning
      navigate(pendingNavigation);
      setShowUnsavedWarning(false);
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowUnsavedWarning(false);
    setPendingNavigation(null);
  };

  // Reset original data when article is fetched or after successful save
  useEffect(() => {
    if (isEditMode && currentArticle) {
      setOriginalFormData({
        title: currentArticle.title,
        excerpt: currentArticle.excerpt || '',
        content: currentArticle.content || '',
        category: (currentArticle.category?.id ? currentArticle.category.id.toString() : '') || '',
        tags: currentArticle.tags || [],
        status: currentArticle.status,
        is_public: currentArticle.is_public,
        is_featured: currentArticle.is_featured,
        is_pinned: currentArticle.is_pinned || false,
        difficulty_level: currentArticle.difficulty_level,
        featured_image: (currentArticle.metadata?.featured_image as string) || '',
        // seo_title: currentArticle.seo_title || '',
        // seo_description: currentArticle.seo_description || '',
        // seo_keywords: currentArticle.seo_keywords || '',
        scheduled_publish_at: currentArticle.scheduled_publish_at || '',
      });
    }
  }, [currentArticle, isEditMode]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (file: File) => {
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
      
      console.group('Editor Image Upload Debug');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Upload using service
      const result = await KBArticleService.uploadImage(file);
      console.log('Upload result:', result);
      
      // Construct proper URL for editor
      let imageUrl = result.url;
      if (!imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
      }
      console.log('Final editor image URL:', imageUrl);
      console.groupEnd();
      
      setShowImageModal(false);
      return imageUrl; // Return URL for the RichTextEditor to handle
    } catch (error) {
      console.error('Image upload failed:', error);
      errorNotification(`Image upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      console.group('Featured Image Upload Debug');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const result = await KBArticleService.uploadImage(file);
      console.log('Upload result:', result);
      
      // Construct proper URL for featured image display
      let imageUrl = result.url;
      if (!imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : `${window.location.origin}/${imageUrl}`;
      }
      console.log('Final featured image URL:', imageUrl);
      
      setFormData(prev => ({ ...prev, featured_image: imageUrl }));
      successNotification('Featured image uploaded successfully');
      console.groupEnd();
      
    } catch (error) {
      console.error('Featured image upload failed:', error);
      errorNotification(`Featured image upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    // Validation - ensure category is selected
    if (!formData.category || formData.category === '') {
      warningNotification('Please select a category for this article');
      return;
    }
    
    setSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateKBArticleDto = {
          id: currentArticle!.id,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: parseInt(formData.category),
          tags: formData.tags,
          status: formData.status,
          is_public: formData.is_public,
          is_featured: formData.is_featured,
          is_pinned: formData.is_pinned,
          // difficulty_level: formData.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
          // seo_title: formData.seo_title,
          // seo_description: formData.seo_description,
          // seo_keywords: formData.seo_keywords,
          scheduled_publish_at: formData.scheduled_publish_at || undefined,
          metadata: {
            featured_image: formData.featured_image,
          }
        };
        await updateArticle(slug!, updateData);
      } else {
        const createData: CreateKBArticleDto = {
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: parseInt(formData.category),
          tags: formData.tags,
          status: formData.status,
          is_public: formData.is_public,
          is_featured: formData.is_featured,
          is_pinned: formData.is_pinned,
          // difficulty_level: formData.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
          // seo_title: formData.seo_title,
          // seo_description: formData.seo_description,
          // seo_keywords: formData.seo_keywords,
          scheduled_publish_at: formData.scheduled_publish_at || undefined,
          metadata: {
            featured_image: formData.featured_image,
          }
        };
        await createArticle(createData);
      }
      
      // Show appropriate message based on status and approval workflow
      if (formData.status === 'published') {
        successNotification('Article published successfully!');
      } else if (formData.status === 'review') {
        successNotification('Article submitted for review! An admin will review and approve it.');
      } else if (formData.status === 'draft') {
        successNotification('Article saved as draft successfully!');
      } else if (formData.status === 'archived') {
        successNotification('Article archived successfully!');
      }
      
      // Reset unsaved changes flag after successful save
      setOriginalFormData(formData);
      setHasUnsavedChanges(false);
      
      // Navigate directly without warning after successful save
      navigate('/knowledge/articles');
    } catch (error) {
      console.error('Save failed:', error);
      errorNotification('Failed to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getWordCount = () => {
    return formData.content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = () => {
    return Math.max(1, Math.ceil(getWordCount() / 200));
  };

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-accent-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to edit articles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditorNavigation('/knowledge/agent/articles')}
            >
              ← Back to Articles
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditMode ? 'Edit Article' : 'Create New Article'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{getReadingTime()} min read</span>
                {formData.status && (
                  <Badge variant={formData.status === 'published' ? 'success' : formData.status === 'review' ? 'info' : 'warning'}>
                    {formData.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Category Dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2"
              >
                <Folder className="h-4 w-4" />
                {formData.category ? 
                  categories.find(c => c.id.toString() === formData.category)?.name || 'Select Category' : 
                  'Select Category'
                }
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {showCategoryDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          handleInputChange('category', category.id.toString());
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          formData.category === category.id.toString() 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            
            {/* Save Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Title and Excerpt */}
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <Input
              type="text"
              placeholder="Article title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              className="text-2xl font-bold border-none shadow-none p-0 mb-4 bg-transparent"
            />
            
            <textarea
              placeholder="Write a brief excerpt..."
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-gray-600 dark:text-gray-400"
              rows={2}
            />
          </div>

          {/* Content Editor with WYSIWYG */}
          <div
            className="flex-1 p-6 bg-white dark:bg-gray-800"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            <SafariDeskEditor
              content={formData.content}
              onChange={(content: string) => handleInputChange('content', content)}
              className={`w-full h-full ${
                dragOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
              onImageUpload={handleImageUpload}
            />
            
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary-50/80 dark:bg-primary-900/40 pointer-events-none">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-primary-500 mx-auto mb-2" />
                  <p className="text-primary-700 dark:text-primary-300 font-medium">
                    Drop image here to upload
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Pane - COMMENTED OUT */}
        {/* 
          Preview functionality has been disabled.
          The preview pane code has been removed to focus on the main editor.
        */}
      </div>

      {/* Image Upload Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="Insert Image"
      >
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />
            
            {uploadingImage ? (
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
            ) : (
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {uploadingImage ? 'Uploading image...' : 'Click to upload or drag and drop'}
            </p>
            
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              Choose File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Article Settings"
      >
        <div className="p-6 space-y-6">
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTagAdd()}
              />
              <Button variant="outline" size="sm" onClick={handleTagAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="default" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'review' | 'published' | 'archived')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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

          {/* Difficulty Level */}
          {/*<div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty_level}
              onChange={(e) => handleInputChange('difficulty_level', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>*/}

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Featured Image
            </label>
            <div className="space-y-3">
              <Input
                type="url"
                placeholder="Enter image URL or upload an image"
                value={formData.featured_image}
                onChange={(e) => handleInputChange('featured_image', e.target.value)}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFeaturedImageUpload(file);
                    };
                    input.click();
                  }}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Image
                </Button>
                
                {formData.featured_image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('featured_image', '')}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Featured preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                <Globe className="h-4 w-4 inline mr-1" />
                Public article
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                <Star className="h-4 w-4 inline mr-1" />
                Featured article
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => handleInputChange('is_pinned', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Pin to top
              </span>
            </label>
          </div>

          {/* SEO Section */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              SEO Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SEO Title
                </label>
                <Input
                  type="text"
                  placeholder="SEO optimized title..."
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta Description
                </label>
                <textarea
                  placeholder="Brief description for search engines..."
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keywords
                </label>
                <Input
                  type="text"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.seo_keywords}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                />
              </div>
            </div>
          </div> */}

          {/* Schedule Publishing */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Publishing Schedule
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="publishNow"
                  checked={publishNow}
                  onChange={(e) => {
                    setPublishNow(e.target.checked);
                    if (e.target.checked) {
                      handleInputChange('scheduled_publish_at', '');
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:bg-gray-700"
                />
                <label htmlFor="publishNow" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publish Now
                </label>
              </div>
              
              {!publishNow && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Publish Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_publish_at}
                    onChange={(e) => handleInputChange('scheduled_publish_at', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

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

export default ComprehensiveArticleEditor;
