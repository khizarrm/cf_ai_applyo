'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error('Failed to check session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await auth.signIn(email, password);
    setUser(response.user);
  };

  const loginAnonymously = async () => {
    const response = await auth.loginAnonymously();
    setUser(response.user);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const response = await auth.signUp(email, password, name);
    setUser(response.user);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  const refreshSession = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAnonymously,
        signup,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
