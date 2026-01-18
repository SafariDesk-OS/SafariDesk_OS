import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Plus, User, Clock, MessageCircle, FileText, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Paperclip, LayoutList, LayoutGrid, Grid3x3, Eye, Calendar, Mail, Phone, Tag, CheckCircle, Edit3, UserCheck, CheckSquare, List, AlertCircle, ShieldAlert, Archive, Trash2, Download, RotateCcw, Link as LinkIcon, Building, AlertTriangle, UserX, XCircle, Inbox, Filter, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import { Dropdown } from '../../components/ui/Dropdown';
import { FilterDialog } from '../../components/ui/FilterDialog';
import { useAuthStore } from '../../stores/authStore';
import { APIS } from '../../services/apis';
import http from '../../services/http';
import { errorNotification, successNotification } from '../../components/ui/Toast';
import { Agent, Ticket } from '../../types';
import TicketAttachments from './mini/TicketAttachments';
import TicketTasks from './mini/TicketTasks';
import { formatRelativeTime } from '../../utils/helper';
import { SOURCE_OPTIONS, getSourceLabel, getSourceIcon as getSourceIconHelper, getStatusColor, getPriorityColor, formatDate } from '../../utils/displayHelpers';
import Select from '../../components/ui/Select';
import MultiSelectAgents from '../../components/ui/MultiSelectAgents';
import { TicketActivityStream } from './mini/TicketActivityStream';
import SlaInfo from './mini/SlaInfo';
import { Tooltip } from '../../components/ui/Tool';
import { Input } from '../../components/ui/Input';
import { useFetchAgents } from '../../services/agents';
import { AgentType, ApiResponse as AgentApiResponse } from '../../types/agents';
import UpdateTicketStatus from './mini/TicketUpdateStatus';
import TicketListSkeleton from '../../components/ui/TicketListSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import TicketDetailSkeleton from '../../components/ui/TicketDetailSkeleton';
import { GridTicketCard } from '../../components/tickets/GridCard';
import { Modal } from '../../components/ui/Modal';
import { CreateTicketModal } from '../../components/tickets/CreateTicketModal';
import { TicketCard } from '../../components/tickets/TicketCard';
import { DynamicStepper } from '../../components/ui/Stepper';
import { ReopenTicketModal } from './mini/ReopenTicketModal';
import { ViewModeDropdown } from '../../components/tickets/ViewModeDropdown';
import UpdateStatusModal from '../../components/tickets/UpdateStatusModal';
import UpdatePriorityModal from '../../components/tickets/UpdatePriorityModal';
import { TaskListDialog } from '../../components/tickets/TaskListDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { NewBadge } from '../../components/ui/NewBadge';
import { AGENT_TICKET_VIEW_ITEMS, TICKET_VIEW_ITEMS } from '../../components/layout/viewConfigs';
// Filter included in the main lucide-react import


// Type definitions based on your API response
interface ApiTicket {
  id: number;
  title: string;
  creator_name: string;
  creator_phone: string;
  creator_email: string;
  ticket_id: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  priority: string;
  priority_display: string;
  is_public: boolean;
  status: string;
  status_display: string;
  created_at: string;
  assigned_to: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    avatar_url?: string;
  } | null;
  breached: boolean;
  due_date?: string;
  source?: 'email' | 'web' | 'phone' | 'chat' | 'chatbot' | 'api' | 'internal' | 'customer_portal'; // Ticket source field
  linked_tasks_count?: number;
  is_opened?: boolean;
  has_new_reply?: boolean;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiTicket[];
}

