import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  avatar?: string;
  storeName?: string;
  businessType?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  sellerLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (adminId: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message?: string }>;
  sellerRegister: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  initializeAuth: () => void;
  setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      sellerLogin: async (email: string, password: string) => {
        try {
          const response = await api.sellerLogin(email, password);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            // Store token in localStorage for API calls
            localStorage.setItem('token', token);
            return { success: true };
          }

          console.error('Seller login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Invalid email or password'
          };
        } catch (error) {
          console.error('Seller login error:', error);
          return {
            success: false,
            message: 'Login failed. Please check your connection and try again.'
          };
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await api.login(email, password);

          if (response.success && response.data) {
            const { user, token } = response.data;

            set({
              user,
              token,
              isAuthenticated: true
            });

            // Store token in localStorage for API calls
            localStorage.setItem('token', token);
            return { success: true, user };
          }

          console.error('Login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Invalid email or password'
          };
        } catch (error) {
          console.error('Login error:', error);
          return {
            success: false,
            message: 'Login failed. Please check your connection and try again.'
          };
        }
      },

      adminLogin: async (adminId: string, password: string) => {
        try {
          const response = await api.adminLogin(adminId, password);

          if (response.success && response.data) {
            const { admin, token } = response.data;

            // Convert admin to user format
            const user = {
              id: admin.adminId,
              name: admin.name,
              email: admin.email,
              role: admin.role
            };

            set({
              user,
              token,
              isAuthenticated: true
            });

            // Store token in localStorage for API calls
            localStorage.setItem('token', token);
            return { success: true, user };
          }

          console.error('Admin login failed:', response.message);
          return {
            success: false,
            message: response.message || 'Invalid admin credentials'
          };
        } catch (error) {
          console.error('Admin login error:', error);
          return {
            success: false,
            message: 'Admin login failed. Please check your connection and try again.'
          };
        }
      },

      sellerRegister: async (userData) => {
        try {
          const response = await api.sellerRegister(userData);

          if (response.success) {
            return { success: true };
          }

          console.error('Seller registration failed:', response.message);
          return {
            success: false,
            message: response.message || 'Registration failed. Please try again.'
          };
        } catch (error) {
          console.error('Seller registration error:', error);
          return {
            success: false,
            message: 'Registration failed. Please check your connection and try again.'
          };
        }
      },

      register: async (userData) => {
        try {
          const response = await api.register(userData);

          if (response.success) {
            // Don't automatically log in after registration
            // Just return success to redirect to login page
            return { success: true };
          }

          console.error('Registration failed:', response.message);
          return {
            success: false,
            message: response.message || 'Registration failed. Please try again.'
          };
        } catch (error) {
          console.error('Registration error:', error);
          return {
            success: false,
            message: 'Registration failed. Please check your connection and try again.'
          };
        }
      },

      forgotPassword: async (email) => {
        try {
          const response = await api.forgotPassword(email);
          return { success: response.success, message: response.message };
        } catch (error) {
          return { success: false, message: 'An error occurred.' };
        }
      },

      resetPassword: async (token, password) => {
        try {
          const response = await api.resetPassword(token, password);
          return { success: response.success, message: response.message };
        } catch (error) {
          return { success: false, message: 'An error occurred.' };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: (userData) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await api.getCurrentUser();
            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
                token
              });
            } else {
              // Token is invalid or expired, clear it
              localStorage.removeItem('token');
              set({
                user: null,
                isAuthenticated: false,
                token: null
              });
            }
          } catch (error) {
            console.warn('Auth initialization failed (this is normal if server is not running):', error.message);
            // Clear auth state on error but don't throw
            localStorage.removeItem('token');
            set({
              user: null,
              isAuthenticated: false,
              token: null
            });
          }
        } else {
          // No token, set default state
          set({
            user: null,
            isAuthenticated: false,
            token: null
          });
        }
      },

      setAuth: (user: User, token: string) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
