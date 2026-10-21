import { create } from 'zustand';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: any) => void;
}

const USER_KEY = 'fitcore_user';

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, token) => {
    // token is no longer saved to localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: async () => {
    try {
      // Call backend to clear httpOnly cookies
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.removeItem(USER_KEY);
    set({ user: null, isAuthenticated: false });
  },
  setAccessToken: (token) => {
    // No-op since we use httpOnly cookies
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
}));
