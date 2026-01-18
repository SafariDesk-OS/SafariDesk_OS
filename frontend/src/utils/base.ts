/**
 * Base configuration using Vite environment variables
 * Configure via .env.local (local), .env.development (staging), .env.production (prod)
 */

// API Base URL
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8100/api/v1';

// OTP Configuration
export const ALLOW_OTP = false;

// WebSocket URL for notifications
export const WS_NOTIFICATIONS_URL = import.meta.env.VITE_WS_NOTIFICATIONS_URL || 'ws://localhost:8101/ws/notifications/';

// Backward compatibility alias
export const SOCKET_URL = WS_NOTIFICATIONS_URL;

// Site URL
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:8000/site';

// WebSocket base URL for chatbot
export const CHAT_WS_BASE = import.meta.env.VITE_CHAT_WS_BASE || import.meta.env.VITE_WS_URL || 'ws://localhost:8101';
