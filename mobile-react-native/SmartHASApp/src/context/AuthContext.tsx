import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { api, saveToken, clearToken } from '../config/api';
import { User, userFromMap } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  isGhost: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, address: string, password: string) => Promise<void>;
  loginAsGhost: () => void;
  logout: () => Promise<void>;
  updateUser: (patch: { name?: string; address?: string; profileImageUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGhost, setIsGhost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAuthResponse = useCallback(async (response: any) => {
    await saveToken(response.token);
    setCurrentUser(userFromMap(response.user));
    setIsGhost(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post('/auth/login', { email, password });
        await applyAuthResponse(response);
      } catch (e: any) {
        setError(e.message ?? String(e));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (name: string, email: string, address: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post('/auth/register', { name, email, address, password });
        await applyAuthResponse(response);
      } catch (e: any) {
        setError(e.message ?? String(e));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuthResponse]
  );

  const loginAsGhost = useCallback(() => {
    setCurrentUser({
      id: `ghost_${Date.now()}`,
      name: 'Visitante (Ghost)',
      email: 'ghost@conectada.com',
      address: 'Não informado',
      reputation: 0,
      totalTransactions: 0,
      isVerified: false,
    });
    setIsGhost(true);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setCurrentUser(null);
    setIsGhost(false);
  }, []);

  const updateUser = useCallback(
    async (patch: { name?: string; address?: string; profileImageUrl?: string }) => {
      if (!currentUser || isGhost) return;
      const response = await api.put('/users/me', patch, true);
      setCurrentUser(userFromMap(response));
    },
    [currentUser, isGhost]
  );

  const value = useMemo(
    () => ({
      currentUser,
      isGhost,
      isAuthenticated: currentUser != null,
      isLoading,
      error,
      login,
      register,
      loginAsGhost,
      logout,
      updateUser,
    }),
    [currentUser, isGhost, isLoading, error, login, register, loginAsGhost, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
