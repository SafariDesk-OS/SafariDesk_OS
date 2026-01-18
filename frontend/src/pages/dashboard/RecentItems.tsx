import { AlertCircle, CheckCircle, Clock, Users, UserX } from "lucide-react";
import { TaskItem, TicketItem } from "../../types";
import { useNavigate } from "react-router-dom";

type TicketItemCardProps = {
  item: TicketItem
}
export const RecentTicketItemCard: React.FC<TicketItemCardProps> = ({ item }) => {
  const navigate = useNavigate()
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'in_progress': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'resolved': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in_progress': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div onClick={() => navigate(`/ticket/${item.ticket_id}`) } className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              <span className="ml-1">{item.status.replace('_', ' ')}</span>
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                {item.category}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
          <div
            className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
           <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            Created by {item.creator_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(item.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.assigned_to ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users size={10} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium">{item.assigned_to}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <UserX size={10} />
              </div>
              <span className="font-medium">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



type TaskItemCardProps = {
  item: TaskItem
}
export const RecentTaskItemCard: React.FC<TaskItemCardProps> = ({ item }) => {
    const navigate = useNavigate()
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'in_progress': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'resolved': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default: return 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} />;
      case 'in_progress': return <Clock size={14} />;
      case 'resolved': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div onClick={() => navigate(`/task/${item.task_id}`) } className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              <span className="ml-1">{item.status.replace('_', ' ')}</span>
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
          <div
            className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            Created by {item.creator_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(item.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.assigned_to ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users size={10} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium">{item.assigned_to}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <UserX size={10} />
              </div>
              <span className="font-medium">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
