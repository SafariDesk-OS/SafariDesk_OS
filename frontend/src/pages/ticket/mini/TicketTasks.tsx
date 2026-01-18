import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  User,
  Calendar,
  Paperclip,
  MessageCircle,
  AlertCircle,
  Download,
  Eye,
  X,
  ListTodo,
  Square,
  CheckSquare,
  Archive,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import CreateTaskModal from '../../../components/tasks/CreateTaskModal';
import { Modal } from '../../../components/ui/Modal';
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { AxiosError } from 'axios';
import { errorNotification } from '../../../components/ui/Toast';
import { useTaskBulkActions } from '../../../hooks/useTaskBulkActions';
import { getStatusColor, getPriorityColor, formatDateWithRelativeTime } from '../../../utils/displayHelpers';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

type TaskComment = {
  id: number;
  content: string;
  author: string;
  created_at: string;
  attachments: string[];
};

type Task = {
  id: number;
  task_trackid: string | null;
  title: string;
  description: string;
  priority: string | null;
  status: string;
  assigned_to: string;
  due_date: string;
  completed_at: string | null;
  attachments: string[];
  comments: TaskComment[];
};

type TicketTasksProps = {
  ticketId: number;
  onTaskCountChange?: (count: number) => void;
  refreshTrigger?: number; // Increment this to force refresh
};

// Loading skeleton component
const TaskSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
    <div className="flex items-center space-x-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
  </div>
);

// Image preview modal
const ImagePreviewModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
    <div className="relative max-w-4xl max-h-4xl m-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white dark:text-gray-100 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 dark:hover:bg-opacity-75 transition-colors z-10"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt="Preview"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="w-full text-center py-12">
    <ListTodo className="mx-auto h-12 w-12 text-green-400 mb-4" />
    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Tasks</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tasks for this ticket will appear here.</p>
    <div className="mt-4 flex justify-center">
      <Button onClick={onCreate}>Create Task</Button>
    </div>
  </div>
);

// Using shared utility functions from displayHelpers for getStatusColor, getPriorityColor, formatDateWithRelativeTime

const formatDueDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Due today';
  if (diffInDays === 1) return 'Due tomorrow';
  if (diffInDays < 0) return `Overdue by ${Math.abs(diffInDays)} days`;
  if (diffInDays <= 7) return `Due in ${diffInDays} days`;

  return `Due ${date.toLocaleDateString()}`;
};

const getFileNameFromUrl = (url: string) => {
  return url.split('/').pop() || 'file';
};

const getFileExtension = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  return fileName.split('.').pop()?.toLowerCase() || '';
};

const isImageFile = (extension: string) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  return imageExts.includes(extension);
};

const downloadFile = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const isDueSoon = (dueDate: string) => {
  const date = new Date(dueDate);
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays <= 1 && diffInDays >= 0;
};

const isOverdue = (dueDate: string) => {
  const date = new Date(dueDate);
  const now = new Date();
  return date.getTime() < now.getTime();
};

