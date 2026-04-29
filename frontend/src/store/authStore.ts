import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'teacher' | 'student';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user:  AuthUser | null;
  setAuth:  (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user:  null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      clearAuth: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      isTeacher: () => get().user?.role === 'teacher',
      isStudent: () => get().user?.role === 'student',
    }),
    { name: 'edtech-auth', partialize: state => ({ token: state.token, user: state.user }) }
  )
);
