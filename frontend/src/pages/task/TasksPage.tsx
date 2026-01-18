import React, { useState, useEffect } from 'react';
import {
  Search, Plus, User, Clock, MessageCircle, FileText, Filter, ChevronRight, LayoutList, LayoutGrid, ChevronLeft, Calendar, Mail, Phone, Tag, CheckCircle, Edit3, UserCheck, Share2, Copy, Pause, Grid, X, MoreVertical, Archive, Trash2, Download, RotateCcw, Inbox, ClipboardList, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react';

// import { Link as RouterLink } from "react-router-dom";
// import { Link as LinkIcon } from "lucide-react";

import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { APIS } from '../../services/apis';
import http from '../../services/http';
import { errorNotification, successNotification } from '../../components/ui/Toast';
import { Loader } from '../../components/loader/loader';
import { Agent, TaskObj, Ticket, TicketData } from '../../types';
import { AxiosError } from 'axios';
import { TaskActivityStream } from './mini/TaskActivityStream';
import Drawer from '../../components/ui/Drawer';
import NewTicket from '../../components/tickets/NewTicket';
import { formatRelativeTime } from '../../utils/helper';
import { getStatusColor, getPriorityColor, formatDate } from '../../utils/displayHelpers';
import Select from '../../components/ui/Select';
import MultiSelectAgents from '../../components/ui/MultiSelectAgents';
import { Tooltip } from '../../components/ui/Tool';
import { Input } from '../../components/ui/Input';
import { useFetchAgents } from '../../services/agents';
import { AgentType, ApiResponse as AgentApiResponse } from '../../types/agents';
import UpdateTaskStatus from './mini/updateStatus';
import TicketListSkeleton from '../../components/ui/TicketListSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import TicketDetailSkeleton from '../../components/ui/TicketDetailSkeleton';
import TaskGrid from './mini/TaskGrid';
import { Modal } from '../../components/ui/Modal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FilterDialog } from '../../components/ui/FilterDialog';
import TaskCard from './mini/TaskCard';
import { TicketCard } from '../../components/tickets/TicketCard';
import { DynamicStepper } from '../../components/ui/Stepper';
import { formatFileSize } from '../../utils/helper';
import TaskInfo from './mini/ViewTask';
import AssignTask from './mini/AssignTask';
import AttachToTikect from './mini/AttachToTicket';
import AddTask from './mini/AddTask';
import SkinLoader from '../../components/ui/SkinLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import UpdatePriorityModal from '../../components/tickets/UpdatePriorityModal';
import { ViewModeDropdown } from '../../components/tickets/ViewModeDropdown';
import { AGENT_TASK_VIEW_ITEMS, TASK_VIEW_ITEMS } from '../../components/layout/taskViewConfigs';

// Type definitions based on your API response
interface ApiTask {
  id: number;
  title: string;
  description: string;
  task_status: string;
  priority: string;
  task_trackid: string;
  assigned_to: {
    id: number;
    name?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    avatar_url?: string;
  } | null;
  created_by?: {
    id: number;
    name?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    avatar_url?: string;
  } | null;
  due_date: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  department?: {
    id: number;
    name: string;
    slag?: string;
  } | null;
  is_converted_to_ticket?: boolean;
  linked_ticket?: any;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiTask[];
}

interface Watcher {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AssignTaskPayload {
  task_id: string;
  agent_id: number;
}

interface AddWatchersPayload {
  watchers: number[];
}

export default function TaskManagementSystem() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();
  const isAdmin =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'superuser' ||
    role === 'administrator';
  const defaultView = role ? (isAdmin ? 'all_tasks' : 'my_tasks') : 'all_tasks';
  const viewItems = role ? (isAdmin ? TASK_VIEW_ITEMS : AGENT_TASK_VIEW_ITEMS) : TASK_VIEW_ITEMS;

  // API state management
  const [tasks, setTasks] = useState<TaskObj[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskObj | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [activeView, setActiveView] = useState('all_tasks');

  // State from ViewTask
  const [reloader, setReloader] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedWatchers, setSelectedWatchers] = useState<number[]>([]);
  const [taskWatchers, setTaskWatchers] = useState<Watcher[]>([]);
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [shareLink, setShareLink] = useState(window.location.href);
  const { data: agentResponse = [] } = useFetchAgents();
  const agentsData: AgentType[] = (agentResponse as AgentApiResponse)?.results || [];
  const isUserWatcher = taskWatchers.some(watcher => watcher.id === user?.user_id);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<'detailed' | 'card' | 'grid' | 'list'>(
    (localStorage.getItem('taskViewMode') as 'detailed' | 'card' | 'grid' | 'list') || 'list'
  );
  const [isCreateTaskModalDirty, setIsCreateTaskModalDirty] = useState(false);

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);
  const [showCreateTaskCloseConfirm, setShowCreateTaskCloseConfirm] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(true);

  // Handlers for create task modal close confirmation
  const handleCloseCreateTaskModal = () => {
    if (isCreateTaskModalDirty) {
      setShowCreateTaskCloseConfirm(true);
      return;
    }
    setCreateTaskModal(false);
    setIsCreateTaskModalDirty(false);
  };

  const confirmCloseCreateTaskModal = () => {
    setShowCreateTaskCloseConfirm(false);
    setCreateTaskModal(false);
    setIsCreateTaskModalDirty(false);
  };

  // Sorting state
  type TaskSortField = 'id' | 'title' | 'status' | 'priority' | 'department' | 'assignee' | 'due_date';
  const [taskSortField, setTaskSortField] = useState<TaskSortField>('due_date');
  const [taskSortDirection, setTaskSortDirection] = useState<'asc' | 'desc'>('asc');

  // Task sorting functions
  const toggleTaskSort = (field: TaskSortField) => {
    if (taskSortField === field) {
      setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTaskSortField(field);
      setTaskSortDirection('asc');
    }
  };

  const taskSortIcon = (field: TaskSortField) => {
    if (taskSortField !== field) return null;
    return taskSortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const priorityOrder: Record<string, number> = {
    critical: 4,
    urgent: 3,
    high: 2,
    medium: 1,
    normal: 1,
    low: 0,
  };

  // Sort tasks based on current sort field
  const sortedTasks = React.useMemo(() => {
    const toComparable = (task: TaskObj, field: TaskSortField) => {
      switch (field) {
        case 'id':
          return task.task_trackid?.toLowerCase() || '';
        case 'title':
          return task.title?.toLowerCase() || '';
        case 'status':
          return task.task_status?.toLowerCase() || '';
        case 'priority':
          return priorityOrder[task.priority?.toLowerCase()] ?? 0;
        case 'department':
          return task.department?.name?.toLowerCase() || '';
        case 'assignee':
          return task.assigned_to?.name?.toLowerCase() || '';
        case 'due_date':
          return task.due_date ? new Date(task.due_date).getTime() : Infinity;
        default:
          return '';
      }
    };

    return [...tasks].sort((a, b) => {
      const aVal = toComparable(a, taskSortField);
      const bVal = toComparable(b, taskSortField);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return taskSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr === bStr) return 0;
      if (taskSortDirection === 'asc') {
        return aStr > bStr ? 1 : -1;
      }
      return aStr < bStr ? 1 : -1;
    });
  }, [tasks, taskSortField, taskSortDirection]);

  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Selection state for bulk actions
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  // Selection handlers
  const handleTaskSelection = (taskId: number, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  // Bulk action handlers
  const handleBulkArchive = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await http.post('/task/bulk/archive/', {
        task_ids: Array.from(selectedTasks)
      });
      console.log('Archive response:', response.data);
      setSelectedTasks(new Set());
      // Refresh tasks list
      fetchTasks();
    } catch (error) {
      console.error('Error archiving tasks:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await http.post('/task/bulk/delete/', {
        task_ids: Array.from(selectedTasks)
      });
      console.log('Delete response:', response.data);
      setSelectedTasks(new Set());
      // Refresh tasks list
      fetchTasks();
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const handleBulkExport = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await http.post('/task/export/', {
        task_ids: Array.from(selectedTasks)
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error exporting tasks:', error);
    }
  };

  // Get current view context
  const getViewContext = () => {
    if (activeView === 'archived_tasks') return 'archived';
    if (activeView === 'trash_tasks') return 'trash';
    return 'normal';
  };

  // Additional bulk action handlers
  const handleBulkUnarchive = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await http.post('/task/bulk/unarchive/', {
        task_ids: Array.from(selectedTasks)
      });
      console.log('Unarchive response:', response.data);
      setSelectedTasks(new Set());
      fetchTasks(currentPage, activeView);
    } catch (error) {
      console.error('Error unarchiving tasks:', error);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await http.post('/task/bulk/restore/', {
        task_ids: Array.from(selectedTasks)
      });
      console.log('Restore response:', response.data);
      setSelectedTasks(new Set());
      fetchTasks(currentPage, activeView);
    } catch (error) {
      console.error('Error restoring tasks:', error);
    }
  };

  // Get bulk actions based on current view context
  const getBulkActions = () => {
    const context = getViewContext();

    switch (context) {
      case 'archived':
        return [
          { key: 'unarchive', label: 'Unarchive', icon: Archive, action: handleBulkUnarchive, className: 'bg-blue-600 hover:bg-blue-700' },
          { key: 'delete', label: 'Delete', icon: Trash2, action: handleBulkDelete, className: 'bg-red-600 hover:bg-red-700' },
          { key: 'export', label: 'Export', icon: Download, action: handleBulkExport, className: 'bg-green-600 hover:bg-green-700' }
        ];
      case 'trash':
        return [
          { key: 'archive', label: 'Archive', icon: Archive, action: handleBulkArchive, className: 'bg-blue-600 hover:bg-blue-700' },
          { key: 'restore', label: 'Restore', icon: RotateCcw, action: handleBulkRestore, className: 'bg-yellow-600 hover:bg-yellow-700' },
          { key: 'export', label: 'Export', icon: Download, action: handleBulkExport, className: 'bg-green-600 hover:bg-green-700' }
        ];
      default:
        return [
          { key: 'archive', label: 'Archive', icon: Archive, action: handleBulkArchive, className: 'bg-blue-600 hover:bg-blue-700' },
          { key: 'delete', label: 'Delete', icon: Trash2, action: handleBulkDelete, className: 'bg-red-600 hover:bg-red-700' },
          { key: 'export', label: 'Export', icon: Download, action: handleBulkExport, className: 'bg-green-600 hover:bg-green-700' }
        ];
    }
  };

  const getStatusVariant = (status: string): "default" | "primary" | "danger" | "success" | "warning" | "info" => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'todo':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Modal states for task actions
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [attachTicketModalOpen, setAttachTicketModalOpen] = useState(false);
  const [attachFileModalOpen, setAttachFileModalOpen] = useState(false);
  const [showLinkedTicketModal, setShowLinkedTicketModal] = useState(false);

  // State for attach ticket functionality
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);

  // Fetch tickets for attach functionality
  const fetchTickets = async () => {
    try {
      const response = await http.get(APIS.LIST_TICKETS + '?pagination=no');
      setTickets(response.data.results || response.data);
    } catch (error: any) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  // Handle attach task to ticket
  const handleAttachToTicket = async () => {
    if (!selectedTask || !selectedTicketId) return;
    try {
      setIsSubmitting(true);
      console.log('Attaching task:', selectedTask.id, 'to ticket:', selectedTicketId);
      const response = await http.post(`${APIS.TASK_BASE}/${selectedTask.id}/attach-to-ticket/`, {
        ticket_id: parseInt(selectedTicketId)
      });
      console.log('Attach response:', response.data);
      successNotification(response.data.message);
      fetchTasks(currentPage);
      setAttachTicketModalOpen(false);
      setSelectedTicketId("");
    } catch (error: any) {
      console.error('Attach error:', error);
      errorNotification(error?.response?.data?.message || error?.response?.data?.error || 'Failed to attach task to ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch tickets when attach modal opens
  useEffect(() => {
    if (attachTicketModalOpen) {
      fetchTickets();
    }
  }, [attachTicketModalOpen]);

  // Action handlers for task cards
  const handleTaskAction = async (action: string, task: TaskObj) => {
    setSelectedTask(task);
    switch (action) {
      case 'assign':
        setAssignModalOpen(true);
        break;
      case 'update-status':
        setUpdateStatusModalOpen(true);
        break;
      case 'attach-ticket':
        setAttachTicketModalOpen(true);
        break;
      case 'attach-file':
        setAttachFileModalOpen(true);
        break;
      case 'delete':
        // Handle delete/make draft action
        if (window.confirm('Are you sure you want to make this task a draft?')) {
          try {
            setIsSubmitting(true);
            const response = await http.post(`${APIS.UPDATE_TASK_STATUS}${task.id}/`, {
              status: 'draft'
            });
            successNotification('Task marked as draft');
            fetchTasks(currentPage);
          } catch (error: any) {
            errorNotification(error?.response?.data?.message || 'Failed to update task status');
          } finally {
            setIsSubmitting(false);
          }
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const sidebarItems = viewItems
    .map((item) => {
      const query = item.path.split('?')[1] || '';
      const viewKey = new URLSearchParams(query).get('view');
      return viewKey ? { name: item.name, key: viewKey, icon: item.icon } : null;
    })
    .filter(
      (item): item is { name: string; key: string; icon: React.ComponentType<{ size?: number; className?: string }> } =>
        item !== null,
    );

  const activeViewName =
    sidebarItems.find(item => item.key === activeView)?.name ||
    sidebarItems[0]?.name ||
    'All Tasks';
  const taskListGridCols = 'grid w-full min-w-full grid-cols-[50px_minmax(110px,max-content)_minmax(200px,2fr)_minmax(120px,150px)_minmax(110px,130px)_minmax(120px,140px)_minmax(120px,140px)_minmax(90px,110px)]';
  const showDetailPanel = viewMode === 'detailed' && detailPanelOpen;

  const transformApiTask = (apiTask: ApiTask): TaskObj => {
    const priority = apiTask.priority?.toLowerCase();
    return {
      id: apiTask.id,
      title: apiTask.title || '',
      description: apiTask.description || '',
      task_status: (apiTask.task_status === 'open' ? 'todo' : apiTask.task_status) as TaskObj['task_status'],
      priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? priority as TaskObj['priority'] : null,
      task_trackid: apiTask.task_trackid || '',
      assigned_to: apiTask.assigned_to ? {
        id: apiTask.assigned_to.id,
        name: apiTask.assigned_to.name || `${apiTask.assigned_to.first_name || ''} ${apiTask.assigned_to.last_name || ''}`.trim(),
        email: apiTask.assigned_to.email,
        phone_number: apiTask.assigned_to.phone_number,
      } : null,
      created_by: apiTask.created_by ? {
        id: apiTask.created_by.id,
        name: apiTask.created_by.name || `${apiTask.created_by.first_name || ''} ${apiTask.created_by.last_name || ''}`.trim(),
        email: apiTask.created_by.email || '',
        phone_number: apiTask.created_by.phone_number || '',
      } : null,
      department: apiTask.department ? {
        id: apiTask.department.id,
        name: apiTask.department.name || '',
        slag: apiTask.department.slag || '',
      } : null,
      assigned_to_name: apiTask.assigned_to ? (apiTask.assigned_to.name || `${apiTask.assigned_to.first_name || ''} ${apiTask.assigned_to.last_name || ''}`.trim()) : null,
      due_date: apiTask.due_date,
      created_at: apiTask.created_at,
      updated_at: apiTask.updated_at || apiTask.created_at,
      completed_at: apiTask.completed_at || null,
      is_converted_to_ticket: apiTask.is_converted_to_ticket || false,
      linked_ticket: apiTask.linked_ticket || null,
      status: apiTask.task_status,
    };
  };

  const fetchTasks = React.useCallback(async (page: number = 1, view: string = 'all_tasks') => {
    setIsLoading(true);

    try {
      const offset = (page - 1) * limit;
      const params: Record<string, string | number> = {
        limit,
        offset,
        view: view,
      };

      // Add filters if they are not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }
      if (assigneeFilter !== 'all') {
        params.assigned_to = assigneeFilter;
      }
      if (departmentFilter !== 'all') {
        params.department = departmentFilter;
      }
      if (dateFromFilter) {
        params.date_from = dateFromFilter;
      }
      if (dateToFilter) {
        params.date_to = dateToFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await http.get<ApiResponse>(APIS.LOAD_TASKS, {
        params,
      });

      const transformedTasks = response.data.results.map(transformApiTask);
      setTasks(transformedTasks);
      setTotalCount(response.data.count);
      setCurrentPage(page);

      if (transformedTasks.length === 0) {
        setSelectedTask(null);
      }

    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")

    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [limit, statusFilter, priorityFilter, assigneeFilter, departmentFilter, dateFromFilter, dateToFilter, searchQuery]);

  // Get active filter labels for display
  const getActiveFilterLabels = () => {
    const labels: string[] = [];
    if (statusFilter && statusFilter !== 'all') labels.push(`Status: ${statusFilter.replace('_', ' ')}`);
    if (priorityFilter && priorityFilter !== 'all') labels.push(`Priority: ${priorityFilter}`);
    if (assigneeFilter && assigneeFilter !== 'all') {
      const agent = agents?.find(a => a.id.toString() === assigneeFilter);
      labels.push(`Assignee: ${agent?.name || (assigneeFilter === 'unassigned' ? 'Unassigned' : 'Selected')}`);
    }
    if (departmentFilter && departmentFilter !== 'all') {
      const dept = departments.find(d => d.id.toString() === departmentFilter);
      labels.push(`Dept: ${dept?.name || 'Selected'}`);
    }
    if (dateFromFilter || dateToFilter) labels.push(`Date Range`);
    return labels;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDepartmentFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const fetchTaskCounts = async () => {
    try {
      const views = ['all_tasks', 'my_tasks', 'open_tasks', 'in_progress_tasks', 'completed_tasks', 'overdue_tasks', 'archived_tasks', 'trash_tasks'];
      const counts: Record<string, number> = {};

      // Fetch count for each view
      for (const view of views) {
        try {
          const response = await http.get(APIS.LOAD_TASKS, {
            params: {
              view: view,
              limit: 1,
              offset: 0
            }
          });
          counts[view] = response.data.count || 0;
        } catch (error) {
          console.error(`Failed to fetch count for view ${view}:`, error);
          counts[view] = 0;
        }
      }

      setTaskCounts(counts);
    } catch (error) {
      console.error("Failed to fetch task counts:", error);
    }
  };

  React.useEffect(() => {
    fetchTasks(currentPage, activeView);
    fetchTaskCounts();
  }, [fetchTasks, currentPage, activeView, statusFilter, priorityFilter, searchQuery]);

  // Watch for URL parameter changes and update activeView
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    // Valid views: all_tasks, my_tasks, open_tasks, in_progress_tasks, completed_tasks, overdue_tasks, archived_tasks, trash_tasks
    const validViews = ['all_tasks', 'my_tasks', 'open_tasks', 'in_progress_tasks', 'completed_tasks', 'overdue_tasks', 'archived_tasks', 'trash_tasks'];
    const targetView = viewParam && validViews.includes(viewParam) ? viewParam : defaultView;

    if (targetView !== activeView) {
      setActiveView(targetView);
      setCurrentPage(1);
    }
  }, [location.search, activeView, defaultView]);

  useEffect(() => {
    if (viewMode === 'detailed') {
      if (tasks.length > 0) {
        setSelectedTask(currentSelected => {
          const isSelectedInList = tasks.some(t => t.id === currentSelected?.id);
          if (isSelectedInList) {
            return currentSelected;
          }
          return tasks[0];
        });
      } else {
        setSelectedTask(null);
      }
    } else {
      setSelectedTask(null);
    }
  }, [tasks, viewMode]);

  const handleNextTask = () => {
    if (!selectedTask || tasks.length <= 1) return;
    const currentIndex = tasks.findIndex(t => t.id === selectedTask.id);
    const nextIndex = (currentIndex + 1) % tasks.length;
    setSelectedTask(tasks[nextIndex]);
  };

  const handlePreviousTask = () => {
    if (!selectedTask || tasks.length <= 1) return;
    const currentIndex = tasks.findIndex(t => t.id === selectedTask.id);
    const prevIndex = (currentIndex - 1 + tasks.length) % tasks.length;
    setSelectedTask(tasks[prevIndex]);
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalCount / limit);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Using shared utility functions from displayHelpers

  const getAgentDisplayName = (agent?: Partial<Agent> & { first_name?: string; last_name?: string }) => {
    if (!agent) return 'Unknown Agent';
    const fallbackFullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim();
    return agent.name?.trim()
      || fallbackFullName
      || agent.email
      || `Agent #${agent.id ?? ''}`;
  };

  const fetchAgents = async () => {
    try {
      const response = await http.get(`${APIS.LIST_AGENTS}?pagination=no`);
      setAgents(response.data);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await http.get(APIS.LIST_DEPARTMENTS);
      setDepartments(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error: any) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchTags = async (currentTaskId: string) => {
    // For now, tasks don't have tags like tickets
    setTaskTags([]);
  };

  const fetchWatchers = async (currentTaskId: string) => {
    // For now, tasks don't have watchers like tickets
    setTaskWatchers([]);
  };

  useEffect(() => {
    fetchAgents();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setSelectedStatus(selectedTask.task_status);
      fetchWatchers(selectedTask.id.toString());
      fetchTags(selectedTask.id.toString());
    }
  }, [selectedTask]);

  // Sync selectedTask with updated task data when tasks array changes
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  async function handleStatusUpdate() {
    if (!selectedTask) return;
    try {
      setIsSubmitting(true)
      const response = await http.post(`${APIS.UPDATE_TASK_STATUS}${selectedTask.id}/`, {
        status: selectedStatus
      });
      await fetchTasks(currentPage);
      successNotification(response.data.message)
      setUpdateStatus(false);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!selectedTask) return;
    setIsAssigning(true);
    try {
      const response = await http.get(`${APIS.ASSIGN_TASK}${selectedTask.id}`);
      successNotification(response.data.message);
      await fetchTasks(currentPage);
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Failed to assign task');
    } finally {
      setIsAssigning(false);
    }
  };

  async function handleAssign() {
    if (!selectedTask) return;
    try {
      setIsSubmitting(true)
      const response = await http.post(`${APIS.ASSIGN_TASK}${selectedTask.id}/`, {
        user_id: Number(selectedAgentId)
      });
      await fetchTasks(currentPage);
      successNotification(response.data.message)
      setSelectedAgentId(''); // Reset selection
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleComment(files?: FileList) {
    if (!selectedTask) return;
    try {
      setIsSubmitting(true)
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('is_internal', isInternal.toString());
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }
      const response = await http.post(`${APIS.TASK_ADD_COMMENT}${selectedTask.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComment("")
      setIsInternal(false)
      setReloader(prev => prev + 1);
      successNotification(response.data.message)
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddWatchers() {
    // For now, tasks don't support watchers
    successNotification("Watchers feature not yet implemented for tasks");
  }

  async function handleAddTags() {
    // For now, tasks don't support tags
    successNotification("Tags feature not yet implemented for tasks");
  }

  async function handlePriorityUpdate() {
    if (!selectedTask || !selectedPriority) return;
    try {
      setIsSubmitting(true);
      const response = await http.patch(`${APIS.TASK_BASE}/${selectedTask.id}/`, {
        priority: selectedPriority
      });
      await fetchTasks(currentPage);
      successNotification(response.data?.message || "Priority updated successfully");
      setSelectedPriority('');
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || "Failed to update priority");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{activeViewName}</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                title={showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              >
                <Filter size={16} />
                <span>Advanced Filters</span>
              </button>
              {/* Active Filter Labels */}
              {getActiveFilterLabels().length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {getActiveFilterLabels().map((label, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                      {label}
                    </span>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by Title or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div> */}
              <button onClick={() => setCreateTaskModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <Plus size={16} />
                <span>Create Task</span>
              </button>
              <ViewModeDropdown
                viewMode={viewMode}
                onViewChange={setViewMode}
              />
              {viewMode === 'detailed' && (
                <button
                  onClick={() => setDetailPanelOpen(prev => !prev)}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {detailPanelOpen ? 'Hide Details' : 'Show Details'}
                </button>
              )}
              {/* <button
                onClick={handlePreviousTask}
                disabled={!selectedTask || tasks.length <= 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
             <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1">
                <Eye size={16} /> {selectedTask ? tasks.findIndex(t => t.id === selectedTask.id) + 1 : 0}
              </button>

              <button
                onClick={handleNextTask}
                disabled={!selectedTask || tasks.length <= 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button> */}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Tasks List */}
          <div className={`${viewMode === 'detailed' ? (showDetailPanel ? 'w-1/4' : 'w-full') : 'w-full'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>

            {/* Filter Dialog Popup */}
            {/* Build filters array dynamically - show department filter only for admins */}
            {(() => {
              const isAdmin = user?.role === 'admin' || user?.role?.name === 'admin';
              const baseFilters = [
                {
                  id: 'status',
                  title: 'Status',
                  type: 'dropdown',
                  value: statusFilter,
                  options: [
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setStatusFilter(String(v)),
                },
                {
                  id: 'priority',
                  title: 'Priority',
                  type: 'dropdown',
                  value: priorityFilter,
                  options: [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setPriorityFilter(String(v)),
                },
                {
                  id: 'assignee',
                  title: 'Assignee',
                  type: 'dropdown',
                  value: assigneeFilter,
                  options: [
                    { value: 'all', label: 'All Assignees' },
                    { value: 'unassigned', label: 'Unassigned' },
                    ...(agents && Array.isArray(agents) && agents.length > 0
                      ? agents.map(agent => ({
                        value: agent.id.toString(),
                        label: getAgentDisplayName(agent)
                      }))
                      : []),
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setAssigneeFilter(String(v)),
                },
              ];

              // Add department filter only for admins
              if (isAdmin) {
                baseFilters.push({
                  id: 'department',
                  title: 'Department',
                  type: 'dropdown',
                  value: departmentFilter,
                  options: [
                    { value: 'all', label: 'All Departments' },
                    ...(departments && departments.length > 0
                      ? departments.map(dept => ({
                        value: dept.id.toString(),
                        label: dept.name
                      }))
                      : []),
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setDepartmentFilter(String(v)),
                });
              }

              baseFilters.push({
                id: 'date',
                title: 'Date Range',
                type: 'date-range',
                value: { from: dateFromFilter, to: dateToFilter },
                onChange: (value: string | (string | number)[] | { from: string; to: string }) => {
                  if (typeof value === 'object' && 'from' in value && 'to' in value) {
                    setDateFromFilter(value.from);
                    setDateToFilter(value.to);
                  }
                },
              });

              return (
                <FilterDialog
                  isOpen={showFilters}
                  onClose={() => setShowFilters(false)}
                  filters={baseFilters}
                  onApply={() => setShowFilters(false)}
                  onReset={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setAssigneeFilter('all');
                    setDepartmentFilter('all');
                    setDateFromFilter('');
                    setDateToFilter('');
                  }}
                  title="Filter Tasks"
                />
              );
            })()}


            {/* Search Bar - Always Visible */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by Title or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Bulk Actions - Show when tasks are selected */}
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mx-3 my-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  {getBulkActions().map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.key}
                        onClick={action.action}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${action.className}`}
                        title={action.label}
                      >
                        <IconComponent size={14} />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <>
                  <TicketListSkeleton />
                  <TicketListSkeleton />
                  <TicketListSkeleton />
                </>
              ) : tasks.length === 0 ? (
                <EmptyState />
              ) : viewMode === 'detailed' ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/task/${task.task_trackid}`)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedTask?.id === task.id ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' : ''
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {task.title.charAt(0)?.toUpperCase() || 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(task.created_at), 'dd MMM')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{task.task_trackid}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.task_status)}`}>
                              {task.task_status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <MessageCircle size={14} />
                            <span>{task.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : viewMode === 'card' ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      openDropdownId={openDropdownId}
                      onDropdownToggle={(taskId) =>
                        setOpenDropdownId(openDropdownId === Number(taskId) ? null : Number(taskId))
                      }
                      onDropdownClose={() => setOpenDropdownId(null)}
                      onAction={handleTaskAction}
                      formatDate={formatDate}
                      getStatusVariant={getStatusVariant}
                      getDueDateStatus={(dueDate) => 'normal'}
                      isSelected={selectedTasks.has(task.id)}
                      onSelectionChange={handleTaskSelection}
                    />
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map(task => (
                    <TaskGrid
                      key={task.id}
                      task={task}
                      openDropdownId={selectedTask ? selectedTask.id : null}
                      onDropdownToggle={(taskId) => setSelectedTask(tasks.find(t => t.id === taskId) || null)}
                      onDropdownClose={() => setSelectedTask(null)}
                      onAction={handleTaskAction}
                      formatDate={formatDate}
                      getStatusVariant={getStatusVariant}
                      getDueDateStatus={(dueDate) => 'normal'}
                      isSelected={selectedTasks.has(task.id)}
                      onSelectionChange={handleTaskSelection}
                    />
                  ))}
                </div>
              ) : viewMode === 'list' ? (
                <div className="p-4">
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="min-w-[920px]">
                      <div className={`${taskListGridCols} text-xs font-semibold uppercase tracking-wide bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
                        <div className="flex items-center justify-center py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedTasks.size === tasks.length && tasks.length > 0}
                            onChange={() => {
                              if (selectedTasks.size === tasks.length) setSelectedTasks(new Set());
                              else setSelectedTasks(new Set(tasks.map(t => t.id)));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <button onClick={() => toggleTaskSort('id')} className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1">Task ID {taskSortIcon('id')}</button>
                        <button onClick={() => toggleTaskSort('title')} className="py-3 px-3 text-left flex items-center gap-1">Title {taskSortIcon('title')}</button>
                        <button onClick={() => toggleTaskSort('status')} className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1">Status {taskSortIcon('status')}</button>
                        <button onClick={() => toggleTaskSort('priority')} className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1">Priority {taskSortIcon('priority')}</button>
                        <button onClick={() => toggleTaskSort('department')} className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1">Department {taskSortIcon('department')}</button>
                        <button onClick={() => toggleTaskSort('assignee')} className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1">Assignee {taskSortIcon('assignee')}</button>
                        <button onClick={() => toggleTaskSort('due_date')} className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1">Due Date {taskSortIcon('due_date')}</button>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedTasks.map(task => {
                          const isSelected = selectedTasks.has(task.id);
                          const due = task.due_date ? formatDate(task.due_date) : '—';
                          return (
                            <div
                              key={task.id}
                              onClick={() => navigate(`/task/${task.task_trackid}`)}
                              className={`${taskListGridCols} items-center text-sm bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors`}
                            >
                              <div className="flex items-center justify-center py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </div>
                              <div className="py-3 px-3 text-left text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                #{task.task_trackid}
                              </div>
                              <div className="py-3 px-3 text-left text-gray-900 dark:text-gray-100">
                                <span className="block truncate">{task.title}</span>
                              </div>
                              <div className="py-3 px-3 flex justify-center">
                                <button
                                  className="focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setSelectedStatus(task.task_status);
                                    setUpdateStatusModalOpen(true);
                                  }}
                                >
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.task_status)}`}>
                                    {task.task_status.replace('_', ' ')}
                                  </span>
                                </button>
                              </div>
                              <div className="py-3 px-3 flex justify-center">
                                <button
                                  className="focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setSelectedPriority(task.priority);
                                    setPriorityModalOpen(true);
                                  }}
                                >
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </button>
                              </div>
                              <div className="py-3 px-3 text-left text-gray-700 dark:text-gray-200">
                                <span className="block truncate">{task.department?.name || '—'}</span>
                              </div>
                              <div className="py-3 px-3 text-left text-gray-700 dark:text-gray-200">
                                <button
                                  className="text-left w-full truncate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setAssignModalOpen(true);
                                  }}
                                >
                                  {task.assigned_to ? task.assigned_to.name || `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'Unassigned'}
                                </button>
                              </div>
                              <div className="py-3 px-3 text-center text-gray-700 dark:text-gray-200 truncate" title={due}>
                                {due}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span>
                  {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalCount)} of {totalCount}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage * limit >= totalCount}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Task Details */}
          {isLoading ? (
            <TicketDetailSkeleton />
          ) : selectedTask && showDetailPanel ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Header and Summary Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Header Section */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                          {selectedTask.title}
                        </h1>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {selectedTask.task_trackid}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Created {formatRelativeTime(selectedTask.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTask.task_status)}`}>
                            {selectedTask.task_status.replace("_", " ").toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedTask.priority)}`}>
                            {selectedTask.priority?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 ml-6 flex-shrink-0">
                        {!selectedTask.assigned_to && (
                          <button
                            onClick={handleAssignToMe}
                            disabled={isAssigning}
                            className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {isAssigning ? 'Assigning...' : 'Assign to me'}
                          </button>
                        )}

                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                          <div className="flex items-center space-x-1">
                            <Tooltip
                              key={`status-tooltip-${selectedTask.task_status}`}
                              content={
                                <div className="p-4">
                                  <UpdateTaskStatus
                                    handleStatusUpdate={handleStatusUpdate}
                                    isSubmitting={isSubmitting}
                                    selectedOption={selectedStatus}
                                    setSelectedOption={setSelectedStatus}
                                    statusDescription={statusDescription}
                                    setStatusDescription={setStatusDescription}
                                    currentStatus={selectedTask.task_status}
                                  />
                                </div>
                              }
                            >
                              <button
                                className="inline-flex items-center justify-center w-10 h-10 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all duration-200 group"
                                title="Update Status"
                              >
                                <Edit3 size={18} className="group-hover:scale-110 transition-transform" />
                              </button>
                            </Tooltip>

                            {user?.role.toUpperCase() === "ADMIN" && (
                              <Tooltip
                                content={
                                  <div className="p-4">
                                    <Select
                                      id="assign-agent"
                                      label="Select Agent"
                                      value={selectedAgentId}
                                      onChange={setSelectedAgentId}
                                      options={[
                                        { value: "", label: "Choose agent...", disabled: true },
                                        ...(agents && agents.length > 0
                                          ? agents
                                            .filter(agent => agent.id !== selectedTask.assigned_to?.id)
                                            .map(agent => ({
                                              value: agent.id.toString(),
                                              label: getAgentDisplayName(agent)
                                            }))
                                          : [{ value: "", label: "No agents found", disabled: true }]
                                        )
                                      ]}
                                      placeholder="Choose agent..."
                                      size="md"
                                      required={true}
                                      allowSearch={true}
                                    />
                                    <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                                      <button
                                        onClick={handleAssign}
                                        disabled={isSubmitting || !selectedAgentId}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isSubmitting ? "Please wait.. " : "Reassign"}
                                      </button>
                                    </div>
                                  </div>
                                }
                              >
                                <button
                                  className="inline-flex items-center justify-center w-10 h-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 group"
                                  title={selectedTask.assigned_to ? "Reassign Task" : "Assign Task"}
                                >
                                  <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assignee</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            <span
                              className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Click to change assignee"
                              onClick={() => setAssignModalOpen(true)}
                            >
                              {selectedTask.assigned_to ? selectedTask.assigned_to.name : 'Unassigned'}
                              <Edit3 size={12} className="inline ml-1 opacity-50" />
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Tag className="w-4 h-4 mr-2 text-gray-500" />
                            General
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Status & Priority</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                            <span
                              className="font-medium cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors capitalize"
                              title="Click to change status"
                              onClick={() => setUpdateStatusModalOpen(true)}
                            >
                              {selectedTask.task_status.replace('_', ' ')}
                              <Edit3 size={12} className="inline ml-1 opacity-50" />
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <AlertTriangle className="w-4 h-4 mr-2 text-gray-500" />
                            <span
                              className="font-medium cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors capitalize"
                              title="Click to change priority"
                              onClick={() => setPriorityModalOpen(true)}
                            >
                              {selectedTask.priority || 'N/A'}
                              <Edit3 size={12} className="inline ml-1 opacity-50" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            Created: {formatDate(selectedTask.created_at)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            Due: {selectedTask.due_date ? formatDate(selectedTask.due_date) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                      </div>
                      {selectedTask.description ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none  overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                        />
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">No description provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      <button onClick={() => setActiveTab('activity')} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'activity' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        <MessageCircle className="w-4 h-4" />
                        <span>Activity Stream</span>
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'activity' && (
                      <TaskActivityStream
                        taskId={selectedTask.id}
                        reloader={reloader}
                        isCustomerView={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'detailed' && showDetailPanel ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No task selected" message="Please select a task to view its details." />
            </div>
          ) : null}
        </div>
      </div>

      {/* Create task modal */}
      <Modal
        size='4xl'
        isOpen={createTaskModal}
        onClose={handleCloseCreateTaskModal}
        title="Create New Task"
        closeOnBackdropClick={false}
      >
        {
          createTaskModal && <CreateTaskModal
            reload={() => fetchTasks(currentPage)}
            onclose={handleCloseCreateTaskModal}
            onSuccess={confirmCloseCreateTaskModal}
            onDirtyChange={setIsCreateTaskModalDirty}
          />
        }
      </Modal>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        show={showCreateTaskCloseConfirm}
        cancel={() => setShowCreateTaskCloseConfirm(false)}
        onConfirm={confirmCloseCreateTaskModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        variant="warning"
        confirmText="Close Anyway"
        cancelText="Keep Editing"
      />

      {/* Assign Task Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Task"
      >
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Agent
            </label>
            <Select
              id="assign-agent-modal"
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              options={[
                { value: "", label: "Choose agent...", disabled: true },
                ...(agents && agents.length > 0
                  ? agents
                    .filter(agent => agent.id !== selectedTask?.assigned_to?.id)
                    .map(agent => ({
                      value: agent.id.toString(),
                      label: getAgentDisplayName(agent)
                    }))
                  : [{ value: "", label: "No agents found", disabled: true }]
                )
              ]}
              placeholder="Choose agent..."
              size="md"
              required={true}
              allowSearch={true}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleAssign();
                setAssignModalOpen(false);
              }}
              disabled={isSubmitting || !selectedAgentId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={updateStatusModalOpen}
        onClose={() => setUpdateStatusModalOpen(false)}
        title="Update Task Status"
      >
        <div className="p-4">
          <UpdateTaskStatus
            handleStatusUpdate={() => {
              handleStatusUpdate();
              setUpdateStatusModalOpen(false);
            }}
            isSubmitting={isSubmitting}
            selectedOption={selectedStatus}
            setSelectedOption={setSelectedStatus}
            statusDescription={statusDescription}
            setStatusDescription={setStatusDescription}
            currentStatus={selectedTask?.task_status || 'todo'}
          />
        </div>
      </Modal>

      <UpdatePriorityModal
        ticketId={selectedTask?.id?.toString() || ''}
        currentPriority={selectedPriority || selectedTask?.priority || 'medium'}
        isOpen={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        onPriorityUpdated={() => fetchTasks(currentPage)}
      />

      {/* Attach to Ticket Modal */}
      <Modal
        isOpen={attachTicketModalOpen}
        onClose={() => setAttachTicketModalOpen(false)}
        title="Attach Task to Ticket"
      >
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Ticket
            </label>
            <Select
              id="attach-ticket-modal"
              value={selectedTicketId}
              onChange={setSelectedTicketId}
              options={[
                { value: "", label: "Choose ticket...", disabled: true },
                ...(tickets && tickets.length > 0
                  ? tickets.map(ticket => ({
                    value: ticket.id.toString(),
                    label: `${ticket.ticket_id} - ${ticket.title}`
                  }))
                  : [{ value: "", label: "No tickets found", disabled: true }]
                )
              ]}
              placeholder="Choose ticket..."
              size="md"
              required={true}
              allowSearch={true}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setAttachTicketModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleAttachToTicket();
                setAttachTicketModalOpen(false);
              }}
              disabled={isSubmitting || !selectedTicketId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Attaching..." : "Attach"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Attach File Modal */}
      <Modal
        isOpen={attachFileModalOpen}
        onClose={() => setAttachFileModalOpen(false)}
        title="Attach File to Task"
      >
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            File attachment feature is not yet implemented for tasks.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setAttachFileModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
