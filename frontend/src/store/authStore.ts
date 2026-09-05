import { create } from 'zustand';

export interface User {
  id: number;
  correo: string;
  nombre_completo: string;
  rol: 'ADMIN' | 'TECNICO' | 'AUDITOR';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let initialUser: User | null = null;
  const savedUser = localStorage.getItem('inventarios_user');
  const savedToken = localStorage.getItem('inventarios_token');

  if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
    try {
      initialUser = JSON.parse(savedUser);
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('inventarios_user');
    }
  }

  const validToken = (savedToken && savedToken !== 'undefined' && savedToken !== 'null') ? savedToken : null;

  return {
    user: initialUser,
    token: validToken,
    isAuthenticated: !!validToken,
    login: (token: string, user: User) => {
      if (token) {
        localStorage.setItem('inventarios_token', token);
      }
      if (user) {
        localStorage.setItem('inventarios_user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: !!token });
    },
    logout: () => {
      localStorage.removeItem('inventarios_token');
      localStorage.removeItem('inventarios_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
