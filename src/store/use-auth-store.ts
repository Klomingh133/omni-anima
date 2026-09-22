import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initializeAuth: () => Promise<User | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    set({ token });
  },

  initializeAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false, initialized: true });
      return null;
    }

    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) {
      set({ user: null, token: null, isLoading: false, initialized: true });
      return null;
    }

    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const userData = json.data?.user || json.data;
        set({ user: userData, token: savedToken, isLoading: false, initialized: true });
        return userData;
      } else {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isLoading: false, initialized: true });
        return null;
      }
    } catch {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isLoading: false, initialized: true });
      return null;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ user: null, token: null });
  },
}));
