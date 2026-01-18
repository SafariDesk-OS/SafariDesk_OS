import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { SessionUser, User } from '../types';
import { APIS } from '../services/apis';
import { jwtDecode } from 'jwt-decode'
import { ALLOW_OTP } from '../utils/base';


interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  sessionKey: string | null;
  workspace: any | null; 
  success: boolean | false; 
  linkSent: boolean | false; 
  isStraight: boolean | false; 
  hasPasswordReset: boolean | false; 
  siteUrl: string | null;

  url: string | null; 
  
  // Actions
  setTokens: (access: string, refresh: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<string | undefined>;
  logout: () => void;
  updateUser: (userData: Partial<SessionUser>) => void;
  updateUserProfile: (userData: any) => void;
  fetchCurrentUserProfile: () => Promise<void>;
  updateBusiness: (businessData: Partial<SessionUser['business']>) => void;
  clearError: () => void;
  clearSuccess: () => void;
  verifyOTP: (otp: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, new_password: string, uid: string) => Promise<void>;
  resendOTP: () => Promise<void>;
  cleanFlow: () => void;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  business_name: string;
  subdomain: string;
  organization_size: string;
}


// API functions using axios
const apiLogin = async (username: string, password: string) => {
  const payload = {
    username,
    password,
  };

  const url: string = ALLOW_OTP ? APIS.LOGIN : APIS.EXPRESS_LOGIN;

  const response = await axios.post(url, payload);
  return response.data;
};


const ApirequestPasswordReset = async (identifier: string) => {
  const payload = {
    identifier,
  };
  const response = await axios.post(APIS.REQUEST_RESET_PASSWORD, payload);
  return response.data;
};


