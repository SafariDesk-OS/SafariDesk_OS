import React from 'react';
import { Calendar, User, MoreVertical, UserPlus, Clock, Tag, MessageSquare} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';
import { TaskObj } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getPriorityColor } from '../../../utils/displayHelpers';

export const mapApiTaskToTaskObj = (apiTask: any): TaskObj => {
  const priority = apiTask?.priority?.toLowerCase();
  return {
    id: apiTask?.id ?? 0,
    title: apiTask?.title ?? '',
    description: apiTask?.description ?? '',
    task_status: (apiTask?.task_status === 'open' ? 'todo' : apiTask?.task_status) as TaskObj['task_status'],
    priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? (priority as TaskObj['priority']) : null,
    task_trackid: apiTask?.task_trackid ?? '',
    assigned_to: apiTask?.assigned_to
      ? {
          id: apiTask.assigned_to.id,
          name: apiTask.assigned_to.name || `${apiTask.assigned_to.first_name ?? ''} ${apiTask.assigned_to.last_name ?? ''}`.trim(),
          email: apiTask.assigned_to.email ?? '',
          phone_number: apiTask.assigned_to.phone_number ?? '',
        }
      : null,
    created_by: apiTask?.created_by
      ? {
          id: apiTask.created_by.id,
          name: apiTask.created_by.name || `${apiTask.created_by.first_name ?? ''} ${apiTask.created_by.last_name ?? ''}`.trim(),
          email: apiTask.created_by.email ?? '',
          phone_number: apiTask.created_by.phone_number ?? '',
        }
      : null,
    department: apiTask?.department
      ? {
          id: apiTask.department.id,
          name: apiTask.department.name ?? '',
          slag: apiTask.department.slag ?? '',
        }
      : null,
    assigned_to_name: apiTask?.assigned_to
      ? apiTask.assigned_to.name || `${apiTask.assigned_to.first_name ?? ''} ${apiTask.assigned_to.last_name ?? ''}`.trim()
      : null,
    due_date: apiTask?.due_date ?? '',
    created_at: apiTask?.created_at ?? '',
    updated_at: apiTask?.updated_at ?? apiTask?.created_at ?? '',
    completed_at: apiTask?.completed_at ?? null,
    is_converted_to_ticket: Boolean(apiTask?.is_converted_to_ticket ?? false),
    linked_ticket: apiTask?.linked_ticket ?? null,
    status: apiTask?.task_status ?? '',
  };
};

interface TaskGridProps {
  task: TaskObj;
  openDropdownId: number | null;
  onDropdownToggle: (taskId: number) => void;
  onDropdownClose: () => void;
  onAction: (action: string, task: TaskObj) => void;
  formatDate: (dateString: string) => string;
  getStatusVariant: (status: string) => 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  getDueDateStatus: (dueDate: string) => 'overdue' | 'due-soon' | 'upcoming' | 'normal' | 'none';
  isSelected?: boolean;
  onSelectionChange?: (taskId: number, selected: boolean) => void;
}

const TaskGrid: React.FC<TaskGridProps> = ({
  task,
  openDropdownId,
  onDropdownToggle,
  onDropdownClose,
  onAction,
  formatDate,
  getStatusVariant,
  getDueDateStatus,
  isSelected = false,
  onSelectionChange,
}) => {
  const navigate = useNavigate();
  const dueDateStatus = getDueDateStatus(task.due_date);
  const dueDateColors = {
    overdue: 'text-red-600',
    'due-soon': 'text-orange-600',
    upcoming: 'text-yellow-600',
    normal: 'text-gray-500',
    none: 'text-gray-400'
  };

  const isDropdownOpen = openDropdownId === task.id;

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    onDropdownToggle(task.id);
  };

  const handleAction = (action: string) => {
    onAction(action, task);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on dropdown menu or its trigger
    if ((e.target as HTMLElement).closest('.menu-trigger') ||
        (e.target as HTMLElement).closest('.dropdown-menu') ||
        (e.target as HTMLElement).closest('[data-dropdown]')) {
      return;
    }
    navigate(`/task/${task.task_trackid}`);
  };

  // Using shared utility functions from displayHelpers

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(task.id, e.target.checked);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group cursor-pointer p-4 ${isSelected ? 'border-blue-400 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-700'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 accent-blue-600 mt-1"
          />
          <div className="flex items-center gap-2 mb-1 max-w-full">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base flex-1 min-w-0 line-clamp-2 break-words" title={task.title}>
              {task.title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex-shrink-0">
              {task.task_trackid}
            </span>
          </div>
        </div>
        <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            icon={MoreVertical}
            onClick={handleDropdownToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity menu-trigger"
          />
          <DropdownMenu isOpen={isDropdownOpen} onClose={onDropdownClose}>
            <div data-dropdown className="dropdown-menu">
              <DropdownItem icon={UserPlus} onClick={() => handleAction('assign')}>
                Assign/Reassign
              </DropdownItem>
              <DropdownItem icon={Clock} onClick={() => handleAction('update-status')}>
                Update Status
              </DropdownItem>
              <DropdownItem icon={MessageSquare} onClick={() => handleAction('attach-ticket')}>
                Attach to ticket
              </DropdownItem>
            </div>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      <div
        className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: task.description }}
      />

      {/* Status and Priority Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={getStatusVariant(task.task_status || 'todo')} className="rounded">
          {task.task_status ? task.task_status.replace('_', ' ').toUpperCase() : 'TO DO'}
        </Badge>
        {task.priority && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <Calendar className={`w-4 h-4 mr-2 flex-shrink-0 ${dueDateColors[dueDateStatus]}`} />
            <span className={`${dueDateColors[dueDateStatus]} font-medium truncate`} title={formatDate(task.due_date)}>
              Due: {formatDate(task.due_date)}
            </span>
          </div>
          {task.completed_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              Completed: {formatDate(task.completed_at)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {task.assigned_to ? task.assigned_to.name : 'Unassigned'}
            </span>
          </div>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>By: {task.created_by?.name || 'Unknown'}</span>
          </div>
        </div>
        
        {task.department && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Tag className="w-3 h-3 mr-1" />
            <span>{task.department.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskGrid;
