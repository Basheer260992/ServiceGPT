import { create } from 'zustand';
import type { User } from '@/types';
import { AuthService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string; department?: string }) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  hydrate: () => {
    const token = localStorage.getItem('sgpt_token');
    const rawUser = localStorage.getItem('sgpt_user');
    if (token && rawUser) {
      try { set({ token, user: JSON.parse(rawUser) }); } catch { /* noop */ }
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await AuthService.login(email, password);
      localStorage.setItem('sgpt_token', token);
      localStorage.setItem('sgpt_user', JSON.stringify(user));
      set({ token, user });
    } finally {
      set({ loading: false });
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const { token, user } = await AuthService.register(data);
      localStorage.setItem('sgpt_token', token);
      localStorage.setItem('sgpt_user', JSON.stringify(user));
      set({ token, user });
    } finally {
      set({ loading: false });
    }
  },

  guestLogin: async () => {
    set({ loading: true });
    try {
      const { token, user } = await AuthService.guest();
      localStorage.setItem('sgpt_token', token);
      localStorage.setItem('sgpt_user', JSON.stringify(user));
      set({ token, user });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('sgpt_token');
    localStorage.removeItem('sgpt_user');
    set({ token: null, user: null });
  },

  setUser: (user) => {
    localStorage.setItem('sgpt_user', JSON.stringify(user));
    set({ user });
  },
}));
