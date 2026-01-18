import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import Button from '../ui/Button';
import { Upload, X } from 'lucide-react';
import SafariDeskEditor from '../editor/SafariDeskEditor';
import http from '../../services/http';
import { APIS } from '../../services/apis';
import { errorNotification, successNotification } from '../ui/Toast';
import { useAuthStore } from '../../stores/authStore';
import { formatFileSize } from '../../utils/helper';

interface Agent {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface NewTask {
  title: string;
  assigned_to: string;
  description: string;
  due_date: string;
  department?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface CreateTaskModalProps {
  reload?: () => void;
  onclose?: () => void;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  ticketId?: number;
}

interface Ticket {
  id: number;
  ticket_id: string;
  title: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  reload,
  onclose,
  onSuccess,
  onDirtyChange,
  ticketId,
}) => {
  const { user } = useAuthStore();

  // Form state
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    assigned_to: '',
    description: '',
    due_date: '',
    department: undefined,
    priority: 'medium',
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Field-specific error state for highlighting
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    due_date?: string;
    department?: string;
    assigned_to?: string;
  }>({});

  // Track dirty state
  useEffect(() => {
    const isDirty = Boolean(
      newTask.title.trim() ||
      newTask.description.trim() ||
      newTask.due_date ||
      newTask.department ||
      selectedOption ||
      selectedTicketId ||
      newTask.priority !== 'medium' ||
      attachments.length > 0
    );
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [newTask, selectedOption, selectedTicketId, attachments, onDirtyChange]);

  // Fetch agents
  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await http.get(`${APIS.LIST_AGENTS}?pagination=no`);
      setAgents(response.data);
    } catch (error: any) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await http.get(`${APIS.LIST_DEPARTMENTS}?pagination=no`);
      setDepartments(response.data);
    } catch (error: any) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch tickets for linking (only if not already linked to a ticket via ticketId prop)
  const fetchTickets = async () => {
    if (ticketId) return; // Skip if already linked to a ticket

    setLoadingTickets(true);
    try {
      const response = await http.get(`${APIS.LIST_TICKETS}?pagination=no`);
      setTickets(response.data.results || response.data);
    } catch (error: any) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchDepartments();
    fetchTickets();
  }, []);

  const handleInputChange = (field: keyof NewTask, value: string | number | undefined) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value as any
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTask = async () => {
    // Reset errors
    setFieldErrors({});
    setError(null);

    // Validate required fields with specific messages
    const errors: typeof fieldErrors = {};

    if (!newTask.title.trim()) {
      errors.title = 'Task title is required';
    }
    if (!newTask.due_date) {
      errors.due_date = 'Due date is required';
    }
    if (!newTask.department) {
      errors.department = 'Please select a department';
    }
    if (!selectedOption) {
      errors.assigned_to = 'Please assign the task to an agent';
    }

    // If any validation errors, set them and show summary
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const errorMessages = Object.values(errors);
      setError(errorMessages.length === 1
        ? errorMessages[0]
        : `Please fix the following: ${errorMessages.join(', ')}`
      );
      return;
    }

    setCreating(true);

    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description || '');
      formData.append('due_date', newTask.due_date);
      formData.append('department_id', String(newTask.department));
      formData.append('priority', newTask.priority);

      if (selectedOption) {
        formData.append('assigned_to', selectedOption);
      }

      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await http.post(APIS.CREATE_TASK, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const createdTaskId = response?.data?.task?.id;

      // Handle ticket linking if ticketId prop exists OR user selected a ticket
      const ticketToLink = ticketId || (selectedTicketId ? parseInt(selectedTicketId) : null);

      if (ticketToLink) {
        if (!createdTaskId) {
          setError('Task was created but could not be linked to the ticket (missing task id).');
          return;
        }

        try {
          await http.post(`${APIS.ATTACH_TASK_TO_TICKET}${createdTaskId}/`, {
            ticket_id: ticketToLink,
          });
        } catch (attachError: any) {
          const attachMessage = attachError?.response?.data?.message || 'Task created but failed to attach to ticket';
          errorNotification(attachMessage);
          setError(attachMessage);
          return;
        }
      }

      successNotification(ticketToLink ? 'Task created and attached to ticket' : (response.data.message || 'Task created successfully'));

      // Call reload to refresh the task list
      if (reload) {
        await reload();
      }

      // Close modal - call onSuccess (bypasses dirty check) or fall back to onclose
      if (onSuccess) {
        onSuccess();
      } else if (onclose) {
        onclose();
      }

    } catch (error: any) {
      console.error('Create task error:', error);
      errorNotification(error?.response?.data?.message || 'Failed to create task');
      setError(error?.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,2.2fr)_320px] lg:items-start lg:py-6 lg:divide-x lg:divide-gray-300 dark:lg:divide-gray-600">
          {/* Left column */}
          <div className="flex flex-col space-y-5 p-5 lg:pr-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Task Details</h3>
            <div>
              <Input
                label="Title"
                placeholder="Task title"
                fullWidth
                value={newTask.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 ">
              <div>
                <Input
                  label="Due Date"
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={`[&::-webkit-calendar-picker-indicator]:dark:invert ${fieldErrors.due_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.due_date && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.due_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <SafariDeskEditor
                content={newTask.description}
                onChange={(content) => handleInputChange('description', content)}
                className="min-h-[200px]"
              />
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
                  {attachments.length} file{attachments.length === 1 ? '' : 's'}
                </span>
              </div>
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
                        <Upload className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="w-full flex flex-col">
            <div className="w-full space-y-5 p-5 lg:pl-6">
              <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Settings</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Configure task properties</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as NewTask['priority'])}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <select
                  className={`block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100 ${fieldErrors.department
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                    }`}
                  disabled={loadingDepartments}
                  value={newTask.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">
                    {loadingDepartments ? 'Loading departments...' : 'Select a department'}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.department && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
                  {loadingAgents && <span className="text-xs text-gray-500">Loading...</span>}
                </div>
                <div className={`flex items-center space-x-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-within:ring-2 dark:bg-gray-800 dark:text-gray-100 ${fieldErrors.assigned_to
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
                  : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500 dark:border-gray-600'
                  }`}>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                    disabled={loadingAgents}
                  >
                    <option value="">Select an assignee</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.assigned_to && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.assigned_to}</p>
                )}
              </div>

              {/* Link to Ticket - Only show if not already linked via ticketId prop */}
              {!ticketId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Link to Ticket <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    {loadingTickets && <span className="text-xs text-gray-500">Loading...</span>}
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <select
                      value={selectedTicketId}
                      onChange={(e) => setSelectedTicketId(e.target.value)}
                      className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-gray-100"
                      disabled={loadingTickets}
                    >
                      <option value="">None (skip linking)</option>
                      {tickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id.toString()}>
                          {ticket.ticket_id} - {ticket.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Optionally link this task to an existing ticket
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-auto mx-5 pt-6 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={onclose} variant="outline" disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={creating}>
                {creating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
