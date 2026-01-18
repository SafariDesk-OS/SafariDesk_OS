import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type: string;
  metadata: {
    comment_id?: number;
    mentioned_by?: number;
    mentioned_by_name?: string;
    [key: string]: unknown;
  };
  ticket: {
    id: number;
    ticket_id: string;
    title: string;
    status: string;
    priority: string;
  };
}

interface UseNotificationWebSocketReturn {
  isConnected: boolean;
  lastNotification: Notification | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export const useNotificationWebSocket = (): UseNotificationWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { user } = useAuthStore();
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  const connect = useCallback(() => {
    // Skip connection if already connected
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!user) {
      // Don't log error if just not authenticated yet - this is normal on page load
      setConnectionStatus('disconnected');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      // Don't log error on page load - wait for authentication
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    console.log('🔄 Connecting to notification WebSocket...');

    // WebSocket URL - use backend API host, not frontend host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Extract backend host from API URL or use default
    const backendHost = new URL(import.meta.env.VITE_API_URL || 'http://localhost:8000').host;
    const wsUrl = `${protocol}//${backendHost}/ws/notifications/`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0; // Reset on successful connection

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle connection confirmation
          if (data.type === 'connection_established') {
            console.log('✅ Connection confirmed:', data);
            return;
          }

          // Handle pong response
          if (data.type === 'pong') {
            return;
          }

          // Handle notification message
          if (data.notification_type === 'ticket_mention' || data.type === 'notification_message') {
            console.log('📬 New notification received:', data);
            setLastNotification(data);

            // Request browser notification permission if not granted
            if ('Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission();
            }

            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              showBrowserNotification(data);
            }
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [user]);

  const showBrowserNotification = (notification: Notification) => {
    try {
      const options: NotificationOptions = {
        body: notification.message,
        icon: '/favicon.ico', // Adjust to your app's icon
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        data: {
          notificationId: notification.id,
          ticketId: notification.ticket?.id,
          url: `/ticket/${notification.ticket?.id}`
        }
      };

      const browserNotification = new Notification(
        `${notification.ticket?.ticket_id} - New Mention`,
        options
      );

      // Navigate to ticket when notification is clicked
      browserNotification.onclick = () => {
        window.focus();
        window.location.href = `/ticket/${notification.ticket?.id}`;
        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => browserNotification.close(), 10000);
    } catch (error) {
      console.error('❌ Error showing browser notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, user]);

  return { isConnected, lastNotification, connectionStatus };
};
