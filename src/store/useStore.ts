import { create } from 'zustand';

interface AuthState {
  token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('auth_token'),
  role: localStorage.getItem('user_role'),
  setAuth: (token, role) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_role', role);
    set({ token, role });
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    set({ token: null, role: null });
  }
}));
