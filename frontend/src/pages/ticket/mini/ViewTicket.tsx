import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Tag,
  FileText,
  CheckCircle,
  Building,
  UserCheck,
  MessageSquare,
  Paperclip,
  CheckSquare,
  ArrowLeft,
  List,
  LinkIcon,
  Eye,
  Share2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Copy,
  Edit3,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { errorNotification, successNotification } from '../../../components/ui/Toast';
import LoadingSkeleton from '../../../components/ui/Skeleton';
import UpdateTicketStatus from './TicketUpdateStatus';
import { ReopenTicketModal } from './ReopenTicketModal';
import { Agent, TicketData } from '../../../types';
import { formatRelativeTime } from '../../../utils/helper';
import { getSourceLabel, getSourceIcon as getSourceIconHelper, getStatusColor, getPriorityColor, formatDate } from '../../../utils/displayHelpers';
import { useParams } from 'react-router-dom';
import Select from '../../../components/ui/Select';
import MultiSelectAgents from '../../../components/ui/MultiSelectAgents';
import TicketAttachments from './TicketAttachments';
import TicketTasks from './TicketTasks';
import { TicketActivityStream } from './TicketActivityStream';
import SlaInfo from './SlaInfo';
import { Tooltip } from '../../../components/ui/Tool';
import { Input } from '../../../components/ui/Input';
import { useFetchAgents } from '../../../services/agents';
import { AgentType, ApiResponse } from '../../../types/agents';
import { DynamicStepper } from '../../../components/ui/Stepper';
import { Modal } from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface Watcher {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AssignTicketPayload {
  ticket_id: string;
  agent_id: number | null;
}

interface AddWatchersPayload {
  watchers: number[];
}

const TicketInfo: React.FC = () => {
  const { user } = useAuthStore();
  const { ticketId } = useParams();

  const [reloader, setReloader] = useState<number>(0)

  // const [showAssign, setShowAssign ] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [showSourceEditModal, setShowSourceEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  // const [updateStatus, setUpdateStatus] = useState(false)

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState(ticketData?.ticket?.status || "");
  const [ticketTags, setTicketTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const [statusDescription, setStatusDescription] = useState("")
  // comment and isInternal state removed from this view; handled in comment component
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("")
  const [activeTab, setActiveTab] = useState('activity');
  const [selectedWatchers, setSelectedWatchers] = useState<number[]>([]);
  const [ticketWatchers, setTicketWatchers] = useState<Watcher[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [linkedTasksCount, setLinkedTasksCount] = useState(0);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSearch, setMergeSearch] = useState('');
  const [mergeResults, setMergeResults] = useState<Array<{ id: number; ticket_id: string; title: string; is_merged?: boolean }>>([]);
  const [mergeSelectedIds, setMergeSelectedIds] = useState<number[]>([]);
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const { data: agentResponse = [] } = useFetchAgents();

  const agentsData: AgentType[] = (agentResponse as ApiResponse)?.results || [];

  const isUserWatcher = ticketWatchers.some(watcher => watcher.id === user?.user_id);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const response = await http.get(`${APIS.LOAD_TICKET_INFO}/${ticketId}`);
      setTicketData(response.data);
      // Set linked tasks count from ticket data
      if (response.data?.ticket?.linked_tasks_count !== undefined) {
        setLinkedTasksCount(response.data.ticket.linked_tasks_count);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      errorNotification(errorMessage);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  }, [ticketId]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await http.get(`${APIS.LIST_AGENTS}?pagination=no`);
      setAgents(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      errorNotification(errorMessage);
    }
  }, []);

  const assignAgentOptions = React.useMemo(() => {
    const base = [{ value: "", label: "Choose agent...", disabled: true }];
    if (!agents || agents.length === 0) return base;
    return [
      ...base,
      ...agents
        .filter(agent => {
          if (ticketData?.ticket?.assigned_to && agent.id === ticketData.ticket.assigned_to.id) return false;
          if (ticketData?.ticket?.department && agent.department && agent.department.length > 0) {
            const deptId = typeof ticketData.ticket.department === 'number' ? ticketData.ticket.department : ticketData.ticket.department.id;
            return agent.department.some(dept => dept.id === deptId);
          }
          return true;
        })
        .map(agent => ({ value: agent.id.toString(), label: agent.name || "Unknown Agent" }))
    ];
  }, [agents, ticketData]);


  const fetchCategories = useCallback(async () => {
    try {
      const response = await http.get(APIS.LIST_TICKET_CATEGORIES + '?pagination=no');
      setCategories(response.data || response.data.results || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories";
      console.error(errorMessage);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await http.get(APIS.LIST_DEPARTMENTS);
      setDepartments(response.data.results || response.data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch departments";
      console.error(errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchAgents()
    fetchDepartments()
    fetchCategories()
  }, [fetchAgents, fetchDepartments, fetchCategories])

  // moved fetchCategories and handle methods to top-level scope




  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  useEffect(() => {
    if (ticketData) {
      setSelectedStatus(ticketData.ticket.status);
      setStatusDescription(""); // Reset description when status changes
    }
  }, [ticketData]);

  useEffect(() => {
    if (ticketData?.ticket?.id) {
      fetchWatchers(ticketData.ticket.id);
      fetchTags(ticketData.ticket.id);
    }
  }, [ticketData?.ticket?.id]);

  const fetchTags = async (currentTicketId: number) => {
    try {
      const response = await http.get(`${APIS.LIST_TAGS}/${currentTicketId}`);
      setTicketTags(response.data.tags || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load tags";
      errorNotification(errorMessage);
    }
  };

  const fetchWatchers = async (currentTicketId: number) => {
    try {
      const response = await http.get(`${APIS.LIST_WATCHERS}/${currentTicketId}`);
      setTicketWatchers(response.data);
      // Removed: setSelectedWatchers(...) - this was preventing proper state management
      // selectedWatchers should only be set when user manually selects from dropdown
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load watchers";
      errorNotification(errorMessage);
    }
  };

  const handleMergeSearch = useCallback(async () => {
    if (!mergeSearch || mergeSearch.trim().length < 2) {
      setMergeResults([]);
      return;
    }
    try {
      const url = user?.role === 'admin' ? APIS.LIST_TICKETS : APIS.MY_TICKETS;
      const resp = await http.get(url, {
        params: {
          pagination: 'no',
          search: mergeSearch,
          view: 'all_tickets',
        }
      });
      const results = Array.isArray(resp.data?.results) ? resp.data.results : resp.data;
      const normalized = (results || []).map((t: any) => ({
        id: t.id,
        ticket_id: t.ticket_id,
        title: t.title,
        is_merged: t.is_merged,
      })).filter((t: any) => t.id !== ticketData?.ticket?.id && !t.is_merged);
      setMergeResults(normalized);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search tickets";
      errorNotification(errorMessage);
    }
  }, [mergeSearch, ticketData?.ticket?.id, user?.role]);

  const toggleMergeSelection = (id: number) => {
    setMergeSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMerge = async () => {
    if (!ticketData?.ticket?.id) return;
    if (mergeSelectedIds.length === 0) {
      errorNotification('Select at least one ticket to merge');
      return;
    }
    setIsMerging(true);
    try {
      await http.post(`${APIS.TICKET_BASE}/${ticketData.ticket.id}/merge/`, {
        source_ids: mergeSelectedIds,
        note: mergeNote,
      });
      successNotification('Tickets merged successfully');
      setIsMergeModalOpen(false);
      setMergeSelectedIds([]);
      setMergeNote('');
      setMergeResults([]);
      // Refresh current ticket view
      fetchTicket();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to merge tickets');
      errorNotification(errorMessage);
    } finally {
      setIsMerging(false);
    }
  };

  useEffect(() => {
    if (isMergeModalOpen) {
      handleMergeSearch();
    }
  }, [mergeSearch, isMergeModalOpen, handleMergeSearch]);


  const getAgentId = () => {
    if (selectedAgentId === "unassign") {
      return null;
    }
    if (selectedAgentId) {
      return Number(selectedAgentId);
    }
    return null;
  };

  const getButtonLabel = () => {
    if (isSubmitting) {
      return "Please wait..";
    }
    if (selectedAgentId === "unassign") {
      return "Unassign";
    }
    return "Reassign";
  };

  // Helper function to handle API errors and show appropriate UI
  const handleApiError = (error: unknown) => {
    const axiosLike = error as { response?: { data?: { message?: string } }; message?: string };
    const apiMessage = axiosLike?.response?.data?.message;

    if (apiMessage) {
      // Show error dialog for status change errors (including incomplete tasks)
      if (apiMessage.toLowerCase().includes('closed') || apiMessage.toLowerCase().includes('resolved') || apiMessage.toLowerCase().includes('cannot close') || apiMessage.toLowerCase().includes('incomplete task')) {
        setErrorDialogMessage(apiMessage);
        setErrorDialogOpen(true);
        return;
      }
      // For other API errors, show the message directly
      errorNotification(apiMessage);
      return;
    }

    // Fallback for non-API errors
    const errorMessage = axiosLike?.message || "An error occurred";
    errorNotification(errorMessage);
  };

  const isTicketClosed = ticketData?.ticket?.status === 'closed';

  const handleReopen = async (reason: string) => {
    if (!ticketData?.ticket?.id) return;
    try {
      setIsSubmitting(true);
      const response = await http.post(`${APIS.TICKET_BASE}/${ticketData.ticket.id}/reopen/`, { reason });

      // Refresh ticket details from server
      fetchTicket();

      successNotification(response.data.message);
      setIsReopenModalOpen(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to reopen ticket";
      errorNotification(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Using shared utility functions from displayHelpers
  const getSourceDisplay = (source?: string) => getSourceLabel(source);
  const getSourceIcon = (source?: string) => getSourceIconHelper(source);



  if (loading) {
    return (<LoadingSkeleton />)
  }

  if (!ticketData) {
    return (
      <LoadingSkeleton />
    );
  }

  const { ticket } = ticketData;

  async function handleStatusUpdate() {
    try {
      setIsSubmitting(true)

      const response = await http.put(`${APIS.TICKET_UPDATE_STATUS}/${ticket.id.toString()}`, {
        status: selectedStatus,
        notes: statusDescription

      });
      await fetchTicket()
      successNotification(response.data.message)

    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignToMe = async () => {
    setIsAssigning(true);
    try {
      const response = await http.get(`${APIS.TICKET_ASSIGN_TO_ME}${ticket.id}`);
      successNotification(response.data.message);
      fetchTicket();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign ticket';
      errorNotification(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  async function handleAssign() {
    try {
      setIsSubmitting(true)

      const agentId = getAgentId();
      const payload: AssignTicketPayload = {
        ticket_id: ticket.id.toString(),
        agent_id: agentId
      };
      const response = await http.post(`${APIS.TICKET_ASSIGN}`, payload);
      await fetchTicket()
      successNotification(response.data.message)

    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false)
    }
  } async function handleUpdateDepartment() {
    try {
      setIsSubmitting(true)
      const payload = {
        department_id: Number(selectedDepartmentId)
      };
      const response = await http.put(`${APIS.TICKET_UPDATE_DEPARTMENT}/${ticket.id}`, payload);
      successNotification(response.data.message || 'Department updated successfully')
      await fetchTicket()
      setSelectedDepartmentId("");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateCategory() {
    if (!ticketData?.ticket?.id) return;
    try {
      setIsSubmitting(true)
      const payload = { category_id: Number(selectedCategoryId) }
      const response = await http.put(`${APIS.TICKET_UPDATE_CATEGORY}/${ticketData.ticket.id}`, payload);
      successNotification(response.data.message || 'Category updated successfully')
      await fetchTicket()
      setReloader(prev => prev + 1);
      setSelectedCategoryId("")
    } catch (error) {
      handleApiError(error)
    } finally { setIsSubmitting(false) }
  }

  async function handleUpdatePriority() {
    if (!ticketData?.ticket?.id) return;
    try {
      setIsSubmitting(true)
      const payload = { priority: selectedPriority }
      const response = await http.put(`${APIS.TICKET_UPDATE_PRIORITY}/${ticketData.ticket.id}`, payload);
      successNotification(response.data.message || 'Priority updated successfully')
      await fetchTicket()
      setReloader(prev => prev + 1);
      setSelectedPriority("")
    } catch (error) {
      handleApiError(error)
    } finally { setIsSubmitting(false) }
  }

  async function handleUpdateSource() {
    try {
      setIsSubmitting(true)
      const response = await http.patch(`${APIS.TICKET_DETAILS}${ticket.id}/`, {
        source: selectedSource
      });
      successNotification(response.data.message || 'Ticket source updated successfully')
      await fetchTicket()
      setShowSourceEditModal(false)
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false)
    }
  }

  // comment handling moved into component that uses it when needed

  async function handleAddWatchers() {
    try {
      setIsSubmitting(true);
      const payload: AddWatchersPayload = {
        watchers: selectedWatchers,
      };
      const response = await http.put(`${APIS.ADD_WATCHERS}/${ticket.id.toString()}`, payload);
      await fetchTicket();
      successNotification(response.data.message);
      setSelectedWatchers([]);
      setReloader(prev => prev + 1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTags() {
    try {
      setIsSubmitting(true);
      const tagsArray = newTagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const payload = {
        tags: tagsArray,
      };
      const response = await http.put(`${APIS.ADD_TAGS}/${ticket.id.toString()}`, payload);
      await fetchTicket();
      fetchTags(ticket.id);
      successNotification(response.data.message);
      setNewTagInput("");
      setReloader(prev => prev + 1);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/helpcenter/tk/${ticket.ticket_id}`;
    navigator.clipboard.writeText(url);
    successNotification('Public ticket link copied to clipboard');
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => globalThis.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.ticket_id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              More info about ticket
            </p>
          </div>
        </div>
      </div>


      {/* Header and Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                {ticket.title}
              </h1>
              <div className="flex items-center space-x-4 mb-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {ticket.ticket_id}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Created {formatRelativeTime(ticket.created_at)}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                  {ticket.status.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority.toUpperCase()}
                </span>
                {ticket.breached && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                    SLA BREACHED
                  </span>
                )}
                {ticket.is_overdue && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700">
                    OVERDUE
                  </span>
                )}
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
                  {!ticket.assigned_to && (
                    <button
                      onClick={handleAssignToMe}
                      disabled={isAssigning}
                      className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isAssigning ? 'Assigning...' : 'Assign to me'}
                    </button>
                  )}
                </>
              )}

              {/* Action Button Groups - Hide when ticket is closed */}
              {!isTicketClosed && (
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                  {/* Primary Actions */}
                  <div className="flex items-center space-x-1">
                    <a
                      title="Customer Portal"
                    >
                      <LinkIcon size={18} className="group-hover:scale-110 transition-transform" />
                    </a>

                    <button
                      onClick={handleShare}
                      className="inline-flex items-center justify-center w-10 h-10 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group"
                      title="Copy Public Link"
                    >
                      <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {!isUserWatcher && (
                      <Tooltip
                        key={`status-tooltip-${ticket.status}`}
                        content={
                          <UpdateTicketStatus
                            handleStatusUpdate={handleStatusUpdate}
                            isSubmitting={isSubmitting}
                            selectedOption={selectedStatus}
                            setSelectedOption={setSelectedStatus}
                            statusDescription={statusDescription}
                            setStatusDescription={setStatusDescription}
                            currentStatus={ticket.status}
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
                                ...(ticket.assigned_to ? [{ value: "unassign", label: "🚫 Unassign Ticket" }] : []),
                                ...(agents && agents.length > 0
                                  ? agents
                                    .filter(agent => {
                                      // Exclude currently assigned agent
                                      if (ticket.assigned_to?.id === agent.id) return false;
                                      // Only show agents from the ticket's department
                                      if (ticket.department && agent.department && agent.department.length > 0) {
                                        const deptId = typeof ticket.department === 'number' ? ticket.department : ticket.department.id;
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
                                {getButtonLabel()}
                              </button>
                            </div>
                          </div>
                        }
                      >
                        <button
                          className="inline-flex items-center justify-center w-10 h-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 group"
                          title={ticket.assigned_to ? "Reassign Ticket" : "Assign Ticket"}
                        >
                          <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  {/* Department Action - Change Department (Tooltip Pattern) */}

                  {/* Category Action - Change Category (Tooltip Pattern) */}
                  <Tooltip
                    content={
                      <div className="p-4">
                        <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Category
                        </label>
                        <select
                          id="category-select"
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-4"
                        >
                          <option value="">Select a Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => setSelectedCategoryId("")}
                            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateCategory}
                            disabled={isSubmitting || !selectedCategoryId}
                            className="px-3 py-1 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmitting ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <button
                      className="inline-flex items-center justify-center w-10 h-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200 group"
                      title="Change Category"
                    >
                      <Tag size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </Tooltip>

                  {/* Priority Action - Change Priority (Tooltip Pattern) */}
                  <Tooltip
                    content={
                      <div className="p-4">
                        <label htmlFor="priority-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Priority</label>
                        <select
                          id="priority-select"
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
                    <button
                      className="inline-flex items-center justify-center w-10 h-10 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 group"
                      title="Change Priority"
                    >
                      <List size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </Tooltip>
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

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                  {/* Secondary Actions */}
                  <div className="flex items-center space-x-1">
                    {!isUserWatcher && (
                      <Tooltip
                        content={
                          <div className="p-4">
                            <MultiSelectAgents
                              label="Select Watchers"
                              agents={agentsData.filter(agent => agent.id !== ticket.assigned_to?.id)}
                              selectedAgents={selectedWatchers}
                              onChange={setSelectedWatchers}
                              placeholder="Choose watchers..."
                            />
                            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
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
                            <label htmlFor="source-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Change Ticket Source
                            </label>
                            <select
                              value={selectedSource || ticket.source || 'web'}
                              onChange={(e) => setSelectedSource(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-4"
                            >
                              <option value="email">Email</option>
                              <option value="web">Web/Portal</option>
                              <option value="phone">Phone</option>
                              <option value="chat">Live Chat</option>
                              <option value="chatbot">AI Chatbot</option>
                              <option value="api">API/Integrations</option>
                              <option value="internal">Internal/Staff-created</option>
                              <option value="customer_portal">Customer Portal</option>
                            </select>
                            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => {
                                  setSelectedSource("");
                                }}
                                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleUpdateSource}
                                disabled={isSubmitting || !selectedSource}
                                className="px-3 py-1 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSubmitting ? 'Updating...' : 'Update'}
                              </button>
                            </div>
                          </div>
                        }
                      >
                        <button
                          className="inline-flex items-center justify-center w-10 h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                          title="Change Ticket Source"
                        >
                          {React.createElement(getSourceIcon(ticket.source), {
                            size: 18,
                            className: "group-hover:scale-110 transition-transform",
                          })}
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

                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                  {/* Utility Actions */}
                  <div className="flex items-center space-x-1">
                    {!ticket.is_merged && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsMergeModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <LinkIcon size={16} />
                        Merge
                      </Button>
                    )}

                    <button
                      className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                      title="View History"
                    >
                      <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <Tooltip
                      content={
                        <div className="p-4">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="share-link"
                              label="Shareable Link"
                              value={globalThis.location.href}
                              readOnly
                              className="flex-1"
                            />
                            <button
                              onClick={() => { navigator.clipboard.writeText(globalThis.location.href); successNotification("Link copied!"); }}
                              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              title="Copy Link"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <button
                        className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                        title="Share Ticket"
                      >
                        <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </Tooltip>

                    <button
                      className="inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                      title="More Actions"
                    >
                      <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Status Stepper */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <DynamicStepper
            status={ticket.status}
            assignedTo={ticket.assigned_to}
            onStatusChange={async (newStatus) => {
              try {
                setIsSubmitting(true);
                await http.put(`${APIS.TICKET_UPDATE_STATUS}/${ticket.id.toString()}`, {
                  status: newStatus,
                  notes: ''
                });
                await fetchTicket();
                successNotification(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
              } catch (error) {
                handleApiError(error);
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Creator and Ticket Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Creator Info Card */}
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
                  <span className="font-medium">{ticket.creator_name}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  {ticket.creator_email}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  {ticket.creator_phone}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  {React.createElement(getSourceIcon(ticket.source), { className: 'w-4 h-4 mr-2 text-gray-500' })}
                  <span
                    className="font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Click to edit source"
                    onClick={() => {
                      setSelectedSource(ticket.source || 'web');
                      setShowSourceEditModal(true);
                    }}
                  >
                    {getSourceDisplay(ticket.source)}
                    <Edit3 className="w-3 h-3 inline ml-1 opacity-50" />
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Info Card */}
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
                      {ticket.assigned_to ? ticket.assigned_to.name : 'Unassigned'}
                      <Edit3 size={12} className="inline ml-1 opacity-50" />
                    </span>
                  ) : (
                    <span className="font-medium">{ticket.assigned_to ? ticket.assigned_to.name : 'Unassigned'}</span>
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
                      {ticket.department?.name ?? 'No department assigned'}
                      <Edit3 size={12} className="inline ml-1 opacity-50" />
                    </span>
                  ) : (
                    <span>{ticket.department?.name ?? 'No department assigned'}</span>
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
                      {ticket.category?.name ?? 'No category'}
                      <Edit3 size={12} className="inline ml-1 opacity-50" />
                    </span>
                  ) : (
                    <span>{ticket.category?.name ?? 'No category'}</span>
                  )}
                </div>
                {/* Linked Tasks Row */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckSquare className="w-4 h-4 mr-2 text-gray-500" />
                  <button
                    onClick={() => { setActiveTab('tasks'); setTaskRefreshTrigger(prev => prev + 1); }}
                    className="flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <span>Linked Tasks</span>
                    {linkedTasksCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                        {linkedTasksCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Info Card */}
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
                  Created: {formatDate(ticket.created_at)}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  Due: {formatDate(ticket.due_date)}
                </div>
                {ticket.resolved_at && (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolved: {formatDate(ticket.resolved_at)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags and Watchers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tags Section */}
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

            {/* Watchers Section */}
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

          {/* Description Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</h3>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert  overflow-y-auto">
              {ticket.description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                  className="[&_*]:!text-gray-800 dark:[&_*]:!text-gray-200"
                />
              ) : (
                <span className="text-gray-500 dark:text-gray-400 italic">No description provided</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'activity'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <List className="w-4 h-4" />
              <span>Activity Stream</span>
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); setTaskRefreshTrigger(prev => prev + 1); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'tasks'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
              {linkedTasksCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                  {linkedTasksCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sla')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'sla'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <List className="w-4 h-4" />
              <span>SLAs</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'activity' && (
            <TicketActivityStream
              ticketId={ticket.id}
              ticket={{
                id: ticket.id,
                creator_email: ticket.creator_email,
                creator_name: ticket.creator_name,
                source: ticket.source as 'email' | 'portal' | 'api' | 'phone' | 'chat' | 'web',
              }}
              reloader={reloader}
              isCustomerView={false}
              onStatusChange={() => setReloader(reloader + 1)}
            />
          )}

          {activeTab === 'emails' && (
            <div className="space-y-4">
              {(ticketData?.email_messages || []).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No email messages recorded.</p>
              )}
              {(ticketData?.email_messages || []).map((msg) => (
                <div
                  key={msg.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{msg.sender}</span>{' '}
                        → <span className="text-gray-800 dark:text-gray-100">{msg.recipient}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {msg.subject || 'No subject'} · {formatRelativeTime(msg.received_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 max-w-none">
                    {msg.html_body_sanitized && msg.html_body_sanitized.trim() ? (
                      <div className="relative">
                        <iframe
                          srcDoc={msg.html_body_sanitized}
                          sandbox="allow-same-origin"
                          className="w-full border-none rounded bg-white dark:bg-gray-800"
                          style={{
                            minHeight: '250px',
                            maxHeight: '800px',
                          }}
                          onLoad={(e) => {
                            // Auto-resize iframe to content height
                            const iframe = e.target as HTMLIFrameElement;
                            try {
                              const height = iframe.contentWindow?.document.body.scrollHeight;
                              if (height) {
                                // Set height with min/max constraints
                                const finalHeight = Math.min(Math.max(height + 30, 250), 800);
                                iframe.style.height = `${finalHeight}px`;
                              }
                            } catch (err) {
                              // Fallback if can't access iframe content
                              iframe.style.height = '400px';
                            }
                          }}
                          title={`Email content from ${msg.sender}`}
                        />
                      </div>
                    ) : msg.raw_body && msg.raw_body.trim() ? (
                      <pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                        {msg.raw_body}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No email content available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'attachments' && (
            <TicketAttachments ticketId={ticket.id} />
          )}

          {activeTab === 'tasks' && (
            <TicketTasks ticketId={ticket.id} onTaskCountChange={setLinkedTasksCount} refreshTrigger={taskRefreshTrigger} />
          )}
          {activeTab === 'sla' && (
            <SlaInfo ticketId={ticket.id} />
          )}
        </div>
      </div>

      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title="Merge tickets"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Select tickets to merge into <span className="font-semibold">#{ticketData?.ticket?.ticket_id}</span>. Merged tickets will be closed and linked to this one.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                id="merge-search"
                label="Find tickets (title or ID)"
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                placeholder="Search by ticket title or ID"
              />
            </div>
            <Button variant="secondary" onClick={handleMergeSearch}>
              Search
            </Button>
          </div>

          {mergeResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
              {mergeResults.map((t) => (
                <label
                  key={t.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={mergeSelectedIds.includes(t.id)}
                    onChange={() => toggleMergeSelection(t.id)}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      #{t.ticket_id} • {t.title}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {mergeSearch.trim().length < 2 ? 'Enter at least 2 characters to search.' : 'No tickets found or all results are already merged.'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Merge note (optional)
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 text-sm"
              rows={3}
              value={mergeNote}
              onChange={(e) => setMergeNote(e.target.value)}
              placeholder="Add context for this merge"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsMergeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleMerge} disabled={isMerging}>
              {isMerging ? 'Merging…' : 'Merge selected'}
            </Button>
          </div>
        </div>
      </Modal>

      <ReopenTicketModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        onSubmit={handleReopen}
        isSubmitting={isSubmitting}
      />

      {/* Error Dialog for Closed/Resolved Tickets */}
      <Modal
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        title={errorDialogMessage.toLowerCase().includes('incomplete task') ? "Cannot Close Ticket" : "Action Not Allowed"}
        size="sm"
      >
        <div className="space-y-4">
          {errorDialogMessage.toLowerCase().includes('incomplete task') ? (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Incomplete Tasks Detected</h3>
                    <p className="text-amber-800 dark:text-amber-300 text-sm">{errorDialogMessage}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Please complete or cancel all linked tasks before closing this ticket.
              </p>
            </>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">{errorDialogMessage}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setErrorDialogOpen(false)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Ticket Source Modal */}
      <Modal
        isOpen={showSourceEditModal}
        onClose={() => setShowSourceEditModal(false)}
        title="Edit Ticket Source"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="share-link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Ticket Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="email">Email</option>
              <option value="web">Web/Portal</option>
              <option value="phone">Phone</option>
              <option value="chat">Live Chat</option>
              <option value="chatbot">AI Chatbot</option>
              <option value="api">API/Integrations</option>
              <option value="internal">Internal/Staff-created</option>
              <option value="customer_portal">Customer Portal</option>
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
            options={assignAgentOptions}
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
    </div>
  );
};

export default TicketInfo;
