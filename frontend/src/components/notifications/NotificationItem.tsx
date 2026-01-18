import { useNavigate } from "react-router-dom";
import { formatTimestamp } from "../../utils/dates";
import { Notification } from "../../types/notification";
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead?: () => void;
}> = ({ notification, onMarkRead }) => {
  console.log(notification);
  const navigate = useNavigate();

  const goToTicket = () => {
    // Handle task notifications
    if (notification.task?.task_trackid) {
      navigate(`/task/${notification.task.task_trackid}`);
    }
    // Handle ticket notifications
    else if (notification.ticket?.ticket_id) {
      navigate(`/ticket/${notification.ticket.ticket_id}`);
    }
  };
  return (
    <div
      onClick={goToTicket}
      className={`relative p-4 border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group ${
        !notification.is_read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
      }`}
    >
      {!notification.is_read && (
        <div className="absolute left-2 top-6 w-2 h-2 bg-green-500 rounded-full"></div>
      )}

      <div className="flex items-start space-x-3 ml-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {notification?.notification_type}
              </span>
            </div>
            {(notification.ticket?.priority || notification.task?.priority) && (
              <span className="px-2 py-1 text-xs rounded-lg font-normal bg-indigo-100 text-indigo-500 dark:bg-indigo-500 dark:text-white">
                {notification.ticket?.priority || notification.task?.priority}
              </span>
            )}
          </div>

          <h4
            className={`text-sm font-medium mb-1 ${
              !notification.is_read
                ? "text-green-800 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            {notification.task?.title || notification.ticket?.title || "Untitled Notification"}
          </h4>

          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center space-x-4 mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-500 block">
              {formatTimestamp(notification.created_at)}
            </span>

            {!notification.is_read && (
              <span
                onClick={onMarkRead}
                className="font-normal text-sm flex items-center space-x-1 text-green-600 dark:text-green-400 underline underline-offset-4 cursor-pointer"
              >
                <span>Mark as read</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
