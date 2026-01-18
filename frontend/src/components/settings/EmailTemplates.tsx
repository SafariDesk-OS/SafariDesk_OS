import React, { useState, useEffect } from 'react';
import { Edit, Plus, Save, ChevronDown } from 'lucide-react';
import { APIS } from '../../services/apis';
import http from '../../services/http';
import { Modal } from '../ui/Modal';
import { Loader } from '../loader/loader';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import Button from '../ui/Button';

interface Template {
  id: number;
  name: string;
  description: string;
  subject: string;
  body: string;
  is_active: boolean;
  type: string;
}

interface Category {
  id: number;
  name: string;
  templates: Template[];
}

export const EmailTemplates: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [placeholders, setPlaceholders] = useState<Record<string, string[]>>({});
  const [isPlaceholdersLoading, setIsPlaceholdersLoading] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('ticket');
  const [activeInput, setActiveInput] = useState<'subject' | 'body' | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  useEffect(() => {
    const fetchPlaceholders = async () => {
      if (isModalOpen) {
        setIsPlaceholdersLoading(true);
        try {
          const response = await http.get(APIS.LOAD_EMAIL_PLACEHOLDERS);
          setPlaceholders(response.data);
        } catch (error) {
          console.error('Error fetching email placeholders:', error);
        } finally {
          setIsPlaceholdersLoading(false);
        }
      }
    };

    fetchPlaceholders();
  }, [isModalOpen]);

  useEffect(() => {
    const fetchEmailTemplates = async () => {
      try {
        const response = await http.get(APIS.LOAD_EMAIL_TEMPLATES);
        setCategories(response.data.results);
      } catch (error) {
        console.error('Error fetching email templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailTemplates();
  }, []);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setTimeout(() => {
      setIsModalLoading(false);
    }, 500);
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate({ ...template });
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !selectedCategory) return;

    try {
      const payload = {
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        description: '',
        is_active: true,
      };

      await http.put(`${APIS.UPDATE_EMAIL_TEMPLATE}${editingTemplate.id}/`, payload);

      const updatedTemplates = selectedCategory.templates.map((t) =>
        t.id === editingTemplate.id ? editingTemplate : t
      );
      const updatedCategory = { ...selectedCategory, templates: updatedTemplates };
      setSelectedCategory(updatedCategory);

      const updatedCategories = categories.map((c) =>
        c.id === updatedCategory.id ? updatedCategory : c
      );
      setCategories(updatedCategories);

      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating email template:', error);
    }
  };

  const handleInputChange = (field: 'subject' | 'body', value: string) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, [field]: value });
    }
  };

  const handleVariableClick = (variable: string) => {
    if (editingTemplate && activeInput) {
      const inputElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
      const start = cursorPosition;
      const end = cursorPosition;
      const text =
        editingTemplate[activeInput].substring(0, start) +
        variable +
        editingTemplate[activeInput].substring(end);
      handleInputChange(activeInput, text);
      setTimeout(() => {
        inputElement.selectionStart = inputElement.selectionEnd = start + variable.length;
        inputElement.focus();
      }, 0);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Template Categories</h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{category.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.templates.length} templates</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTemplate(null);
          }}
          title={selectedCategory.name}
          size="4xl"
        >
          {isModalLoading ? (
            <ModalSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {Object.entries(
                  selectedCategory.templates.reduce(
                    (acc, template) => {
                      const { type } = template;
                      if (!acc[type]) {
                        acc[type] = [];
                      }
                      acc[type].push(template);
                      return acc;
                    },
                    {} as Record<string, Template[]>
                  )
                ).map(([type, templates]) => (
                  <div key={type} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 dark:text-gray-100"
                      onClick={() => setOpenAccordion(openAccordion === type ? null : type)}
                    >
                      <span className="capitalize">{type} Templates</span>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          openAccordion === type ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openAccordion === type && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                          >
                            {editingTemplate && editingTemplate.id === template.id ? (
                              <div className="space-y-4">
                                <Input
                                  label="Subject"
                                  value={editingTemplate.subject}
                                  onChange={(e) => handleInputChange('subject', e.target.value)}
                                  onFocus={() => setActiveInput('subject')}
                                  onBlur={(e) => setCursorPosition(e.target.selectionStart || 0)}
                                  fullWidth
                                />
                                <Textarea
                                  label="Body"
                                  value={editingTemplate.body}
                                  onChange={(e) => handleInputChange('body', e.target.value)}
                                  onFocus={() => setActiveInput('body')}
                                  onBlur={(e) => setCursorPosition(e.target.selectionStart || 0)}
                                  rows={6}
                                  fullWidth
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSaveEdit}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                      {template.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.subject}</p>
                                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        template.is_active
                                          ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                      }`}
                                    >
                                      {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleEditClick(template)}
                                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="md:col-span-1">
                <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Supported Variables</h4>
                  <div className="max-h-[800px] overflow-y-auto pr-2">
                    {isPlaceholdersLoading ? (
                      <VariablesSkeleton />
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(placeholders).map(([category, vars]) => (
                          <div key={category}>
                            <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 capitalize">
                              {category}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {vars.map((variable) => {
                                const fullVariable = `{{${variable}}}`;
                                const isEnabled =
                                  (editingTemplate && editingTemplate.type === category.toLowerCase()) ||
                                  (!editingTemplate && openAccordion === category.toLowerCase()) ||
                                  (editingTemplate && editingTemplate.type === 'task' && category.toLowerCase() === 'tasks') ||
                                  (!editingTemplate && openAccordion === 'task' && category.toLowerCase() === 'tasks');

                                return (
                                  <span
                                    key={variable}
                                    className={`px-2 py-1 rounded-md text-xs ${
                                      isEnabled
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                    onClick={() => isEnabled && handleVariableClick(fullVariable)}
                                  >
                                    {fullVariable}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const VariablesSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
    ))}
  </div>
);

const ModalSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-2 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
    <div className="md:col-span-1">
      <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
