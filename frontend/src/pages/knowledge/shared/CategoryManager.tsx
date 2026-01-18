import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Eye, Grid3X3, List, Search, Lock, Folder, FileText } from 'lucide-react';
import CategoryIcon from '../../../components/knowledge/CategoryIcon';
import { useKnowledgeStore } from '../../../stores/knowledgeStore';
import { useAuthStore } from '../../../stores/authStore';
import { KBCategory } from '../../../types/knowledge';
import { Modal } from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { successNotification, errorNotification } from '../../../components/ui/Toast';
import { canManageCategories } from '../../../utils/kbPermissions';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface CategoryFormData {
  name: string;
  description: string;
  parent_id?: string;
  status: string;
}

interface CategoryFormProps {
  category?: KBCategory | null;
  categories: KBCategory[];
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    parent_id: category?.parent?.toString() || '',
    status: category?.status || 'A', // Backend uses 'A' for active, 'I' for inactive
  });

  const hasLinkedArticles = (category?.article_count || 0) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent deactivating if articles are linked
    if (category?.status === 'A' && formData.status !== 'A' && hasLinkedArticles) {
      errorNotification('Cannot deactivate a category with linked articles. Please move or delete the articles first.');
      return;
    }
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Category name"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Category description"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Parent Category
        </label>
        <select
          value={formData.parent_id}
          onChange={(e) => handleInputChange('parent_id', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">No parent (top level)</option>
          {categories
            .filter(cat => cat.id !== category?.id) // Don't allow selecting self as parent
            .map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="A">Active</option>
          <option value="I" disabled={category?.status === 'A' && hasLinkedArticles}>
            Inactive {category?.status === 'A' && hasLinkedArticles ? '(has articles)' : ''}
          </option>
        </select>
        {!category && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            New categories are created as Active by default.
          </p>
        )}
        {category?.status === 'A' && hasLinkedArticles && (
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
            This category has {category.article_count} article(s). You cannot deactivate it until all articles are removed.
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {category ? 'Update' : 'Create'} Category
        </button>
      </div>
    </form>
  );
};

const CategoryCard: React.FC<{
  category: KBCategory;
  onEdit: (category: KBCategory) => void;
  onDelete: (categorySlug: string) => void;
  onView: (category: KBCategory) => void;
}> = ({ category, onEdit, onDelete, onView }) => {
  const getStatusBadge = (status: string) => {
    // Backend uses 'A' for active, 'I' for inactive
    const isActive = status === 'A';

    const statusClass = isActive
      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

    const label = isActive ? 'Active' : 'Inactive';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <CategoryIcon 
              name={category.name} 
              icon={category.icon} 
              className="h-6 w-6 text-primary-600 dark:text-primary-400" 
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {category.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge(category.status || 'A')}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ID: {category.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {category.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {category.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span>{category.article_count || 0} articles</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(category)}
            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="View articles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Edit category"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category.slug)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    categories, 
    isLoading, 
    fetchCategories,
    fetchCategoriesForManagement,
    createCategory, 
    updateCategory, 
    deleteCategory 
  } = useKnowledgeStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KBCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<KBCategory | null>(null);

  const canManage = canManageCategories(user);

  useEffect(() => {
    // For management interface, fetch all categories including inactive ones
    fetchCategoriesForManagement();
  }, [fetchCategoriesForManagement]);

  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      const createData = {
        name: data.name,
        description: data.description,
        parent: data.parent_id ? parseInt(data.parent_id) : undefined,
      };
      
      await createCategory(createData);
      setShowForm(false);
      successNotification('Category created successfully!');
    } catch (error) {
      console.error('Failed to create category:', error);
      errorNotification('Failed to create category. Please try again.');
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    
    try {
      const updateData = {
        name: data.name,
        description: data.description,
        parent: data.parent_id ? parseInt(data.parent_id) : undefined,
        status: data.status, // Include status in update
      };
      
      await updateCategory(editingCategory.slug, updateData);
      setEditingCategory(null);
      setShowForm(false);
      successNotification('Category updated successfully!');
    } catch (error) {
      console.error('Failed to update category:', error);
      errorNotification('Failed to update category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categorySlug: string) => {
    const category = categories?.find(cat => cat.slug === categorySlug);
    if (!category) return;

    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.slug);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      successNotification('Category deleted successfully!');
    } catch (error) {
      console.error('Failed to delete category:', error);
      errorNotification('Failed to delete category. Please try again.');
    }
  };

  const handleEditCategory = (category: KBCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleViewCategory = (category: KBCategory) => {
    navigate(`/knowledge/categories/${category.slug}`);
  };

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to manage categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your knowledge base articles into categories
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Form Modal To do */} 
      {/* {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <CategoryForm
              category={editingCategory}
              categories={categories || []}
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
            />
          </div>
        </div>
      )} */}
 
      <Modal isOpen={showForm} title={editingCategory ? 'Edit Category' : 'Create New Category'} onClose={() => setShowForm(false)}>
        <CategoryForm
          category={editingCategory}
          categories={categories || []}
          onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
      {/* Content */}
      {isLoading ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table
              data={filteredCategories}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  sortable: true,
                  render: (value, category) => (
                    <div className="flex items-center space-x-3 cursor-pointer hover:opacity-75" onClick={() => navigate(`/knowledge/categories/${category.slug}`)}>
                      <CategoryIcon category={category} className="h-6 w-6" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs" title={value}>
                          {value.length > 40 ? `${value.substring(0, 40)}...` : value}
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'article_count',
                  header: 'Articles',
                  sortable: true,
                  render: (value) => (
                    <Badge variant="secondary" className="text-xs">
                      {value || 0} articles
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  render: (value) => (
                    <Badge
                      variant={value === 'A' ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {value === 'A' ? 'Active' : 'Inactive'}
                    </Badge>
                  ),
                },
                {
                  key: 'created_at',
                  header: 'Created',
                  sortable: true,
                  render: (value) => (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(value).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  key: 'actions' as keyof KBCategory,
                  header: 'Actions',
                  render: (_: any, category: KBCategory) => (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCategory(category)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.slug)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              showPagination={false}
            />
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onView={handleViewCategory}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery ? 'No categories found' : 'No categories yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms.'
              : 'Get started by creating your first category.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteConfirm}
        onConfirm={confirmDeleteCategory}
        cancel={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        variant="danger"
        message={categoryToDelete ? (
          categoryToDelete.article_count && categoryToDelete.article_count > 0
            ? `Are you sure you want to delete "${categoryToDelete.name}"? This will also remove ${categoryToDelete.article_count} articles.`
            : `Are you sure you want to delete "${categoryToDelete.name}"?`
        ) : ''}
      />
    </div>
  );
};

export default CategoryManager;
