import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, File as FileIcon, Tag as TagIcon, Users } from 'lucide-react';
import Select from '../ui/Select';
import SafariDeskEditor from '../editor/SafariDeskEditor';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { errorNotification, successNotification } from '../ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatFileSize } from '../../utils/helper';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_COUNT = 5;
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'];

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  creator_name: z.string().min(1, 'Creator name is required'),
  creator_phone: z.string().min(1, 'Phone number is required'),
  creator_email: z.string().email('Invalid email format'),
  description: z.string().min(1, 'Description is required'),
  category: z.preprocess(
    (val) => (val === '' || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: 'Category is required' }).min(1, 'Category is required')
  ),
  department: z.preprocess(
    (val) => (val === '' || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: 'Department is required' }).min(1, 'Department is required')
  ),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  is_public: z.boolean(),
  assignee_id: z.number().positive().optional(),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface Category {
  id: number;
  name: string;
  description: string;
  department: number | null; // Added department field
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  slag: string;
  created_at: string;
}

interface Agent {
  id: number;
  name: string;
}

type TicketFormVariant = 'internal' | 'customer';

interface CreateTicketModalProps {
  reload?: () => void;
  onclose?: () => void;
  onSuccess?: () => void;
  loadFromApi?: boolean;
  categories?: Category[];
  departments?: Department[];
  onDirtyChange?: (isDirty: boolean) => void;
  variant?: TicketFormVariant;
}

const getExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