const ApiResetPassword = async (token: string, new_password: string, uid: string) => {
  const payload = {
    token,
    new_password,
    uid,
  };
  const response = await axios.post(APIS.RESET_PASSWORD, payload);
  return response.data;
};


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      message: null,
      sessionKey: null, // Initialize sessionKey
      success: false,
      isStraight: false,
      linkSent: false,
      hasPasswordReset: false,
      siteUrl: null,
      url: 'otp-verify',

      setTokens: (access: string, refresh: string) => {
        localStorage.setItem("token", access);
        const user: SessionUser = jwtDecode(access);
        set({
          isAuthenticated: true,
          user: user,
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {


          if (ALLOW_OTP) {

            const { sessionKey } = await apiLogin(email, password);

            set({
              sessionKey,
              isLoading: false,
              success: true,
              url: 'otp-verify',

            });

          }else{

            const { access } = await apiLogin(email, password);

            localStorage.setItem("token", access);
            const user: SessionUser = jwtDecode(access)

          set({
            isLoading: false,
            success: true,
            isAuthenticated: true,
            user: user,
            isStraight: true,
            url: 'dashboard',
          });

          }

          
        } catch (error: any) {
          let errorMessage = 'An unexpected error occurred';
          
          if (axios.isAxiosError(error)) {
            const responseData = error.response?.data;
            
            // Check for specific error messages from backend
            if (responseData?.message) {
              errorMessage = responseData.message;
            } else if (responseData?.detail) {
              errorMessage = responseData.detail;
            } else if (responseData?.error_code) {
              // Map error codes to user-friendly messages
              switch (responseData.error_code) {
                case 'invalid_username':
                  errorMessage = 'Invalid username. Please check and try again.';
                  break;
                case 'wrong_password':
                  errorMessage = 'Wrong password. Please try again.';
                  break;
                case 'account_disabled':
                  errorMessage = 'Your account has been disabled. Please contact support.';
                  break;
                default:
                  errorMessage = error.response?.data?.message || error.message;
              }
            } else {
              errorMessage = error.message;
            }
          }
          
          set({
            error: errorMessage,
            isLoading: false,
            success: false,
          });
        }
      },
      requestPasswordReset: async (identifier: string) => {
        set({ isLoading: true, error: null });
        
        try {
          
            await ApirequestPasswordReset(identifier);
            set({
              isLoading: false,
              linkSent: true,
              // url: 'auth',
            });
          
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'An unexpected error occurred';
          
          set({
            error: errorMessage,
            isLoading: false,
            linkSent: false,
          });
        }
      },

      resetPassword: async (token: string, new_password: string, uid: string) => {
        set({ isLoading: true, error: null });
        
        try {
          
           const response = await ApiResetPassword(token, new_password, uid);

           console.log(response)

            set({
              isLoading: false,
              hasPasswordReset: true,
              // url: 'auth',
            });
          
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'An unexpected error occurred';
          
          set({
            error: errorMessage,
            isLoading: false,
            hasPasswordReset: false,
          });
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Transform userData to match API payload format
          const payload = {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            business_name: userData.business_name,
            domain: userData.subdomain,
            organization_size: userData.organization_size,
            website: "" // or provide a default/configurable website URL
          };

          const response = await axios.post(APIS.CREATE_BUSINESS, payload);
          
          // Handle register response based on your API structure
          set({
            isLoading: false,
            success: true,
            message: response.data.message,
            siteUrl: response.data.site_url,
          });
          return response.data;
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'An unexpected error occurred';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          return undefined;
        }
      },

      logout: () => {
        set({
          user: null,
          workspace: null, // Clear workspace on logout
          isAuthenticated: false,
          error: null,
          sessionKey: null,
        });
      },

      updateUser: (userData: Partial<SessionUser>) => {
  const { user } = get();
  if (user) {
    set({
      user: { ...user, ...userData },
    });
  }
},

updateBusiness: (businessData: Partial<SessionUser['business']>) => {
  const { user } = get();
  if (user && user.business) {
    set({
      user: {
        ...user,
        business: {
          ...user.business,
          ...businessData,
        },
      },
    });
  }
},

      updateUserProfile: (userData: any) => {
        const { user } = get();
        if (user) {
          const updatedUser = {
            ...user,
            first_name: userData.first_name || user.first_name,
            last_name: userData.last_name || user.last_name,
            email: userData.email || user.email,
            phone_number: userData.phone_number || user.phone_number,
            avatar_url: userData.avatar_url || user.avatar_url,
          };
          set({ user: updatedUser });
          
          // Also update the token in localStorage with new user data
          const token = localStorage.getItem('token');
          if (token) {
            localStorage.setItem('token', token);
          }
        }
      },

      verifyOTP: async (otp: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { sessionKey } = get(); // Get sessionKey from current state
          
          const payload = {
            otp: otp,
            session_key: sessionKey
          };
          
          const response = await axios.post(APIS.VERIFY_OTP, payload);
          const { access } = response.data;
          localStorage.setItem("token", access);

          const user: SessionUser = jwtDecode(access)
          
          set({
            isAuthenticated: true,
            isLoading: false,
            success: true,
            user: user
          });
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'An unexpected error occurred';
          
          set({
            error: errorMessage,
            isLoading: false,
            success: false,
          });
        }
      },
      resendOTP: async() => {
        try {
          const { sessionKey } = get();
          
          const payload = {
            session_key: sessionKey
          };
          
         await axios.post(APIS.RESEND_OTP, payload);
          
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'An unexpected error occurred';
          
          set({
            error: errorMessage,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
      clearSuccess: () => {
        set({ success: false, });
      },
      cleanFlow: () => {
        set({ 
          success: false,
          error: null,
          isLoading: false,
          sessionKey: null,
          message: null,
          siteUrl: null,
        });
      },

      fetchCurrentUserProfile: async () => {
        try {
          const response = await axios.get(APIS.GET_CURRENT_USER);
          const userData = response.data;
          
          // Update user with fresh data from backend
          const { user } = get();
          if (user) {
            const updatedUser = {
              ...user,
              first_name: userData.first_name || user.first_name,
              last_name: userData.last_name || user.last_name,
              email: userData.email || user.email,
              phone_number: userData.phone_number || user.phone_number,
              avatar_url: userData.avatar_url || user.avatar_url,
            };
            set({ user: updatedUser });
          }
        } catch (error) {
          // Silently fail - user data is already available from JWT
          console.debug('Failed to fetch current user profile:', error);
        }
      },
      

    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace, 
        isAuthenticated: state.isAuthenticated,
        sessionKey: state.sessionKey,
        success: state.success,
      }),
    }
  )
);
