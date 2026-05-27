import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  chatOpen: boolean;
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  setChat: (open: boolean) => void;
  hydrate: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  chatOpen: false,

  hydrate: () => {
    const stored = (localStorage.getItem('sgpt_theme') as 'light' | 'dark' | null) || 'light';
    set({ theme: stored });
    if (stored === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setTheme: (t) => {
    localStorage.setItem('sgpt_theme', t);
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ theme: t });
  },

  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  toggleChat: () => set({ chatOpen: !get().chatOpen }),
  setChat: (open) => set({ chatOpen: open }),
}));
