import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark;
        set({ dark: next });
        if (next) document.documentElement.classList.add('dark');
        else      document.documentElement.classList.remove('dark');
      },
    }),
    { name: 'eq-theme' }
  )
);

// Apply on load
export function initTheme() {
  const stored = localStorage.getItem('eq-theme');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.dark) document.documentElement.classList.add('dark');
    } catch { /* ignore */ }
  }
}
