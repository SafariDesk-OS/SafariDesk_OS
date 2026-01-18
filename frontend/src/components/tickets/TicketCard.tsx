import React, { useState } from 'react';
import {
  MoreVertical,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  Clock,
  UserPlus,
  Tag,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { Ticket } from '../../types';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownItem } from '../ui/Dropdown';
import AddNoteModal from './AddNoteModal';
import AssignTicketModal from './AssignTicketModal';
import UpdateStatusModal from './UpdateStatusModal';
import AddTagModal from './AddTagModal';
import UpdatePriorityModal from './UpdatePriorityModal';
import UpdateCategoryModal from './UpdateCategoryModal';
import { TaskListDialog } from './TaskListDialog';
import { NewBadge } from '../ui/NewBadge';

interface TicketCardProps {
  ticket: Ticket;
  openDropdownId?: string | null;
  onDropdownToggle?: (taskId: string) => void;
  onDropdownClose?: () => void;
  onAction?: (action: string, ticket: Ticket) => void;
  onTicketUpdate?: (updatedTicket: Ticket) => void;
  isSelected?: boolean;
  onSelectionChange?: (ticketId: string, selected: boolean) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  openDropdownId,
  onDropdownToggle,
  onDropdownClose,
  onAction,
  onTicketUpdate,
  isSelected = false,
  onSelectionChange
}) => {
  const navigate = useNavigate();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [isUpdatePriorityModalOpen, setIsUpdatePriorityModalOpen] = useState(false);
  const [isUpdateCategoryModalOpen, setIsUpdateCategoryModalOpen] = useState(false);
  const [isTaskListDialogOpen, setIsTaskListDialogOpen] = useState(false);

  // Priority configuration with modern icons and colors
  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-800',
        label: 'Critical'
      },
      high: {
        icon: AlertCircle,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-800',
        label: 'High'
      },
      medium: {
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        label: 'Medium'
      },
      normal: {
        icon: Clock,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Normal'
      },
      low: {
        icon: Clock,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-100 dark:bg-gray-700',
        border: 'border-gray-200 dark:border-gray-600',
        label: 'Low'
      }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  // Status configuration with modern icons and colors
  const getStatusConfig = (status: string) => {
    const configs = {
      open: {
        icon: Play,
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        dot: 'bg-blue-500 dark:bg-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Open'
      },
      in_progress: {
        icon: Clock,
        color: 'text-yellow-700 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/30',
        dot: 'bg-yellow-500 dark:bg-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        label: 'In Progress'
      },
      closed: {
        icon: CheckCircle,
        color: 'text-green-700 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/30',
        dot: 'bg-green-500 dark:bg-green-400',
        border: 'border-green-200 dark:border-green-800',
        label: 'Closed'
      },
      hold: {
        icon: Pause,
        color: 'text-purple-700 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        dot: 'bg-purple-500 dark:bg-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        label: 'On Hold'
      }
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const priorityConfig = getPriorityConfig(ticket.priority || 'medium');
  const statusConfig = getStatusConfig(ticket.status || 'open');
  const PriorityIcon = priorityConfig.icon;

  const isDropdownOpen = openDropdownId === ticket.id;

  const handleCardClick = () => {
    navigate(`/ticket/${ticket.ticket_id}`);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDropdownToggle) {
      onDropdownToggle(ticket.id);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'add-note') {
      setIsAddNoteModalOpen(true);
    } else if (action === 'assign') {
      setIsAssignModalOpen(true);
    } else if (action === 'update-status') {
      setIsUpdateStatusModalOpen(true);
    } else if (action === 'add-tag') {
      setIsAddTagModalOpen(true);
    } else if (onAction) {
      onAction(action, ticket);
    }
    if (onDropdownClose) {
      onDropdownClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCardClick();
    }
  };

  // Safe date formatting without date-fns
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Helper to get assignee display name
  const getAssigneeDisplay = () => {
    if (ticket.assignee) {
      return `${ticket.assignee.firstName} ${ticket.assignee.lastName}`;
    }
    return 'Unassigned';
  };

  return (
    <div
      className={`h-full flex flex-col relative border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md dark:shadow-lg transition-all duration-200 group mb-3 p-4 ${ticket.breached ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'
        }`}
    >
      {/* Header Section: Checkbox, Priority, Ticket ID, Title, Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Selection Checkbox */}
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectionChange?.(ticket.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              aria-label={`Select ticket ${ticket.ticket_id}`}
            />
          </div>

          {/* Priority Indicator */}
          <div className="flex-shrink-0">
            <div
              className={`p-1.5 rounded-md ${priorityConfig.bg} ${priorityConfig.border} border`}
              title={`Priority: ${priorityConfig.label}`}
            >
              <PriorityIcon size={12} className={priorityConfig.color} />
            </div>
          </div>

          {/* Ticket ID and Title */}
          <div className="flex-1 min-w-0">
            <button
              className="text-left w-full"
              onClick={handleCardClick}
              onKeyDown={handleKeyPress}
            >
              <div className="flex items-center gap-1">
                <span className="text-blue-600 font-semibold text-sm hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors">
                  #{ticket.ticket_id}
                </span>
                {ticket.breached && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Breached
                  </span>
                )}
                {ticket.is_merged && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    Merged{ticket.merged_into?.ticket_id ? ` → ${ticket.merged_into.ticket_id}` : ''}
                  </span>
                )}
              </div>
              <div className={`text-gray-900 dark:text-gray-100 text-sm truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-0.5 flex items-center gap-2 ${!ticket.is_opened ? 'font-bold' : 'font-medium'}`}>
                {ticket.title}
                {ticket.has_new_reply && <NewBadge />}
              </div>
            </button>
          </div>
        </div>

        {/* Actions Menu */}
        {onDropdownToggle && onDropdownClose && (
          <div className="relative flex-shrink-0">
            <button
              onClick={handleDropdownToggle}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Ticket actions"
            >
              <MoreVertical size={14} className="text-gray-400 dark:text-gray-500" />
            </button>

            {isDropdownOpen && (
              <DropdownMenu isOpen={isDropdownOpen} onClose={onDropdownClose}>
                <div data-dropdown className="dropdown-menu">
                  <DropdownItem icon={UserPlus} onClick={() => handleAction('assign')}>
                    Assign Ticket
                  </DropdownItem>
                  <DropdownItem icon={Clock} onClick={() => handleAction('update-status')}>
                    Update Status
                  </DropdownItem>
                  <DropdownItem icon={Tag} onClick={() => handleAction('add-tag')}>
                    Add Tag
                  </DropdownItem>
                  <DropdownItem icon={MessageSquare} onClick={() => handleAction('add-note')}>
                    Add Note
                  </DropdownItem>
                  <div className="border-t border-gray-100 my-1"></div>
                  <DropdownItem icon={Trash2} onClick={() => handleAction('delete')} variant="danger">
                    Delete Ticket
                  </DropdownItem>
                </div>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Description (optional) */}
      {ticket.description && (
        <div
          className="text-gray-600 dark:text-gray-400 text-xs mb-3"
          dangerouslySetInnerHTML={{ __html: ticket.description }}
        />
      )}

      {/* Details Section: Status, Requester, Assignee, Created Date, Comments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 text-sm">
        {/* Status */}
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dot}`}></div>
          <span className="font-medium">{statusConfig.label}</span>
        </div>

        {/* Priority */}
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <PriorityIcon size={14} className={`mr-2 ${priorityConfig.color}`} />
          <span className="font-medium">{priorityConfig.label}</span>
        </div>

        {/* Requester */}
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <User size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
          <span className="truncate">
            <span className="font-semibold">Created By:</span> {ticket.requester ? `${ticket.requester.firstName} ${ticket.requester.lastName}` : 'No Requester'}
          </span>
        </div>

        {/* Assignee */}
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          {ticket.assignee?.avatar_url ? (
            <img src={ticket.assignee.avatar_url} alt={ticket.assignee.firstName} className="w-4 h-4 rounded-full mr-1" />
          ) : (
            <UserPlus size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
          )}
          <span className="truncate">
            <span className="font-semibold">Assigned To:</span> {getAssigneeDisplay()}
          </span>
        </div>

        {/* Created Date */}
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Calendar size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>

        {/* Category */}
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Tag size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
          <span
            className="truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsUpdateCategoryModalOpen(true); }}
            title="Click to edit category"
          >
            {ticket.category || 'No Category'}
          </span>
        </div>

        {/* Comments Count */}
        {((ticket.comments_count ?? ticket.comments?.length ?? 0) > 0) && (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <MessageSquare size={14} className="mr-2" />
            <span className="font-medium">{ticket.comments_count ?? ticket.comments.length} Comments</span>
          </div>
        )}

        {/* Tasks Count */}
        {ticket.linked_tasks_count !== undefined && ticket.linked_tasks_count >= 0 && (
          <div
            className="flex items-center text-green-600 dark:text-green-400 cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsTaskListDialogOpen(true); }}
            title="Click to view linked tasks"
          >
            <CheckSquare size={14} className="mr-2" />
            <span className="font-medium">
              Linked Tasks: {ticket.linked_tasks_count}
            </span>
          </div>
        )}

        {/* Unread Activity Count */}
        {ticket.unread_activity_count !== undefined && ticket.unread_activity_count > 0 && (
          <div className="flex items-center text-orange-600 dark:text-orange-400">
            <div className="relative">
              <MessageSquare size={14} className="mr-2" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {ticket.unread_activity_count > 9 ? '9+' : ticket.unread_activity_count}
              </span>
            </div>
            <span className="font-medium ml-1">{ticket.unread_activity_count} Unread</span>
          </div>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); } }}>
        <AddNoteModal
          ticketId={ticket.id}
          isOpen={isAddNoteModalOpen}
          onClose={() => setIsAddNoteModalOpen(false)}
          onNoteAdded={() => {
            // Optionally, you can add a callback to refresh the ticket data
          }}
        />
        <AssignTicketModal
          ticketId={ticket.id}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onTicketAssigned={() => {
            // Optionally, you can add a callback to refresh the ticket data
          }}
          assignedAgentId={ticket.assignee ? Number(ticket.assignee.id) : undefined}
        />
        <UpdateStatusModal
          ticketId={ticket.id}
          currentStatus={ticket.status}
          isOpen={isUpdateStatusModalOpen}
          onClose={() => setIsUpdateStatusModalOpen(false)}
          onStatusUpdated={() => {
            // Optionally, you can add a callback to refresh the ticket data
          }}
        />
        <AddTagModal
          ticketId={ticket.id}
          isOpen={isAddTagModalOpen}
          onClose={() => setIsAddTagModalOpen(false)}
          onTagAdded={() => {
            // Optionally, you can add a callback to refresh the ticket data
          }}
        />
        <UpdatePriorityModal
          ticketId={ticket.id}
          currentPriority={ticket.priority || 'medium'}
          isOpen={isUpdatePriorityModalOpen}
          onClose={() => setIsUpdatePriorityModalOpen(false)}
          onPriorityUpdated={() => {
            if (onTicketUpdate) {
              onTicketUpdate({ ...ticket, priority: ticket.priority });
            }
          }}
        />
        <UpdateCategoryModal
          ticketId={ticket.id}
          currentCategory={ticket.category || ''}
          isOpen={isUpdateCategoryModalOpen}
          onClose={() => setIsUpdateCategoryModalOpen(false)}
          onCategoryUpdated={() => {
            if (onTicketUpdate) {
              onTicketUpdate({ ...ticket, category: ticket.category });
            }
          }}
        />
        <TaskListDialog
          ticketId={ticket.id}
          isOpen={isTaskListDialogOpen}
          onClose={() => setIsTaskListDialogOpen(false)}
        />
      </div>
    </div>
  );
};
