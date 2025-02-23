// src/store/authStore.ts
import { create } from 'zustand';
import Cookies from 'js-cookie';

interface AuthState {
  user: { id: string; name: string; email: string; image: string } | null;
  token: string | null;
  login: (user: any, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    set({ user, token });
    Cookies.set('authToken', token, { expires: 1 / 24, sameSite: 'strict' }); // 1 hour (1/24 of a day)
  },
  logout: () => {
    set({ user: null, token: null });
    Cookies.remove('authToken');
  },
  isAuthenticated: () => {
    const token = Cookies.get('authToken');
    if (token) {
      try {
        // Optionally verify the token (e.g., check expiration)
        return true;
      } catch (error) {
        Cookies.remove('authToken');
        return false;
      }
    }
    return false;
  },
}));