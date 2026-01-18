import { useEffect, useRef, useCallback } from "react";
import { Notification } from "../../types/notification";
import { SOCKET_URL } from "../../utils/base";
import { APIS } from "../apis";

type Callback = (notification: Notification) => void;
export const useNotificationSocket = (
  token: string | null | undefined,
  onMessage: Callback,
  onNotificationsList?: (list: Notification[]) => void,
  onUnreadCountUpdate?: (count: number) => void,
  onUnreadNotificationsList?: (list: Notification[]) => void
) => {
  const socketRef = useRef<WebSocket | null>(null);
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token) {
      console.log("🔔 No token available, skipping WebSocket connection");
      return;
    }

    // Close existing connection if any
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔔 WebSocket already connected");
      return;
    }

    try {
      console.log("🔔 Connecting to WebSocket...");
      const ws = new WebSocket(`${SOCKET_URL}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        reconnectAttemptsRef.current = 0;
        // Request initial notifications list via WebSocket
        ws.send(JSON.stringify({ type: "get_notifications" }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", data.type);
          
          switch (data.type) {
            case "notification_message":
            case "new_notification":
              onMessage(data.notification || data.data);
              break;
            case "connection_established":
              console.log("🔗 WebSocket connection established:", data.message);
              break;
            case "unread_count_update":
            case "unread_count":
              onUnreadCountUpdate?.(data.count);
              break;
            case "notifications_list":
              console.log(`📋 Received ${data.notifications?.length || 0} notifications via WebSocket`);
              onNotificationsList?.(data.notifications);
              break;
            case "unread_notifications_list":
              console.log(`📋 Received ${data.notifications?.length || 0} unread notifications via WebSocket`);
              onUnreadNotificationsList?.(data.notifications);
              break;
            default:
              console.warn("⚠️ Unknown WebSocket message type:", data.type);
          }
        } catch (err) {
          console.error("❌ Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = (event) => {
        console.warn("🔌 WebSocket closed:", event.code, event.reason);
        socketRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error("❌ Max reconnection attempts reached. Please refresh the page.");
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
    }
  }, [token, onMessage, onNotificationsList, onUnreadCountUpdate, onUnreadNotificationsList]);

  // Setup WebSocket connection on mount
  useEffect(() => {
    connect();

    return () => {
      console.log("🧹 Cleaning up WebSocket connection");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Auth headers for HTTP fallback operations (mark as read only)
  const authHeaders = useCallback(() => ({
    "Authorization": `Bearer ${token}`,
    "X-CLIENT-DOMAIN": localStorage.getItem("subdomain") || "default",
    "Content-Type": "application/json",
  }), [token]);

  // Request notifications via WebSocket (no HTTP polling)
  const requestNotifications = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("🔔 Requesting notifications via WebSocket");
      socketRef.current.send(JSON.stringify({ type: "get_notifications" }));
    } else {
      console.warn("⚠️ WebSocket not connected, cannot request notifications");
    }
  }, []);

  // Mark all as read via HTTP REST API
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(APIS.NOTIFICATION_MARK_ALL_READ, {
        method: "POST",
        headers: authHeaders(),
      });
      
      if (response.ok) {
        console.log("✅ All notifications marked as read");
        // Request updated list via WebSocket
        requestNotifications();
      } else {
        console.error("❌ Failed to mark all as read:", response.statusText);
      }
    } catch (err) {
      console.error("❌ Failed to mark all as read:", err);
    }
  }, [authHeaders, requestNotifications]);

  // Mark one notification as read via HTTP REST API
  const markOneAsRead = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${APIS.NOTIFICATION_MARK_READ}${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_read: true }),
      });
      
      if (response.ok) {
        console.log("✅ Notification marked as read:", id);
        // Request updated list via WebSocket
        requestNotifications();
      } else {
        console.error("❌ Failed to mark notification as read:", response.statusText);
      }
    } catch (err) {
      console.error("❌ Failed to mark notification as read:", err);
    }
  }, [authHeaders, requestNotifications]);

  return {
    socketRef,
    requestNotifications,
    markAllAsRead,
    markOneAsRead,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
  };
};
