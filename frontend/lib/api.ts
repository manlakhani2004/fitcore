import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

// We rely entirely on httpOnly cookies sent via withCredentials: true
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Rely on cookies for tokens; update user state if provided in response
    if (response.data?.data?.role) {
      localStorage.setItem('fitcore_user', JSON.stringify(response.data.data));
    } else if (response.data?.user?.role) {
      localStorage.setItem('fitcore_user', JSON.stringify(response.data.user));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh-token')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh-token');
        if (res.data.success) {
          if (res.data.user) {
            localStorage.setItem('fitcore_user', JSON.stringify(res.data.user));
            useAuthStore.getState().setUser(res.data.user);
          }
          // Resume queue (cookies will be attached automatically)
          processQueue(null, '');
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 403) {
      // Don't toast role authorization errors - they're expected for protected routes
      return Promise.reject(error);
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    } else if (error.response?.status !== 401) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