const isAllowedFile = (file: File) => {
  const ext = getExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext);
};

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  reload,
  onclose,
  onSuccess,
  loadFromApi = true,
  categories: propCategories,
  departments: propDepartments,
  onDirtyChange,
  variant = 'internal',
}) => {
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    control,
    watch,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      creator_name: '',
      creator_phone: '',
      creator_email: '',
      description: '',
      category: undefined,
      department: undefined,
      priority: 'medium',
      is_public: false,
      assignee_id: undefined,
      tags: [],
    },
  });

  const watchedTags = watch('tags', []);
  const watchedAssignee = watch('assignee_id');

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) {
        setValue('creator_name', fullName);
      }
      if (user.email) {
        setValue('creator_email', user.email);
      }
      if (user.phone_number) {
        setValue('creator_phone', user.phone_number);
      }
    }
  }, [user, setValue]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await http.get(`${APIS.LIST_TICKET_CATEGORIES}?pagination=no`);
      setCategories(response.data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'An error occurred';
      errorNotification(errorMsg);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await http.get(`${APIS.LIST_DEPARTMENTS}?pagination=no`);
      setDepartments(response.data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'An error occurred';
      errorNotification(errorMsg);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await http.get(`${APIS.LIST_AGENTS}?pagination=no`);
      setAgents(response.data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'Failed to load agents';
      errorNotification(errorMsg);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    if (variant !== 'customer' && loadFromApi && user) {
      fetchCategories();
      fetchDepartments();
      fetchAgents();
    } else if (propCategories && propDepartments) {
      setCategories(propCategories);
      setDepartments(propDepartments);
    }
  }, [user, loadFromApi, propCategories, propDepartments]);

  const resetFormState = () => {
    reset({
      title: '',
      creator_name: '',
      creator_phone: '',
      creator_email: '',
      description: '',
      category: undefined,
      department: undefined,
      priority: 'medium',
      is_public: false,
      assignee_id: undefined,
      tags: [],
    });
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) {
        setValue('creator_name', fullName);
      }
      if (user.email) {
        setValue('creator_email', user.email);
      }
      if (user.phone_number) {
        setValue('creator_phone', user.phone_number);
      }
    }
    setAttachments([]);
    setAttachmentErrors([]);
    setTagInput('');
    // Call onSuccess (bypasses dirty check) or fall back to onclose
    if (onSuccess) {
      onSuccess();
    } else if (onclose) {
      onclose();
    }
  };

  const validateFile = (file: File): string | null => {
    if (!isAllowedFile(file)) {
      return `${file.name} is not an allowed file type`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} exceeds ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB limit`;
    }
    return null;
  };

  const addFiles = (files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    const totalCount = attachments.length + files.length;

    if (totalCount > MAX_FILE_COUNT) {
      newErrors.push(`You can only upload up to ${MAX_FILE_COUNT} files.`);
    }

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0 && attachments.length + validFiles.length <= MAX_FILE_COUNT) {
      setAttachments((prev) => [...prev, ...validFiles]);
    }

    setAttachmentErrors(newErrors);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    addFiles(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    if (attachments.length > MAX_FILE_COUNT) {
      setAttachmentErrors([`You can only upload up to ${MAX_FILE_COUNT} files.`]);
      return;
    }

    setIsLoading(true);
    setAttachmentErrors([]);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'assignee_id') {
          if (typeof value === 'number' && !Number.isNaN(value)) {
            formData.append('assignee_id', value.toString());
          }
          return;
        }
        if (key === 'tags') {
          return;
        }

        // Map fields for customer/public API expectations
        if (variant === 'customer') {
          if (key === 'category') {
            formData.append('category_id', value.toString());
            return;
          }
          if (key === 'department') {
            formData.append('department_id', value.toString());
            return;
          }
        }

        formData.append(key, value.toString());
      });

      if (watchedTags && watchedTags.length > 0) {
        watchedTags.forEach((tag) => formData.append('tags[]', tag));
      }

      const defaultSource = user ? 'web' : 'customer_portal';
      formData.append('source', defaultSource);

      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const url = user ? APIS.CREATE_TICKET : APIS.CUSTOMER_CREATE_TICKET;
      const response = await http.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const ticketId = response?.data?.ticket_id;

      const successMsg = `${response.data.message} with ticket reference number ${ticketId}`;
      successNotification(successMsg);

      if (reload) {
        await reload();
      }
      resetFormState();
      if (!user && variant === 'customer') {
        window.location.href = '/helpcenter';
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'An error occurred';
      errorNotification(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const addTagFromInput = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (watchedTags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    const nextTags = [...watchedTags, trimmed];
    setValue('tags', nextTags, { shouldValidate: true, shouldDirty: true });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const nextTags = watchedTags.filter((t) => t !== tag);
    setValue('tags', nextTags, { shouldValidate: true, shouldDirty: true });
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTagFromInput();
    }
  };

  const renderAttachmentErrors = () => {
    if (attachmentErrors.length === 0) return null;
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        {attachmentErrors.map((err, idx) => (
          <p key={idx}>{err}</p>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-sm">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,2.2fr)_320px] lg:items-start lg:py-6 lg:divide-x lg:divide-gray-300 dark:lg:divide-gray-600">
          {/* Left column */}
          <div className="flex flex-col space-y-5 p-5 lg:pr-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
            <Input
              label="Title"
              fullWidth
              {...register('title')}
              error={errors.title?.message}
              placeholder="Add a clear, concise title"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Your Name"
                fullWidth
                {...register('creator_name')}
                error={errors.creator_name?.message}
                placeholder="Enter your full name"
              />
              <Input
                label="Phone Number"
                fullWidth
                {...register('creator_phone')}
                error={errors.creator_phone?.message}
                placeholder="Enter your phone number"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              fullWidth
              {...register('creator_email')}
              error={errors.creator_email?.message}
              placeholder="Enter your email address"
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <SafariDeskEditor
                      content={field.value}
                      onChange={(content) => field.onChange(content)}
                      className="min-h-[320px]"
                    />
                  </div>
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Minimal attachments row */}
            <div className="flex flex-wrap items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-gray-400" />
                <label className="cursor-pointer">
                  <span className="underline">Attach files</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileUpload}
                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                  />
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {attachments.length}/{MAX_FILE_COUNT} · {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB each
                </span>
              </div>
              {attachmentErrors.length > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">{attachmentErrors[0]}</span>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Files</span>
                </div>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
                    >
                      <div className="flex items-center space-x-2">
                        <FileIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-gray-400 transition-colors duration-150 hover:text-red-500"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderAttachmentErrors()}
          </div>

          {/* Right rail */}
          <div className="w-full flex flex-col">
            <div className="w-full flex flex-col space-y-5 p-5 lg:pl-6">
              <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ticket Settings</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Configure ticket properties and assignment</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select
                  {...register('priority')}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100">Department</label>
                    <select
                      {...register('department', {
                        valueAsNumber: true,
                        onChange: () => {
                          // Reset category when department changes
                          setValue('category', undefined as any);
                        }
                      })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      disabled={loadFromApi ? loadingDepartments : false}
                    >
                      <option value="">
                        {loadFromApi && loadingDepartments ? 'Loading departments...' : 'Select a department'}
                      </option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {errors.department && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-gray-100">Category</label>
                    <select
                      {...register('category', { valueAsNumber: true })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      disabled={(loadFromApi ? loadingCategories : false) || !watch('department')}
                    >
                      <option value="">
                        {loadFromApi && loadingCategories ? 'Loading categories...' : 'Select a category'}
                      </option>
                      {categories
                        .filter(cat => {
                          const selectedDept = watch('department');
                          // Show if no department linked to category (global) or matches selected department
                          return !cat.department || cat.department === Number(selectedDept);
                        })
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>}
                  </div>
                </div>
              </div>

              {/* Visibility - only show for internal agents, not on helpcenter */}
              {!window.location.pathname.startsWith('/helpcenter') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_public"
                      {...register('is_public')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">
                      Make this ticket public
                    </label>
                  </div>
                </div>
              )}

              {variant !== 'customer' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
                      {loadingAgents && <span className="text-xs text-gray-500">Loading...</span>}
                    </div>
                    <Select
                      value={watchedAssignee ? String(watchedAssignee) : ''}
                      onChange={(val) => {
                        if (!val) {
                          setValue('assignee_id', undefined, { shouldDirty: true, shouldValidate: true });
                        } else {
                          const num = Number(val);
                          setValue('assignee_id', Number.isNaN(num) ? undefined : num, { shouldDirty: true, shouldValidate: true });
                        }
                      }}
                      options={[
                        { value: '', label: 'Select an assignee', disabled: true },
                        ...agents.map((agent) => ({
                          value: agent.id.toString(),
                          label: agent.name,
                        })),
                      ]}
                      placeholder="Select an assignee"
                      allowSearch
                      size="md"
                      className="w-full text-sm placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Labels / Tags</label>
                      {loadingTags && <span className="text-xs text-gray-500">Loading...</span>}
                    </div>
                    <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type and press Enter to add"
                        className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
                        aria-label="Add tag"
                      />
                      {watchedTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {watchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                                aria-label={`Remove ${tag}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto mx-5 pt-6 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={resetFormState}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading} disabled={isLoading || attachmentErrors.length > 0}>
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
