import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { BASE_URL } from '../utils/base'
import { errorNotification } from '../components/ui/Toast';
import { EXEMPTED_TOKEN_ROUTES } from '../routes/config';
import { useAuthStore } from '../stores/authStore';


// Create an Axios instance
const http = axios.create({
  baseURL: BASE_URL,
  // timeout: 20000, // Set timeout to 6 seconds
})

interface DecodedToken {
  exp: number
  [key: string]: string | number | boolean
}

const isTokenValid = (token: string): boolean => {
  if (!token) return false
  try {
    const decodedToken = jwtDecode<DecodedToken>(token)
    const currentTime = Math.floor(Date.now() / 1000)
    return decodedToken.exp > currentTime
  } catch (e) {
    console.error('Token decoding error:', e)
    return false
  }
}

// Check if a URL matches public routes (including dynamic segments)
const isPublicRoute = (url: string): boolean => {


  // Check exact matches first
  if (EXEMPTED_TOKEN_ROUTES.some(route => url.includes(route))) {
    return true;
  }

  // Check for customer ticket route pattern (matches /customer/ticket/TICKETID)
  // This will match patterns like: /customer/ticket/INCE34FAB
  const ticketRoutePattern = /\/customer\/ticket\/[A-Z0-9]+\/?$/i;
  return ticketRoutePattern.test(url);
}

// Request interceptor
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Extract subdomain from hostname for X-Client-Domain header
    const hostname = window.location.hostname;
    let subdomain = null;

    // Handle different hostname formats
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        subdomain = parts[0]; // e.g., 'nobody' from 'nobody.safaridesk.io'
      }
    } else {
      // For localhost, try to extract from hostname like 'nobody.localhost'
      const parts = hostname.split('.');
      if (parts.length > 1) {
        subdomain = parts[0];
      }
    }

    const isPublic = isPublicRoute(config.url || '');

    // Add X-Client-Domain header if subdomain exists
    if (subdomain) {
      config.headers['X-Client-Domain'] = subdomain;
    }

    if (token && !isPublic) {
      if (isTokenValid(token)) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        errorNotification('Session expired');
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return config
  },
  (error) => {
    errorNotification(error)
    return Promise.reject(error)
  },
)

// Response interceptor
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED') {
      errorNotification('Request timeout error: ' + error.message)
    }

    // Handle 401 errors (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Prevent infinite loop
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refresh');

        // Try to refresh the token
        if (refreshToken) {
          try {
            const response = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh/`, {
              refresh: refreshToken
            });

            const newToken = response.data.access;
            localStorage.setItem('token', newToken);

            // Update tokens in auth store
            const { setTokens, fetchCurrentUserProfile } = useAuthStore.getState();
            setTokens(newToken, refreshToken);

            // Fetch fresh user profile data from backend (avatar and other user-specific data)
            await fetchCurrentUserProfile();

            // Retry the original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return http(originalRequest);
          } catch {
            // Refresh failed, logout user
            errorNotification('Session expired. Please login again.');
            await handleLogout();
          }
        } else {
          // No refresh token, logout immediately
          await handleLogout();
        }
      }
    }

    return Promise.reject(error)
  },
)

const handleLogout = async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh')
  window.location.href = '/auth'
}

export default http