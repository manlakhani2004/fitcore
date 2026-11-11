import { create } from 'zustand';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  login: (user: any, token?: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: any) => void;
}

const USER_KEY = 'fitcore_user';

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>()((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },
  logout: async () => {
    try {
      // Call backend to clear httpOnly cookies
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
    set({ user: null, isAuthenticated: false });
  },
  setAccessToken: (token) => {
    // No-op since we use httpOnly cookies
  },
  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },
}));
