
import React, { useState } from 'react';
import { format } from 'date-fns';
import AddNoteModal from './AddNoteModal';
import AssignTicketModal from './AssignTicketModal';
import UpdateStatusModal from './UpdateStatusModal';
import AddTagModal from './AddTagModal';
import UpdatePriorityModal from './UpdatePriorityModal';
import UpdateCategoryModal from './UpdateCategoryModal';
import {
  Clock,
  User,
  MoreVertical,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  Calendar,
  Tag,
  UserPlus,
  CheckSquare
} from 'lucide-react';
import { Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { DropdownMenu, DropdownItem } from '../ui/Dropdown';
import { TaskListDialog } from './TaskListDialog';
import { NewBadge } from '../ui/NewBadge';

interface GridTicketCardProps {
  ticket: Ticket;
  openDropdownId: string | null;
  onDropdownToggle: (taskId: string) => void;
  onDropdownClose: () => void;
  onAction: (action: string, ticket: Ticket) => void;
  isActive: boolean;
  isSelected?: boolean;
  onSelectionChange?: (ticketId: string, selected: boolean) => void;
}

export const GridTicketCard: React.FC<GridTicketCardProps> = ({
  ticket,
  openDropdownId,
  onDropdownToggle,
  onDropdownClose,
  onAction,
  isActive,
  isSelected = false,
  onSelectionChange,
}) => {
  const navigate = useNavigate();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [isUpdatePriorityModalOpen, setIsUpdatePriorityModalOpen] = useState(false);
  const [isUpdateCategoryModalOpen, setIsUpdateCategoryModalOpen] = useState(false);
  const [isTaskListDialogOpen, setIsTaskListDialogOpen] = useState(false);

  const getStatusVariant = () => {
    switch (ticket.status) {
      case 'created':
        return 'info';
      case 'assigned':
        return 'warning';
      case 'in_progress':
        return 'warning';
      case 'hold':
        return 'default';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = () => {
    switch (ticket.priority) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== 'closed';



  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on dropdown menu or its trigger
    if ((e.target as HTMLElement).closest('.menu-trigger') ||
      (e.target as HTMLElement).closest('.dropdown-menu') ||
      (e.target as HTMLElement).closest('[data-dropdown]')) {
      return;
    }
    navigate(`/ticket/${ticket.ticket_id}`);
  };

  const isDropdownOpen = openDropdownId === ticket.id;

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when opening dropdown
    onDropdownToggle(ticket.id);
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
    } else {
      onAction(action, ticket);
    }
    onDropdownClose(); // Close dropdown after action
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(ticket.id, e.target.checked);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`h-full flex flex-col rounded-xl border p-5 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-gray-900/20 transition-all duration-300 cursor-pointer group relative ${isDropdownOpen ? 'z-50' : 'z-10'} ${isActive ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${isSelected ? 'border-blue-400 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'} ${ticket.breached ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}
      style={{ overflow: 'visible' }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 dark:to-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500">
          <AlertTriangle size={12} className="absolute -top-4 -right-3 text-white" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionChange}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between items-center flex-1 min-w-0">
              <span className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm flex items-center gap-1">
                  {ticket.ticket_id}
                  {ticket.breached && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Breached
                    </span>
                  )}
                  {ticket.is_merged && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      Merged{ticket.merged_into?.ticket_id ? ` → ${ticket.merged_into.ticket_id}` : ''}
                    </span>
                  )}
                </h3>
                <p className={`text-gray-800 dark:text-gray-200 mt-1 truncate flex items-center gap-2 ${!ticket.is_opened ? 'font-bold' : 'font-medium'}`}>
                  {ticket.title}
                  {(!ticket.is_opened || ticket.has_new_reply) && <NewBadge />}
                </p>
              </span>
              <span>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setIsUpdatePriorityModalOpen(true); }}
                  title="Click to edit priority"
                >
                  <Badge
                    variant={getPriorityVariant()}
                    size="sm"
                  >
                    {ticket.priority}
                  </Badge>
                </div>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                icon={MoreVertical}
                onClick={handleDropdownToggle}
                className="menu-trigger opacity-0 group-hover:opacity-100 transition-opacity relative z-50"
                title="More options"
              />
              {isDropdownOpen && (
                <DropdownMenu isOpen={isDropdownOpen} onClose={onDropdownClose}>
                  <div data-dropdown className="dropdown-menu">
                    <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                    <DropdownItem icon={UserPlus} onClick={() => handleAction('assign')}>
                      Assign/Reassign
                    </DropdownItem>
                    <DropdownItem icon={Clock} onClick={() => handleAction('update-status')}>
                      Update Status
                    </DropdownItem>
                    <DropdownItem icon={Tag} onClick={() => handleAction('add-note')}>
                      Add Note
                    </DropdownItem>
                    <DropdownItem icon={MessageSquare} onClick={() => handleAction('add-tag')}>
                      Add Tag
                    </DropdownItem>
                  </div>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html:
              ticket.description && ticket.description.length > 150
                ? ticket.description.substring(0, 150) + '...'
                : ticket.description,
          }}
        />

        {/* Status and Category */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusVariant()} size="sm">
              {ticket.status.replace('_', ' ')}
            </Badge>

            <div className="flex items-center gap-2">
              <span
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsUpdateCategoryModalOpen(true); }}
                title="Click to edit category"
              >
                {ticket.category}
              </span>
            </div>
          </div>

          {/* Attachments, Comments, Tasks and Activities indicators */}
          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
            {((ticket.attachments_count ?? ticket.attachments.length) > 0) && (
              <div className="flex items-center space-x-1">
                <Paperclip size={12} />
                <span className="text-xs">{ticket.attachments_count ?? ticket.attachments.length}</span>
              </div>
            )}
            {((ticket.comments_count ?? ticket.comments.length) > 0) && (
              <div className="flex items-center space-x-1">
                <MessageSquare size={12} />
                <span className="text-xs">{ticket.comments_count ?? ticket.comments.length}</span>
              </div>
            )}
            {ticket.linked_tasks_count !== undefined && ticket.linked_tasks_count >= 0 && (
              <div
                className="flex items-center space-x-1 cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsTaskListDialogOpen(true); }}
                title={`${ticket.linked_tasks_count} linked task${ticket.linked_tasks_count !== 1 ? 's' : ''} - click to view`}
              >
                <CheckSquare size={12} />
                <span className="text-xs">{ticket.linked_tasks_count}</span>
              </div>
            )}
            {ticket.unread_activity_count !== undefined && ticket.unread_activity_count > 0 && (
              <div className="flex items-center space-x-1 text-orange-500 dark:text-orange-400" title={`${ticket.unread_activity_count} unread activit${ticket.unread_activity_count !== 1 ? 'ies' : 'y'}`}>
                <div className="relative">
                  <MessageSquare size={12} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">
                    {ticket.unread_activity_count > 9 ? '9+' : ticket.unread_activity_count}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {ticket.assignee && (
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  {ticket.assignee.avatar_url ? (
                    <img src={ticket.assignee.avatar_url} alt={ticket.assignee.firstName} className="w-4 h-4 rounded-full mr-1" />
                  ) : (
                    <User size={10} className="text-blue-600 dark:text-blue-400" />

                  )}
                </div>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {ticket.assignee.firstName} {ticket.assignee.lastName}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
            </div>

            {ticket.dueDate && (
              <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar size={12} />
                <span>Due {format(new Date(ticket.dueDate), 'MMM d')}</span>
              </div>
            )}
          </div>

          <div className="text-gray-400">
            #{ticket.ticket_id.split('-').pop()}
          </div>
        </div>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {ticket.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-medium border border-blue-200 dark:border-blue-800"
              >
                {tag}
              </span>
            ))}
            {ticket.tags.length > 3 && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                +{ticket.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
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
            // Optionally refresh ticket data
          }}
        />
        <UpdateCategoryModal
          ticketId={ticket.id}
          currentCategory={ticket.category || ''}
          isOpen={isUpdateCategoryModalOpen}
          onClose={() => setIsUpdateCategoryModalOpen(false)}
          onCategoryUpdated={() => {
            // Optionally refresh ticket data
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
