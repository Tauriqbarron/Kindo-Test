import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import * as api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('auth_token'));

  useEffect(() => {
    if (token) {
      api.fetchMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const loginFn = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    localStorage.setItem('auth_token', response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signupFn = useCallback(async (firstName: string, lastName: string, email: string, password: string) => {
    const response = await api.signup({ first_name: firstName, last_name: lastName, email, password });
    localStorage.setItem('auth_token', response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logoutFn = useCallback(() => {
    api.logout().catch(() => {});
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login: loginFn,
      signup: signupFn,
      logout: logoutFn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
