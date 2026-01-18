import { useRef, useState } from "react";
import { useClickOutside } from "../../hooks/ClickOutside";
import { Bell, X, Loader2, ArrowRight } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { Notification } from "../../types/notification";
import { useNavigate } from "react-router-dom";

export const NotificationsDropdown: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllAsRead?: () => void;
  onMarkOneAsRead?: (id: number) => void;
}> = ({ isOpen, onClose, notifications = [], onMarkAllAsRead, onMarkOneAsRead }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();
  useClickOutside(dropdownRef, onClose);

  // Debug log
  console.log("🔔 NotificationsDropdown render:", {
    isOpen,
    notificationsCount: notifications.length,
    notifications
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const DISPLAY_LIMIT = 5;
  const displayedNotifications = notifications.slice(0, DISPLAY_LIMIT);

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      // Call the callback which uses HTTP API
      await onMarkAllAsRead?.();
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 z-50 animate-slide-down"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {notifications.length} total
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className={`text-xs font-medium ${
                markingAll
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-blue-300"
              }`}
            >
              {markingAll ? (
                <span className="flex items-center space-x-1">
                  <Loader2 className="animate-spin w-3 h-3" />
                  <span>Marking...</span>
                </span>
              ) : (
                "Mark all read"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell
              className="mx-auto mb-3 text-gray-400 dark:text-gray-500"
              size={48}
            />
            <p className="text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              We'll notify you when something happens
            </p>
          </div>
        ) : (
          // Sort notifications to show unread first, then by date (limited to DISPLAY_LIMIT)
          [...displayedNotifications]
            .sort((a, b) => {
              // Unread notifications first
              if (a.is_read !== b.is_read) {
                return a.is_read ? 1 : -1;
              }
              // Then sort by date (newest first)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => onMarkOneAsRead?.(notification.id)} 
              />
            ))
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="w-full px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
          title="View all notifications"
        >
          Open notifications
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