interface Watcher {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AssignTicketPayload {
  ticket_id: string;
  agent_id: number;
}

interface AddWatchersPayload {
  watchers: number[];
}


export default function TicketManagementSystem() {

  const { user } = useAuthStore()
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();
  const isAdmin =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'superuser' ||
    role === 'administrator';
  const defaultView = role ? (isAdmin ? 'all_unresolved' : 'all_unassigned') : 'all_unresolved';
  const viewItems = role ? (isAdmin ? TICKET_VIEW_ITEMS : AGENT_TICKET_VIEW_ITEMS) : TICKET_VIEW_ITEMS;

  // API state management
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [limit, setLimit] = React.useState(() => {
    const saved = localStorage.getItem('ticketPageSize');
    return saved ? Number(saved) : 10;
  });
  const [createTicket, setCreateTicket] = useState(false)
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [activeView, setActiveView] = useState('all_unresolved');


  // State from ViewTicket
  const [reloader, setReloader] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedWatchers, setSelectedWatchers] = useState<number[]>([]);
  const [ticketWatchers, setTicketWatchers] = useState<Watcher[]>([]);
  const [ticketTags, setTicketTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [showSourceEditModal, setShowSourceEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const { data: agentResponse = [] } = useFetchAgents();
  const agentsData: AgentType[] = (agentResponse as AgentApiResponse)?.results || [];
  const isUserWatcher = ticketWatchers.some(watcher => watcher.id === user?.user_id);
  const isTicketClosed = selectedTicket?.status === 'closed';


  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState<'detailed' | 'card' | 'list'>(
    (localStorage.getItem('ticketViewMode') as 'detailed' | 'card' | 'list') || 'list'
  );
  const [detailPanelOpen, setDetailPanelOpen] = useState(true);

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ticketViewMode', viewMode);
  }, [viewMode]);
  const viewModes = [
    { key: 'detailed', label: 'Detailed View', icon: FileText },
    { key: 'card', label: 'Card View', icon: LayoutGrid },
    { key: 'list', label: 'List View', icon: LayoutList },
  ];
  const [isCreateTicketModalDirty, setIsCreateTicketModalDirty] = useState(false);
  const [showCreateTicketCloseConfirm, setShowCreateTicketCloseConfirm] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [linkedTasksCount, setLinkedTasksCount] = useState(0);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogTicketId, setTaskDialogTicketId] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [allowSLA, setAllowSLA] = useState(true); // SLA configuration state
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState('');

  const viewModeLabel =
    viewMode === 'detailed'
      ? 'Detailed View'
      : viewMode === 'card'
        ? 'Card View'
        : 'List View';
  const ViewModeIcon = viewMode === 'card' ? LayoutGrid : LayoutList;
  type SortField = 'ticket_id' | 'title' | 'status' | 'priority' | 'department' | 'author' | 'assignee' | 'due_date' | 'tasks';
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const statusPillClass = (status: string) => {
    const tone = status.toLowerCase();
    const base = 'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border';
    const toneClass =
      tone === 'in_progress'
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
        : tone === 'on_hold' || tone === 'hold'
          ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          : tone === 'closed'
            ? 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500'
            : tone === 'assigned'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    return `${base} ${toneClass}`;
  };

  const priorityPillClass = (priority: string) => {
    const tone = priority.toLowerCase();
    const base = 'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border';
    const toneClass =
      tone === 'critical'
        ? 'bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-600'
        : tone === 'high' || tone === 'urgent'
          ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
          : tone === 'medium' || tone === 'normal'
            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
            : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    return `${base} ${toneClass}`;
  };

  const statusLabel = (status: string) => status.replace(/_/g, ' ');
  const listGridCols = 'grid w-full min-w-full grid-cols-[50px_minmax(110px,max-content)_minmax(200px,2fr)_minmax(120px,150px)_minmax(110px,130px)_minmax(130px,150px)_minmax(120px,140px)_minmax(130px,150px)_minmax(100px,120px)_minmax(70px,80px)]';
  const showDetailPanel = viewMode === 'detailed' && detailPanelOpen;
  const formatUserName = (user?: { firstName?: string; lastName?: string; email?: string }) => {
    if (!user) return 'Unassigned';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || 'Unassigned';
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const priorityOrder: Record<string, number> = {
    critical: 4,
    urgent: 3,
    high: 2,
    medium: 1,
    normal: 1,
    low: 0,
  };

  const listTickets = useMemo(() => {
    if (viewMode !== 'list' || !sortField) return tickets;
    const toComparable = (ticket: Ticket, field: SortField) => {
      switch (field) {
        case 'ticket_id':
          return ticket.ticket_id || '';
        case 'title':
          return ticket.createdAt ? new Date(ticket.createdAt).getTime() : 0;
        case 'status':
          return ticket.status || '';
        case 'priority':
          return priorityOrder[ticket.priority?.toLowerCase()] ?? 0;
        case 'department':
          return ticket.department?.name || '';
        case 'author':
          return formatUserName(ticket.requester);
        case 'assignee':
          return formatUserName(ticket.assignee);
        case 'due_date':
          return ticket.dueDate ? new Date(ticket.dueDate).getTime() : 0;
        case 'tasks':
          return ticket.linked_tasks_count ?? 0;
        default:
          return '';
      }
    };

    return [...tickets].sort((a, b) => {
      const aVal = toComparable(a, sortField);
      const bVal = toComparable(b, sortField);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr === bStr) return 0;
      if (sortDirection === 'asc') {
        return aStr > bStr ? 1 : -1;
      }
      return aStr < bStr ? 1 : -1;
    });
  }, [tickets, viewMode, sortField, sortDirection]);

  useEffect(() => {
    localStorage.setItem('ticketViewMode', viewMode);
  }, [viewMode]);

  // Sync activeView with URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const viewParam = params.get('view');

    // Check for status param first (most common)
    if (statusParam) {
      // Map old status params (if any) to new view keys
      const viewMap: Record<string, string> = {
        'all_tickets': 'all_tickets',
        'all_unassigned': 'all_unassigned',
        'all_unresolved': 'all_unresolved',
        'all_resolved': 'all_resolved',
        'reopened': 'reopened',
        'my_overdue': 'my_overdue',
        'my_unresolved': 'my_unresolved',
        'my_resolved': 'my_resolved',
        'requested_by_me': 'requested_by_me',
        'sla_breached': 'sla_breached',
        'archived': 'archived',
        'trash': 'trash',
        // Legacy names for backwards compatibility
        'all_unassigned_tickets': 'all_unassigned',
        'all_unsolved_tickets': 'all_unresolved',
        'all_resolved_tickets': 'all_resolved',
        'reopened_tickets': 'reopened',
        'my_resolution_overdue': 'my_overdue',
        'my_unsolved_tickets': 'my_unresolved',
        'my_resolved_tickets': 'my_resolved',
        'sla_breached_tickets': 'sla_breached',
        'archived_tickets': 'archived',
        'trash_tickets': 'trash',
        'closed': 'all_resolved' // Map 'closed' to all_resolved view
      };

      const mappedView = viewMap[statusParam] || statusParam;
      const allowedViews = new Set([
        'all_tickets',
        'all_unassigned',
        'all_unresolved',
        'all_resolved',
        'reopened',
        'my_overdue',
        'my_unresolved',
        'my_resolved',
        'requested_by_me',
        'sla_breached',
        'archived',
        'trash',
      ]);
      const targetView = allowedViews.has(mappedView) ? mappedView : defaultView;
      if (targetView !== activeView) {
        setActiveView(targetView);
      }
    }
    // Otherwise check for view param (for dashboard assigned card)
    else if (viewParam) {
      const viewMap: Record<string, string> = {
        'my_tickets': 'my_unresolved'
      };
      const allowedViews = new Set([
        'all_tickets',
        'all_unassigned',
        'all_unresolved',
        'all_resolved',
        'reopened',
        'my_overdue',
        'my_unresolved',
        'my_resolved',
        'requested_by_me',
        'sla_breached',
        'archived',
        'trash',
      ]);
      const mappedView = viewMap[viewParam] || viewParam;
      const targetView = allowedViews.has(mappedView) ? mappedView : defaultView;
      if (targetView !== activeView) {
        setActiveView(targetView);
      }
    } else if (activeView !== defaultView) {
      setActiveView(defaultView);
    }
  }, [location.search, activeView, defaultView]);

  // Selection state for bulk actions
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  // Selection handlers
  const handleTicketSelection = (ticketId: string, selected: boolean) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      return newSet;
    });
  };

  const handleSelectAllVisible = (checked: boolean) => {
    setSelectedTickets(prev => {
      const next = new Set(prev);
      tickets.forEach(ticket => {
        if (checked) {
          next.add(ticket.id);
        } else {
          next.delete(ticket.id);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map(ticket => ticket.id)));
    }
  };

  // Bulk action handlers
  const handleBulkArchive = async () => {
    if (selectedTickets.size === 0) return;
    try {
      const response = await http.post('/ticket/bulk/archive/', {
        ticket_ids: Array.from(selectedTickets).map(id => Number(id))
      });
      console.log('Archive response:', response.data);
      setSelectedTickets(new Set());
      // Refresh tickets list
      fetchTickets(currentPage, activeView);
    } catch (error) {
      console.error('Error archiving tickets:', error);
      errorNotification('Failed to archive selected tickets');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) return;
    try {
      const response = await http.post('/ticket/bulk/delete/', {
        ticket_ids: Array.from(selectedTickets).map(id => Number(id))
      });
      console.log('Delete response:', response.data);
      setSelectedTickets(new Set());
      // Refresh tickets list
      fetchTickets(currentPage, activeView);
    } catch (error) {
      console.error('Error deleting tickets:', error);
      errorNotification('Failed to delete selected tickets');
    }
  };

  const handleSingleTicketDelete = async () => {
    if (!selectedTicket) return;
    try {
      await http.delete(`/ticket/${selectedTicket.id}/`);
      successNotification('Ticket deleted successfully');
      setShowDeleteModal(false);
      setSelectedTicket(null);
      fetchTickets(currentPage, activeView);
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleBulkExport = async () => {
    if (selectedTickets.size === 0) return;
    try {
      const response = await http.post('/ticket/export/', {
        ticket_ids: Array.from(selectedTickets).map(id => Number(id))
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSelectedTickets(new Set());
    } catch (error) {
      console.error('Error exporting tickets:', error);
      errorNotification('Failed to export selected tickets');
    }
  };

  // Get current view context
  const getViewContext = () => {
    if (activeView === 'archived') return 'archived';
    if (activeView === 'trash') return 'trash';
    return 'normal';
  };

  // Additional bulk action handlers
  const handleBulkUnarchive = async () => {
    if (selectedTickets.size === 0) return;
    try {
      const response = await http.post('/ticket/bulk/unarchive/', {
        ticket_ids: Array.from(selectedTickets).map(id => Number(id))
      });
      console.log('Unarchive response:', response.data);
      setSelectedTickets(new Set());
      fetchTickets(currentPage, activeView);
    } catch (error) {
      console.error('Error unarchiving tickets:', error);
      errorNotification('Failed to unarchive selected tickets');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTickets.size === 0) return;
    try {
      const response = await http.post('/ticket/bulk/restore/', {
        ticket_ids: Array.from(selectedTickets).map(id => Number(id))
      });
      console.log('Restore response:', response.data);
      setSelectedTickets(new Set());
      fetchTickets(currentPage, activeView);
    } catch (error) {
      console.error('Error restoring tickets:', error);
      errorNotification('Failed to restore selected tickets');
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

  // Helper to select ticket and set linked tasks count from API response
  const selectTicket = (ticket: Ticket | null) => {
    setSelectedTicket(ticket);
    // Use linked_tasks_count from ticket data if available
    setLinkedTasksCount(ticket?.linked_tasks_count ?? 0);
  };

  const handleListRowClick = (ticket: Ticket) => {
    navigate(`/ticket/${ticket.ticket_id}`);
  };

  const handleAction = (action: string, ticket: Ticket) => {
    if (action === 'delete') {
      setSelectedTicket(ticket);
      setShowDeleteModal(true);
    } else {
      // Default behaviour: focus this ticket in the detailed panel
      selectTicket(ticket);
    }
    setOpenDropdownId(null);
    setViewMode('detailed');
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
    'Pending';

  // Check if any filters are active
  const hasActiveFilters =
    (statusFilter && statusFilter !== 'all') ||
    (priorityFilter && priorityFilter !== 'all') ||
    (assigneeFilter && assigneeFilter !== 'all') ||
    (departmentFilter && departmentFilter !== 'all') ||
    (categoryFilter && categoryFilter !== 'all') ||
    (dateFromFilter !== '') ||
    (dateToFilter !== '');

  // Count active filters
  const activeFilterCount = [
    statusFilter && statusFilter !== 'all',
    priorityFilter && priorityFilter !== 'all',
    assigneeFilter && assigneeFilter !== 'all',
    departmentFilter && departmentFilter !== 'all',
    categoryFilter && categoryFilter !== 'all',
    dateFromFilter !== '' || dateToFilter !== '',
  ].filter(Boolean).length;

  // Get active filter labels for display
  const getActiveFilterLabels = () => {
    const labels: string[] = [];
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
    setCategoryFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const transformApiTicket = (apiTicket: ApiTicket): Ticket => ({
    id: apiTicket.id.toString(),
    title: apiTicket.title || '',
    description: apiTicket.description || '',
    status: apiTicket.status as Ticket['status'] || 'open',
    priority: apiTicket.priority_display?.toLowerCase() as Ticket['priority'] || 'normal',
    category: apiTicket.category?.name || 'General',
    department: apiTicket.department ? {
      id: apiTicket.department.id,
      name: apiTicket.department.name,
    } : undefined,
    ticket_id: apiTicket.ticket_id || '',
    assigneeId: apiTicket.assigned_to?.id.toString(),
    assignee: apiTicket.assigned_to ? {
      id: apiTicket.assigned_to.id.toString(),
      email: apiTicket.assigned_to.email || '',
      firstName: apiTicket.assigned_to.first_name || '',
      lastName: apiTicket.assigned_to.last_name || '',
      role: 'agent',
      workspaceId: 'default-workspace-id',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar_url: apiTicket.assigned_to.avatar_url,
    } : undefined,
    requesterId: 'unknown-requester-id',
    requester: {
      id: 'unknown-requester-id',
      email: apiTicket.creator_email || '',
      firstName: apiTicket.creator_name.split(' ')[0] || '',
      lastName: apiTicket.creator_name.split(' ').slice(1).join(' ') || '',
      role: 'staff',
      workspaceId: 'default-workspace-id',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phone: apiTicket.creator_phone || '',
    },
    workspaceId: 'default-workspace-id',
    tags: [],
    attachments: [],
    comments: [],
    createdAt: apiTicket.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: apiTicket.due_date,
    resolvedAt: undefined,
    breached: apiTicket.breached,
    source: apiTicket.source || 'web', // Added source field mapping
    linked_tasks_count: apiTicket.linked_tasks_count ?? 0,
    is_opened: apiTicket.is_opened ?? false,
    has_new_reply: apiTicket.has_new_reply ?? false,
  });

  // Handlers for create ticket modal close confirmation
  const handleCloseCreateTicketModal = () => {
    if (isCreateTicketModalDirty) {
      setShowCreateTicketCloseConfirm(true);
      return;
    }
    setCreateTicket(false);
    setIsCreateTicketModalDirty(false);
  };

  const confirmCloseCreateTicketModal = () => {
    setShowCreateTicketCloseConfirm(false);
    setCreateTicket(false);
    setIsCreateTicketModalDirty(false);
  };


  const fetchTickets = React.useCallback(async (page: number = 1, view: string = 'all_unresolved', limitOverride?: number) => {
    setIsLoading(true);
    const effectiveLimit = limitOverride ?? limit;

    try {
      const offset = (page - 1) * effectiveLimit;
      const params: Record<string, string | number> = {
        page_size: effectiveLimit,
        offset,
        view: view,
      };

      // Add search filter if search query exists
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add filter params
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
      if (assigneeFilter && assigneeFilter !== 'all') params.assigned_to = assigneeFilter;
      if (departmentFilter && departmentFilter !== 'all') params.department = departmentFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (dateFromFilter) params.date_from = dateFromFilter;
      if (dateToFilter) params.date_to = dateToFilter;

      const response = await http.get<ApiResponse>(APIS.LIST_TICKETS, { params });
      const transformedTickets = response.data.results.map(transformApiTicket);
      setTickets(transformedTickets);
      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while fetching tickets';
      errorNotification(errorMsg);
    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [limit, searchQuery, statusFilter, priorityFilter, assigneeFilter, departmentFilter, categoryFilter, dateFromFilter, dateToFilter]);

  const fetchTicketCounts = async () => {
    try {
      const response = await http.get(APIS.TICKET_COUNTS);
      setTicketCounts(response.data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch ticket counts";
      console.error(errorMsg);
    }
  };

  // Search on current page like Ctrl+F
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchMatches([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const matches = tickets
      .filter(ticket =>
        ticket.ticket_id.toLowerCase().includes(queryLower) ||
        ticket.title.toLowerCase().includes(queryLower) ||
        (ticket.description && ticket.description.toLowerCase().includes(queryLower))
      )
      .slice(0, 10)
      .map(ticket => ({
        id: ticket.id,
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        description: ticket.description?.substring(0, 100),
        type: 'ticket'
      }));

    setSearchMatches(matches);
  };

  // Handle search result click
  const handleSearchResultClick = (result: any) => {
    const foundTicket = tickets.find(t => t.id === result.id) || null;
    selectTicket(foundTicket);
    setSearchQuery('');
    setShowSearchDialog(false);
    setSearchMatches([]);
  };

  React.useEffect(() => {
    fetchTickets(currentPage, activeView);
    fetchTicketCounts();
  }, [fetchTickets, currentPage, activeView, limit]);

  // Detailed view shows inline - no navigation needed

  const allVisibleSelected = tickets.length > 0 && tickets.every(t => selectedTickets.has(t.id));
  const someVisibleSelected = tickets.some(t => selectedTickets.has(t.id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const handleNextTicket = () => {
    if (!selectedTicket || tickets.length <= 1) return;
    const currentIndex = tickets.findIndex(t => t.id === selectedTicket.id);
    const nextIndex = (currentIndex + 1) % tickets.length;
    selectTicket(tickets[nextIndex]);
  };

  const handlePreviousTicket = () => {
    if (!selectedTicket || tickets.length <= 1) return;
    const currentIndex = tickets.findIndex(t => t.id === selectedTicket.id);
    const prevIndex = (currentIndex - 1 + tickets.length) % tickets.length;
    selectTicket(tickets[prevIndex]);
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

  const getSourceDisplay = (source?: string) => {
    return getSourceLabel(source);
  };

  const getSourceIcon = (source?: string) => {
    return getSourceIconHelper(source);
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await http.get(`${APIS.TICKET_DETAILS}${ticketId}/read-by-ticket-id`);
      if (response.data.ticket) {
        const updatedTicket = transformApiTicket(response.data.ticket);
        setSelectedTicket(updatedTicket);

        // Also update the ticket in the list if it's there
        setTickets(prev => prev.map(ticket =>
          ticket.id === ticketId ? { ...updatedTicket } : ticket
        ));
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh ticket details";
      errorNotification(errorMsg);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await http.get(`${APIS.LIST_AGENTS}?pagination=no`);
      setAgents(response.data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      errorNotification(errorMsg);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await http.get(APIS.LIST_DEPARTMENTS);
      setDepartments(response.data.results || response.data || []);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load departments";
      console.error(errorMsg);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await http.get(APIS.LIST_TICKET_CATEGORIES + '?pagination=no');
      setCategories(response.data || response.data.results || []);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load categories";
      console.error(errorMsg);
    }
  };

  const assignAgentOptions = React.useMemo(() => {
    const base = [{ value: "", label: "Choose agent...", disabled: true }];
    if (!agents || agents.length === 0 || !selectedTicket) return base;
    return [
      ...base,
      ...agents
        .filter(agent => {
          if (selectedTicket.assignee && agent.id.toString() === selectedTicket.assignee.id) return false;
          if (selectedTicket.department && agent.department && agent.department.length > 0) {
            const deptId = typeof selectedTicket.department === 'number' ? selectedTicket.department : selectedTicket.department.id;
            return agent.department.some(dept => dept.id === deptId);
          }
          return true;
        })
        .map(agent => ({ value: agent.id.toString(), label: agent.name || "Unknown Agent" })),
    ];
  }, [agents, selectedTicket]);

  const fetchTags = async (currentTicketId: string) => {
    try {
      const response = await http.get(`${APIS.LIST_TAGS}/${currentTicketId}`);
      setTicketTags(response.data.tags || []);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load tags";
      errorNotification(errorMsg);
    }
  };

  const fetchWatchers = async (currentTicketId: string) => {
    try {
      const response = await http.get(`${APIS.LIST_WATCHERS}/${currentTicketId}`);
      setTicketWatchers(response.data);
      setSelectedWatchers(response.data.map((watcher: Watcher) => watcher.id));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to load watchers";
      errorNotification(errorMsg);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchDepartments();
    fetchCategories();
  }, []);

  // Fetch SLA configuration
  useEffect(() => {
    const fetchSLAConfig = async () => {
      try {
        const response = await http.get(APIS.SLA_CONFIG_CURRENT);
        setAllowSLA(response.data?.allow_sla ?? true);
      } catch (error) {
        console.error('Failed to fetch SLA configuration:', error);
        setAllowSLA(true); // Default to true if fetch fails
      }
    };
    fetchSLAConfig();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setSelectedStatus(selectedTicket.status);
      fetchWatchers(selectedTicket.id);
      fetchTags(selectedTicket.id);
    }
  }, [selectedTicket]);

  async function handleStatusUpdate() {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true)
      const response = await http.put(`${APIS.TICKET_UPDATE_STATUS}/${selectedTicket.id}`, {
        status: selectedStatus,
        notes: statusDescription
      });

      // Immediately update the selected ticket
      const updatedTicket: Ticket = {
        ...selectedTicket,
        status: selectedStatus as Ticket['status']
      };
      setSelectedTicket(updatedTicket);

      // Update the ticket in the list
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));

      successNotification(response.data.message)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!selectedTicket) return;
    setIsAssigning(true);
    try {
      const response = await http.get(`${APIS.TICKET_ASSIGN_TO_ME}${selectedTicket.id}`);
      successNotification(response.data.message);
      fetchTickets(currentPage, activeView);
      fetchTicketDetails(selectedTicket.id);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to assign ticket';
      errorNotification(errorMsg);
    } finally {
      setIsAssigning(false);
    }
  };

  async function handleAssign() {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true)
      const payload: AssignTicketPayload = {
        ticket_id: selectedTicket.id.toString(),
        agent_id: Number(selectedAgentId)
      };
      const response = await http.post(`${APIS.TICKET_ASSIGN}`, payload);
      successNotification(response.data.message)
      // Refresh list and selected ticket
      fetchTickets(currentPage, activeView);
      fetchTicketDetails(selectedTicket.id);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleComment(files?: FileList) {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true)
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('is_internal', isInternal.toString());
      if (files && files.length > 0) {
        for (const file of files) {
          formData.append('files', file);
        }
      }
      const response = await http.post(`${APIS.TICKET_COMMENT}${selectedTicket.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComment("")
      setIsInternal(false)
      setReloader(prev => prev + 1);
      successNotification(response.data.message)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add comment";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddWatchers() {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      const payload: AddWatchersPayload = { watchers: selectedWatchers };
      const response = await http.put(`${APIS.ADD_WATCHERS}/${selectedTicket.id}`, payload);
      fetchWatchers(selectedTicket.id);
      fetchTicketDetails(selectedTicket.id); // Refresh ticket details
      successNotification(response.data.message);
      fetchTickets(currentPage, activeView);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add watchers";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }


  async function handleAddTags() {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      const tagsArray = newTagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const payload = { tags: tagsArray };
      const response = await http.put(`${APIS.ADD_TAGS}/${selectedTicket.id}`, payload);
      fetchTags(selectedTicket.id);
      fetchTicketDetails(selectedTicket.id); // Refresh ticket details
      successNotification(response.data.message);
      setNewTagInput("");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to add tags";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReopen(reason: string) {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      const response = await http.post(`${APIS.TICKET_BASE}/${selectedTicket.id}/reopen/`, { reason });

      // Refresh ticket details and list from server
      fetchTickets(currentPage, activeView);
      fetchTicketDetails(selectedTicket.id); // Refresh ticket details

      successNotification(response.data.message);
      setIsReopenModalOpen(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to reopen ticket";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateSource() {
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      const response = await http.put(`${APIS.TICKET_UPDATE_SOURCE}/${selectedTicket.id}`, {
        source: selectedSource
      });
      successNotification(response.data.message || 'Ticket source updated successfully');
      fetchTickets(currentPage, activeView);
      fetchTicketDetails(selectedTicket.id);
      setShowSourceEditModal(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update source";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateDepartment() {
    if (!selectedTicket || !selectedDepartmentId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        department_id: Number(selectedDepartmentId)
      };
      const response = await http.put(`${APIS.TICKET_UPDATE_DEPARTMENT}/${selectedTicket.id}`, payload);

      // Find the selected department object
      const selectedDept = departments.find(d => d.id === Number(selectedDepartmentId));

      // Immediately update the selected ticket
      const updatedTicket: Ticket = {
        ...selectedTicket,
        department: selectedDept || selectedTicket.department
      };
      setSelectedTicket(updatedTicket);

      // Update the ticket in the list
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));

      successNotification(response.data.message || 'Department updated successfully');
      setSelectedDepartmentId("");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update department";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateCategory() {
    if (!selectedTicket || !selectedCategoryId) return;
    try {
      setIsSubmitting(true);
      const payload = {
        category_id: Number(selectedCategoryId),
        category: Number.isNaN(Number(selectedCategoryId)) ? selectedCategoryId : undefined,
      };
      const response = await http.put(`${APIS.TICKET_UPDATE_CATEGORY}/${selectedTicket.id}`, payload);

      // Find the selected category and update the UI
      const selectedCat = categories.find(c => c.id === Number(selectedCategoryId) || c.name === selectedCategoryId);
      const updatedTicket: Ticket = { ...selectedTicket, category: selectedCat?.name || selectedTicket.category } as Ticket;
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));

      successNotification(response.data.message || 'Category updated successfully');
      setSelectedCategoryId("");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update category";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateDueDate() {
    if (!selectedTicket || !selectedDueDate) return;
    
    // Validate that due date is in the future
    const selectedDate = new Date(selectedDueDate);
    const now = new Date();
    if (selectedDate <= now) {
      errorNotification('Due date must be in the future');
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Convert datetime-local format to ISO 8601
      const dueDateISO = selectedDate.toISOString();
      const payload = {
        due_date: dueDateISO
      };
      const response = await http.put(`${APIS.TICKET_UPDATE_DUE_DATE}/${selectedTicket.id}`, payload);

      // Update the selected ticket with new due date
      const updatedTicket: Ticket = {
        ...selectedTicket,
        dueDate: response.data.due_date || dueDateISO
      };
      setSelectedTicket(updatedTicket);

      // Update the ticket in the list
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));

      successNotification(response.data.message || 'Due date updated successfully');
      setSelectedDueDate('');
      setShowDueDateModal(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update due date";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdatePriority() {
    if (!selectedTicket || !selectedPriority) return;
    try {
      setIsSubmitting(true);
      const payload = { priority: selectedPriority };
      const response = await http.put(`${APIS.TICKET_UPDATE_PRIORITY}/${selectedTicket.id}`, payload);

      const updatedTicket: Ticket = { ...selectedTicket, priority: selectedPriority } as Ticket;
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));

      successNotification(response.data.message || 'Priority updated successfully');
      setSelectedPriority("");
      fetchTickets(currentPage, activeView);
      fetchTicketDetails(selectedTicket.id);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update priority";
      errorNotification(errorMsg);
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
              {/* Filter indicator - show when filters are active */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                    <Filter size={12} />
                    <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
                  </div>
                  {/* Show filter tags */}
                  <div className="hidden md:flex items-center gap-1">
                    {getActiveFilterLabels().slice(0, 2).map((label, index) => (
                      <span key={index} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {label}
                      </span>
                    ))}
                    {getActiveFilterLabels().length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        +{getActiveFilterLabels().length - 2} more
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${hasActiveFilters
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                title={showFilters ? 'Hide Advanced Search' : 'Show Advanced Search'}
              >
                <Filter size={16} />
                <span>Advanced Filters</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div> */}
              <button onClick={() => setCreateTicket(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <Plus size={16} />
                <span>Create</span>
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
                onClick={handlePreviousTicket}
                disabled={!selectedTicket || tickets.length <= 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
             <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1">
                <Eye size={16} /> {selectedTicket ? tickets.findIndex(t => t.id === selectedTicket.id) + 1 : 0}
              </button>


              <button 
                onClick={handleNextTicket}
                disabled={!selectedTicket || tickets.length <= 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button> */}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Tickets List */}
          <div className={`${viewMode === 'detailed' ? (showDetailPanel ? 'w-1/4' : 'w-full') : 'w-full'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
            {/* Filter Dialog */}
            <FilterDialog
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              filters={[
                // {
                //   id: 'status',
                //   title: 'Status',
                //   type: 'dropdown',
                //   value: statusFilter,
                //   options: [
                //     // { value: 'all', label: 'All Statuses' },
                //     // { value: 'created', label: 'Created' },
                //     { value: 'assigned', label: 'Assigned' },
                //     { value: 'in_progress', label: 'In Progress' },
                //     { value: 'hold', label: 'Hold' },
                //     { value: 'closed', label: 'Closed' },
                //   ],
                //   onChange: (v: string | (string | number)[] | { from: string; to: string }) => setStatusFilter(String(v)),
                // },
                {
                  id: 'priority',
                  title: 'Priority',
                  type: 'dropdown',
                  value: priorityFilter,
                  options: [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setPriorityFilter(String(v)),
                },
                {
                  id: 'assignee',
                  title: 'Assignee',
                  type: 'dropdown',
                  value: assigneeFilter,
                  options: [
                    { value: 'unassigned', label: 'Unassigned' },
                    ...(agents ? agents.map(agent => ({ value: agent.id.toString(), label: agent.name || 'Unknown Agent' })) : []),
                  ],
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setAssigneeFilter(String(v)),
                },
                {
                  id: 'department',
                  title: 'Department',
                  type: 'dropdown',
                  value: departmentFilter,
                  options: departments.map(dept => ({ value: dept.id, label: dept.name })),
                  onChange: (v: string | (string | number)[] | { from: string; to: string }) => setDepartmentFilter(String(v)),
                },
                {
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
                },
              ]}
              onApply={() => setShowFilters(false)}
              onReset={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setAssigneeFilter('all');
                setDepartmentFilter('all');
                setDateFromFilter('');
                setDateToFilter('');
              }}
              title="Filter Tickets"
            />

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 cursor-pointer" size={16} />
                <input
                  type="text"
                  placeholder="Search current results"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSearchDialog(true);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {/* Search Results Dialog */}
                {showSearchDialog && searchMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 dark:bg-gray-750 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Found {searchMatches.length} result{searchMatches.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {searchMatches.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col gap-1.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            #{result.ticket_id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {index + 1} of {searchMatches.length}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {result.title}
                        </span>
                        {result.description && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {result.description}...
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showSearchDialog && searchQuery.trim() && searchMatches.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>

              {/* Bulk Actions - Show when tickets are selected */}
              {selectedTickets.size > 0 && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedTickets.size} ticket{selectedTickets.size !== 1 ? 's' : ''} selected
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
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <>
                  <TicketListSkeleton />
                  <TicketListSkeleton />
                  <TicketListSkeleton />
                </>
              ) : tickets.length === 0 ? (
                <EmptyState />
              ) : viewMode === 'detailed' ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedTicket?.id === ticket.id ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' : ''
                      } ${ticket.breached ? 'border-l-4 border-l-red-500' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm overflow-hidden flex-shrink-0">
                        {ticket.requester && ticket.requester.avatar ? (
                          <img src={ticket.requester.avatar} alt={`${ticket.requester.firstName} ${ticket.requester.lastName}`} className="w-full h-full object-cover" />
                        ) : (
                          <span>{`${ticket.requester.firstName[0]?.toUpperCase() || ''}${ticket.requester.lastName[0]?.toUpperCase() || ''}`}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-gray-900 dark:text-gray-100 truncate flex items-center gap-2 ${!ticket.is_opened ? 'font-bold' : 'font-medium'}`}>{ticket.title} {(!ticket.is_opened || ticket.has_new_reply) && <NewBadge />}</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(ticket.createdAt), 'dd MMM')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{ticket.ticket_id}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : viewMode === 'card' ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.map(ticket => (
                    <GridTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      openDropdownId={selectedTicket?.id || null}
                      onDropdownToggle={(ticketid) => setSelectedTicket(tickets.find(t => t.id === ticketid) || null)}
                      onDropdownClose={() => setSelectedTicket(null)}
                      onAction={(action, ticket) => handleAction(action, ticket)}
                      isActive={selectedTicket?.id === ticket.id}
                      isSelected={selectedTickets.has(ticket.id)}
                      onSelectionChange={(ticketId, selected) => handleTicketSelection(ticketId, selected)}
                    />
                  ))}
                </div>
              ) : viewMode === 'list' ? (
                <div className="p-4">
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="min-w-[1140px]">
                      <div className={`${listGridCols} text-xs font-semibold uppercase tracking-wide bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
                        <div className="flex items-center justify-center py-3 px-3">
                          <input
                            ref={headerCheckboxRef}
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(e) => handleSelectAllVisible(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1"
                          onClick={() => toggleSort('ticket_id')}
                        >
                          Ticket ID {sortIcon('ticket_id')}
                        </button>
                        <button
                          className="py-3 px-3 text-left flex items-center gap-1"
                          onClick={() => toggleSort('title')}
                        >
                          Issue {sortIcon('title')}
                        </button>
                        <button
                          className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          onClick={() => toggleSort('status')}
                        >
                          Status {sortIcon('status')}
                        </button>
                        <button
                          className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          onClick={() => toggleSort('priority')}
                        >
                          Priority {sortIcon('priority')}
                        </button>
                        <button
                          className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1"
                          onClick={() => toggleSort('department')}
                        >
                          Department {sortIcon('department')}
                        </button>
                        <button
                          className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1"
                          onClick={() => toggleSort('author')}
                        >
                          Author {sortIcon('author')}
                        </button>
                        <button
                          className="py-3 px-3 text-left whitespace-nowrap flex items-center gap-1"
                          onClick={() => toggleSort('assignee')}
                        >
                          Assignee {sortIcon('assignee')}
                        </button>
                        <button
                          className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          onClick={() => toggleSort('due_date')}
                        >
                          Due Date {sortIcon('due_date')}
                        </button>
                        <button
                          className="py-3 px-3 text-center whitespace-nowrap flex items-center justify-center gap-1"
                          onClick={() => toggleSort('tasks')}
                        >
                          Tasks {sortIcon('tasks')}
                        </button>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {listTickets.map(ticket => {
                          const isSelected = selectedTickets.has(ticket.id);
                          const due = ticket.dueDate ? formatDate(ticket.dueDate) : '—';
                          const tasks = ticket.linked_tasks_count ?? 0;
                          return (
                            <div
                              key={ticket.id}
                              onClick={() => handleListRowClick(ticket)}
                              className={`${listGridCols} items-center text-sm bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors ${isSelected ? 'ring-1 ring-emerald-400 bg-green-50/70 dark:bg-emerald-900/20' : ''
                                }`}
                            >
                              <div className="flex items-center justify-center py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleTicketSelection(ticket.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </div>
                              <div className="py-3 px-3 text-left text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                #{ticket.ticket_id}
                              </div>
                              <div className="py-3 px-3 text-left text-gray-900 dark:text-gray-100">
                                <span className={`block truncate flex items-center gap-2 ${!ticket.is_opened ? 'font-bold' : ''}`}>{ticket.title} {(!ticket.is_opened || ticket.has_new_reply) && <NewBadge />}</span>
                              </div>
                              <div className="py-3 px-3 flex justify-center">
                                <button
                                  className="focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(ticket);
                                    setSelectedStatus(ticket.status);
                                    setShowStatusModal(true);
                                  }}
                                >
                                  <span className={statusPillClass(ticket.status)}>
                                    {statusLabel(ticket.status)}
                                  </span>
                                </button>
                              </div>
                              <div className="py-3 px-3 flex justify-center">
                                <button
                                  className="focus:outline-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(ticket);
                                    setSelectedPriority(ticket.priority);
                                    setShowPriorityModal(true);
                                  }}
                                >
                                  <span className={priorityPillClass(ticket.priority)}>
                                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                  </span>
                                </button>
                              </div>
                              <div className="py-3 px-3 text-left text-gray-700 dark:text-gray-200">
                                <button
                                  className="text-left w-full truncate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedTicket(ticket);
                                    setSelectedDepartmentId(ticket.department?.id?.toString() || '');
                                    setShowDepartmentModal(true);
                                  }}
                                >
                                  {ticket.department?.name || '—'}
                                </button>
                              </div>
                              <div className="py-3 px-3 text-left text-gray-700 dark:text-gray-200">
                                <span className="block truncate">{formatUserName(ticket.requester)}</span>
                              </div>
                              <div className="py-3 px-3 text-left text-gray-700 dark:text-gray-200">
                                <button
                                  className="text-left w-full truncate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedTicket(ticket);
                                    setShowAssignModal(true);
                                  }}
                                >
                                  {formatUserName(ticket.assignee)}
                                </button>
                              </div>
                              <div className="py-3 px-3 text-center text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                <button
                                  className="w-full text-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(ticket);
                                    setTaskDialogTicketId(ticket.id.toString());
                                    setTaskDialogOpen(true);
                                  }}
                                >
                                  {due}
                                </button>
                              </div>
                              <div className="py-3 px-3 text-center text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                <button
                                  className="w-full text-center font-normal"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTicket(ticket);
                                    setTaskDialogTicketId(ticket.id.toString());
                                    setTaskDialogOpen(true);
                                  }}
                                >
                                  {tasks}
                                </button>
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
                <div className="flex items-center gap-2">
                  <span>{(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalCount)}</span>
                  <span>of {totalCount}</span>
                  {hasActiveFilters && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">(filtered)</span>
                  )}
                  <span className="text-gray-400">|</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setLimit(newLimit);
                      localStorage.setItem('ticketPageSize', String(newLimit));
                      setCurrentPage(1);
                      fetchTickets(1, activeView, newLimit);
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </div>
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

          {/* Ticket Details */}
          {isLoading ? (
            <TicketDetailSkeleton />
          ) : selectedTicket && showDetailPanel ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Header and Summary Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Header Section */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                          {selectedTicket.title}
                        </h1>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {selectedTicket.ticket_id}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Created {formatRelativeTime(selectedTicket.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                            {selectedTicket.status.replace("_", " ").toUpperCase()}
                          </span>
                          <div className="inline-flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                              {selectedTicket.priority.toUpperCase()}
                            </span>
                            {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") && (
                              <Tooltip
                                content={
                                  <div className="p-4">
                                    <label htmlFor="priority-select-card" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Priority</label>
                                    <select
                                      id="priority-select-card"
                                      value={selectedPriority}
                                      onChange={(e) => setSelectedPriority(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-4"
                                    >
                                      <option value="">Select a Priority</option>
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                      <option value="urgent">Urgent</option>
                                    </select>
                                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                      <button
                                        onClick={() => setSelectedPriority("")}
                                        className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleUpdatePriority}
                                        disabled={isSubmitting || !selectedPriority}
                                        className="px-3 py-1 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {isSubmitting ? 'Updating...' : 'Update'}
                                      </button>
                                    </div>
                                  </div>
                                }
                              >
                                <button className="ml-2 inline-flex items-center justify-center w-7 h-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-all duration-200 group" title="Change Priority">
                                  <List size={14} className="group-hover:scale-110 transition-transform" />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 ml-6 flex-shrink-0">
                        {isTicketClosed ? (
                          <button
                            onClick={() => setIsReopenModalOpen(true)}
                            disabled={isSubmitting}
                            className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Reopening...' : 'Reopen Ticket'}
                          </button>
                        ) : (
                          <>
                            {!selectedTicket.assignee && (
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
                                <a
                                  href={`/helpcenter/tk/${selectedTicket.ticket_id}`}
                                  target='_blank'
                                  className="inline-flex items-center justify-center w-10 h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                  title="Customer Portal"
                                >
                                  <LinkIcon size={18} className="group-hover:scale-110 transition-transform" />
                                </a>

                                {!isUserWatcher && (
                                  <Tooltip
                                    key={`status-tooltip-${selectedTicket.status}`}
                                    content={
                                      <UpdateTicketStatus
                                        handleStatusUpdate={handleStatusUpdate}
                                        isSubmitting={isSubmitting}
                                        selectedOption={selectedStatus}
                                        setSelectedOption={setSelectedStatus}
                                        statusDescription={statusDescription}
                                        setStatusDescription={setStatusDescription}
                                        currentStatus={selectedTicket.status}
                                      />
                                    }
                                  >
                                    <button
                                      className="inline-flex items-center justify-center w-10 h-10 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all duration-200 group"
                                      title="Update Status"
                                    >
                                      <Edit3 size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                  </Tooltip>
                                )}

                                {/* Department Action - Change Department (Tooltip Pattern) */}
                                <Tooltip
                                  content={
                                    <div className="p-4">
                                      <label htmlFor="dept-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Department
                                      </label>
                                      <select
                                        id="dept-select"
                                        value={selectedDepartmentId}
                                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-4"
                                      >
                                        <option value="">Select a Department</option>
                                        {departments.map((dept) => (
                                          <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                          onClick={() => {
                                            setSelectedDepartmentId("");
                                          }}
                                          className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={handleUpdateDepartment}
                                          disabled={isSubmitting || !selectedDepartmentId}
                                          className="px-3 py-1 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                          {isSubmitting ? 'Updating...' : 'Update'}
                                        </button>
                                      </div>
                                    </div>
                                  }
                                >
                                  <button
                                    className="inline-flex items-center justify-center w-10 h-10 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group"
                                    title="Change Department"
                                  >
                                    <Building size={18} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                </Tooltip>

                                {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") && (
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
                                                .filter(agent => {
                                                  // Exclude currently assigned agent
                                                  if (selectedTicket.assignee && agent.id.toString() === selectedTicket.assignee.id) return false;
                                                  // Only show agents from the ticket's department
                                                  if (selectedTicket.department && agent.department && agent.department.length > 0) {
                                                    const deptId = typeof selectedTicket.department === 'number' ? selectedTicket.department : selectedTicket.department.id;
                                                    return agent.department.some(dept => dept.id === deptId);
                                                  }
                                                  return true;
                                                })
                                                .map(agent => ({
                                                  value: agent.id.toString(),
                                                  label: agent.name || "Unknown Agent"
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
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                                          >
                                            {isSubmitting ? "Please wait.. " : "Reassign"}
                                          </button>
                                        </div>
                                      </div>
                                    }
                                  >
                                    <button
                                      className="inline-flex items-center justify-center w-10 h-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 group"
                                      title={selectedTicket.assignee ? "Reassign Ticket" : "Assign Ticket"}
                                    >
                                      <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>

                              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                              <div className="flex items-center space-x-1">
                                {!isUserWatcher && (
                                  <Tooltip
                                    content={
                                      <div className="p-4 bg-white dark:bg-gray-800">
                                        <MultiSelectAgents
                                          label="Select Watchers"
                                          agents={agentsData.filter(agent => agent.id.toString() !== selectedTicket.assignee?.id)}
                                          selectedAgents={selectedWatchers}
                                          onChange={setSelectedWatchers}
                                          placeholder="Choose watchers..."
                                        />
                                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <button
                                            onClick={handleAddWatchers}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                                          >
                                            {isSubmitting ? "Please wait.. " : "Add Watcher"}
                                          </button>
                                        </div>
                                      </div>
                                    }
                                  >
                                    <button
                                      className="inline-flex items-center justify-center w-10 h-10 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group"
                                      title="Add Watchers"
                                    >
                                      <Eye size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                  </Tooltip>
                                )}

                                {!isUserWatcher && (
                                  <Tooltip
                                    content={
                                      <div className="p-4">
                                        <Input
                                          id="tags"
                                          label="Enter Tags (comma separated)"
                                          value={newTagInput}
                                          onChange={(e) => setNewTagInput(e.target.value)}
                                          placeholder="tag1, tag2, tag3"
                                        />
                                        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                                          <button
                                            onClick={handleAddTags}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                                          >
                                            {isSubmitting ? "Please wait.. " : "Save Tags"}
                                          </button>
                                        </div>
                                      </div>
                                    }
                                  >
                                    <button
                                      className="inline-flex items-center justify-center w-10 h-10 text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-all duration-200 group"
                                      title="Manage Tags"
                                    >
                                      <Tag size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Status Stepper */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <DynamicStepper status={selectedTicket.status} assignedTo={selectedTicket.assignee} />
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Creator Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-medium">{selectedTicket.requester.firstName} {selectedTicket.requester.lastName}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            {selectedTicket.requester.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {selectedTicket.requester.phone || 'No phone provided'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            {React.createElement(getSourceIcon(selectedTicket.source), { className: 'w-4 h-4 mr-2 text-gray-500' })}
                            <span
                              onClick={() => {
                                setSelectedSource(selectedTicket.source || 'web');
                                setShowSourceEditModal(true);
                              }}
                              className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Click to edit source"
                            >
                              {getSourceDisplay(selectedTicket.source)}
                              <Edit3 className="w-3 h-3 inline ml-1 opacity-50" />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assignment Details</h3>
                        </div>
                        <div className="space-y-2">
                          {/* Assignee - clickable text */}
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                            {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") ? (
                              <span
                                className="font-medium cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                title="Click to change assignee"
                                onClick={() => setShowAssignModal(true)}
                              >
                                {selectedTicket.assignee ? `${selectedTicket.assignee.firstName} ${selectedTicket.assignee.lastName}` : 'Unassigned'}
                                <Edit3 size={12} className="inline ml-1 opacity-50" />
                              </span>
                            ) : (
                              <span className="font-medium">{selectedTicket.assignee ? `${selectedTicket.assignee.firstName} ${selectedTicket.assignee.lastName}` : 'Unassigned'}</span>
                            )}
                          </div>

                          {/* Department - clickable text */}
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building className="w-4 h-4 mr-2 text-gray-500" />
                            {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") ? (
                              <span
                                className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="Click to change department"
                                onClick={() => setShowDepartmentModal(true)}
                              >
                                {selectedTicket.department?.name || 'No Department'}
                                <Edit3 size={12} className="inline ml-1 opacity-50" />
                              </span>
                            ) : (
                              <span>{selectedTicket.department?.name || 'No Department'}</span>
                            )}
                          </div>

                          {/* Category - clickable text */}
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Tag className="w-4 h-4 mr-2 text-gray-500" />
                            {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") ? (
                              <span
                                className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                title="Click to change category"
                                onClick={() => setShowCategoryModal(true)}
                              >
                                {selectedTicket.category}
                                <Edit3 size={12} className="inline ml-1 opacity-50" />
                              </span>
                            ) : (
                              <span>{selectedTicket.category}</span>
                            )}
                          </div>
                          {/* Linked Tasks */}
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <LinkIcon className="w-4 h-4 mr-2 text-gray-500" />
                            <button
                              onClick={() => { setActiveTab('tasks'); setTaskRefreshTrigger(prev => prev + 1); }}
                              className="flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            >
                              <span>Linked Tasks</span>
                              {linkedTasksCount > 0 && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                  {linkedTasksCount}
                                </span>
                              )}
                            </button>
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
                            Created: {formatDate(selectedTicket.createdAt)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            {(user?.role.toUpperCase() === "ADMIN" || user?.role.toUpperCase() === "AGENT") ? (
                              <span
                                className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                title="Click to change due date"
                                onClick={() => {
                                  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
                                  if (selectedTicket.dueDate) {
                                    const date = new Date(selectedTicket.dueDate);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    setSelectedDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
                                  } else {
                                    setSelectedDueDate('');
                                  }
                                  setShowDueDateModal(true);
                                }}
                              >
                                Due: {selectedTicket.dueDate ? formatDate(selectedTicket.dueDate) : 'N/A'}
                                <Edit3 size={12} className="inline ml-1 opacity-50" />
                              </span>
                            ) : (
                              <span>Due: {selectedTicket.dueDate ? formatDate(selectedTicket.dueDate) : 'N/A'}</span>
                            )}
                          </div>
                          {selectedTicket.resolvedAt && (
                            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolved: {formatDate(selectedTicket.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ticketTags && ticketTags.length > 0 ? (
                            ticketTags.map((tag) => (
                              <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400 italic">No tags assigned</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Watchers</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ticketWatchers && ticketWatchers.length > 0 ? (
                            ticketWatchers.map((watcher) => (
                              <div key={watcher.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700">
                                {watcher.avatar_url ? (
                                  <img src={watcher.avatar_url} alt={watcher.name} className="w-4 h-4 rounded-full mr-2" />
                                ) : (
                                  <User className="w-3 h-3 mr-2" />
                                )}
                                {watcher.name}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400 italic">No watchers assigned</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                      </div>
                      <div className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&>p]:text-[13px] [&>p]:leading-relaxed [&>ul]:text-[13px] [&>ol]:text-[13px] [&>li]:text-[13px]"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.description || '<span class="text-gray-500 dark:text-gray-400 italic">No description provided</span>' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      <button onClick={() => setActiveTab('activity')} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'activity' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        <List className="w-4 h-4" />
                        <span>Activity Stream</span>
                      </button>
                      <button onClick={() => setActiveTab('attachments')} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'attachments' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        <Paperclip className="w-4 h-4" />
                        <span>Attachments</span>
                      </button>
                      <button onClick={() => { setActiveTab('tasks'); setTaskRefreshTrigger(prev => prev + 1); }} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'tasks' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        <CheckSquare className="w-4 h-4" />
                        <span>Tasks</span>
                        {linkedTasksCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                            {linkedTasksCount}
                          </span>
                        )}
                      </button>
                      {allowSLA && (
                        <button onClick={() => setActiveTab('sla')} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'sla' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                          <List className="w-4 h-4" />
                          <span>SLAs</span>
                        </button>
                      )}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'activity' && (
                      <TicketActivityStream
                        ticketId={Number.parseInt(selectedTicket.id)}
                        reloader={reloader}
                        isCustomerView={false}
                      />
                    )}
                    {activeTab === 'attachments' && (
                      <TicketAttachments ticketId={Number.parseInt(selectedTicket.id)} />
                    )}
                    {activeTab === 'tasks' && (
                      <TicketTasks ticketId={Number.parseInt(selectedTicket.id)} onTaskCountChange={setLinkedTasksCount} refreshTrigger={taskRefreshTrigger} />
                    )}
                    {activeTab === 'sla' && allowSLA && (
                      <SlaInfo ticketId={Number.parseInt(selectedTicket.id)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'detailed' && showDetailPanel ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No ticket selected" message="Please select a ticket to view its details." />
            </div>
          ) : null}
        </div>
      </div>


      {/* Create ticket */}
      <Modal
        size='4xl'
        isOpen={createTicket}
        onClose={handleCloseCreateTicketModal}
        title="New Ticket"
        closeOnBackdropClick={false}
      >
        {
          createTicket && <CreateTicketModal
            reload={() => fetchTickets(currentPage, activeView)}
            onclose={handleCloseCreateTicketModal}
            onSuccess={confirmCloseCreateTicketModal}
            onDirtyChange={setIsCreateTicketModalDirty}
          />
        }

      </Modal>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        show={showCreateTicketCloseConfirm}
        cancel={() => setShowCreateTicketCloseConfirm(false)}
        onConfirm={confirmCloseCreateTicketModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        variant="warning"
        confirmText="Close Anyway"
        cancelText="Keep Editing"
      />

      <ReopenTicketModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        onSubmit={handleReopen}
        isSubmitting={isSubmitting}
      />

      {selectedTicket && (
        <UpdateStatusModal
          ticketId={selectedTicket.id}
          currentStatus={selectedTicket.status}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onStatusUpdated={() => {
            fetchTickets(currentPage, activeView);
            fetchTicketDetails(selectedTicket.id);
          }}
        />
      )}

      {selectedTicket && (
        <UpdatePriorityModal
          ticketId={selectedTicket.id}
          currentPriority={selectedTicket.priority}
          isOpen={showPriorityModal}
          onClose={() => setShowPriorityModal(false)}
          onPriorityUpdated={() => fetchTickets(currentPage, activeView)}
        />
      )}

      <TaskListDialog
        ticketId={taskDialogTicketId}
        isOpen={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
      />
      <ReopenTicketModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        onSubmit={handleReopen}
        isSubmitting={isSubmitting}
      />

      {/* Edit Ticket Source Modal */}
      <Modal
        isOpen={showSourceEditModal}
        onClose={() => setShowSourceEditModal(false)}
        title="Edit Ticket Source"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="source-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Ticket Source
            </label>
            <select
              id="source-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {SOURCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSourceEditModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSource}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update Source'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Agent Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Agent"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            id="assign-agent-modal"
            label="Select Agent"
            value={selectedAgentId}
            onChange={setSelectedAgentId}
            options={[
              { value: "", label: "Choose agent...", disabled: true },
              ...(agents && agents.length > 0
                ? agents
                  .filter(agent => {
                    if (selectedTicket?.assignee && agent.id.toString() === selectedTicket.assignee.id) return false;
                    if (selectedTicket?.department && agent.department && agent.department.length > 0) {
                      const deptId = typeof selectedTicket.department === 'number' ? selectedTicket.department : selectedTicket.department.id;
                      return agent.department.some(dept => dept.id === deptId);
                    }
                    return true;
                  })
                  .map(agent => ({ value: agent.id.toString(), label: agent.name || "Unknown Agent" }))
                : [{ value: "", label: "No agents found", disabled: true }]
              )
            ]}
            placeholder="Choose agent..."
            size="md"
            required
            allowSearch
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { handleAssign(); setShowAssignModal(false); }}
              disabled={isSubmitting || !selectedAgentId}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Department Modal */}
      <Modal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title="Update Department"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="dept-select-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Department
            </label>
            <select
              id="dept-select-modal"
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select a Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDepartmentModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { handleUpdateDepartment(); setShowDepartmentModal(false); }}
              disabled={isSubmitting || !selectedDepartmentId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Due Date Modal */}
      <Modal
        isOpen={showDueDateModal}
        onClose={() => setShowDueDateModal(false)}
        title="Update Due Date"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="due-date-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Due Date
            </label>
            <input
              id="due-date-input"
              type="datetime-local"
              value={selectedDueDate}
              onChange={(e) => setSelectedDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDueDateModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateDueDate}
              disabled={isSubmitting || !selectedDueDate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Update Category"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="category-select-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Category
            </label>
            <select
              id="category-select-modal"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Select a Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { handleUpdateCategory(); setShowCategoryModal(false); }}
              disabled={isSubmitting || !selectedCategoryId}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Ticket Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Ticket"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete ticket <strong>#{selectedTicket?.ticket_id}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone. The ticket will be moved to trash.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSingleTicketDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