export default function TicketTasks({ ticketId, onTaskCountChange, refreshTrigger }: TicketTasksProps) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [isCreateTaskModalDirty, setIsCreateTaskModalDirty] = useState(false);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const {
    selectedTasks,
    selectedCount,
    allSelected,
    toggleTaskSelection,
    toggleSelectAll,
    bulkArchive,
    bulkDelete,
    clearSelection,
  } = useTaskBulkActions(tasks, { onCompleted: () => fetchTasks() });

  // Handle task title click - navigate to task detail page
  const handleTaskClick = (task: Task) => {
    if (task.task_trackid) {
      navigate(`/task/${task.task_trackid}`);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await http.get(`${APIS.LOAD_TICKET_TASKS}/${ticketId}`);
      setTasks(response.data);
      // Report task count to parent component
      onTaskCountChange?.(response.data.length);
      clearSelection();
    } catch (err) {
      const error = err as AxiosError;

      if (error.response && error.response.data) {
        const errorMessage =
          (error.response.data as { message?: string }).message || "An error occurred";
        errorNotification(errorMessage);
      } else {
        errorNotification("Network or unexpected error occurred");
      }
    } finally {
      setTimeout(() => setLoadingTasks(false), 20);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTasks();
    }
  }, [ticketId, refreshTrigger]);

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleCloseCreateTaskModal = () => {
    if (isCreateTaskModalDirty) {
      setShowCloseConfirmDialog(true);
      return;
    }
    setShowCreateTaskModal(false);
    setIsCreateTaskModalDirty(false);
  };

  const confirmCloseModal = () => {
    setShowCloseConfirmDialog(false);
    setShowCreateTaskModal(false);
    setIsCreateTaskModalDirty(false);
  };

  const renderCreateTaskModal = (
    <Modal
      isOpen={showCreateTaskModal}
      onClose={handleCloseCreateTaskModal}
      title="Create Task"
      size="4xl"
    >
      {showCreateTaskModal && (
        <CreateTaskModal
          ticketId={ticketId}
          reload={fetchTasks}
          onclose={handleCloseCreateTaskModal}
          onSuccess={confirmCloseModal}
          onDirtyChange={setIsCreateTaskModalDirty}
        />
      )}
    </Modal>
  );

  if (loadingTasks) {
    return (
      <div className=" p-6 min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Ticket Tasks</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <TaskSkeleton key={index} />
          ))}
        </div>
        {renderCreateTaskModal}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6  min-h-screen">
        <div className="bg-white dark:bg-gray-800">
          <EmptyState onCreate={() => setShowCreateTaskModal(true)} />
        </div>
        {renderCreateTaskModal}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ticket Tasks</h2>
            {tasks.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
              >
                {allSelected ? 'Clear selection' : 'Select all'}
              </button>
            )}
          </div>
          <Button onClick={() => setShowCreateTaskModal(true)}>Create Task</Button>
        </div>

        {selectedTasks.size > 0 && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
            <div className="text-sm text-gray-700 dark:text-gray-200">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkArchive}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Archive size={16} />
                Archive
              </button>
              <button
                onClick={bulkDelete}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task: Task) => (
          <div
            key={task.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border p-6 flex flex-col ${selectedTasks.has(task.id)
              ? 'border-green-500 dark:border-green-500 ring-2 ring-green-100 dark:ring-green-800'
              : 'border-gray-200 dark:border-gray-700'
              }`}
          >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <button
                  className="flex-shrink-0 mt-1 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                  onClick={() => toggleTaskSelection(task.id)}
                  aria-label={selectedTasks.has(task.id) ? 'Deselect task' : 'Select task'}
                >
                  {selectedTasks.has(task.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="group text-left"
                    disabled={!task.task_trackid}
                    title={task.task_trackid ? 'Click to view task details' : 'Task details unavailable'}
                  >
                    <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 ${task.task_trackid ? 'group-hover:text-green-600 dark:group-hover:text-green-400 cursor-pointer' : ''
                      }`}>
                      {task.title}
                      {task.task_trackid && (
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </h3>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.priority && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Task Description */}
            <div className="mb-4 flex-grow">
              {task.description ? (
                <div
                  className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">No description</p>
              )}
            </div>

            {/* Task Meta Information */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{task.assigned_to}</span>
              </div>

              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span className={`${isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400 font-medium' :
                  isDueSoon(task.due_date) ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''
                  }`}>
                  {formatDueDate(task.due_date)}
                </span>
                {(isOverdue(task.due_date) || isDueSoon(task.due_date)) && (
                  <AlertCircle size={16} className={isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'} />
                )}
              </div>

              {task.completed_at && (
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span>Completed {formatDateWithRelativeTime(task.completed_at)}</span>
                </div>
              )}
            </div>

            {/* Task Attachments */}
            {task.attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <Paperclip size={16} className="mr-1" />
                  Attachments ({task.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.attachments.map((url: string, index: number) => {
                    const fileName = getFileNameFromUrl(url);
                    const fileExtension = getFileExtension(url);
                    const isImage = isImageFile(fileExtension);

                    return (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <span className="text-base">{isImage ? '🖼️' : '📎'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{fileName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{fileExtension}</p>
                        </div>
                        <div className="flex space-x-1">
                          {isImage && (
                            <button
                              onClick={() => setPreviewImage(url)}
                              className="p-1 text-gray-400 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                              title="Preview image"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => downloadFile(url, fileName)}
                            className="p-1 text-gray-400 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                            title="Download file"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Task Comments */}
            {task.comments.length > 0 && (
              <div>
                <button
                  onClick={() => toggleTaskExpansion(task.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors mb-3"
                >
                  <MessageCircle size={16} />
                  <span>{task.comments.length} Comments</span>
                </button>

                {expandedTasks.has(task.id) && (
                  <div className="space-y-3 pl-6 border-l-2 border-green-100 dark:border-green-700">
                    {task.comments.map((comment: TaskComment) => (
                      <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.author}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateWithRelativeTime(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>

                        {comment.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {comment.attachments.map((url: string, index: number) => {
                              const fileName = getFileNameFromUrl(url);
                              const fileExtension = getFileExtension(url);
                              const isImage = isImageFile(fileExtension);

                              return (
                                <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded px-2 py-1 text-xs">
                                  <span>{isImage ? '🖼️' : '📎'}</span>
                                  <span className="truncate max-w-20 text-gray-900 dark:text-gray-100">{fileName}</span>
                                  <div className="flex space-x-1">
                                    {isImage && (
                                      <button
                                        onClick={() => setPreviewImage(url)}
                                        className="text-gray-400 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                      >
                                        <Eye size={12} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => downloadFile(url, fileName)}
                                      className="text-gray-400 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        show={showCloseConfirmDialog}
        cancel={() => setShowCloseConfirmDialog(false)}
        onConfirm={confirmCloseModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        variant="warning"
        confirmText="Close Anyway"
        cancelText="Keep Editing"
      />

      {renderCreateTaskModal}
    </div>
  );
}
