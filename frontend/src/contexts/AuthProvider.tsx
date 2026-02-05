import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './authContext';
import type { User, AuthState, AuthContextType } from '@/types';

// AuthProvider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Mock API call - replace with your actual API
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setState({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('Authentication failed');
          }
        } catch {
          localStorage.removeItem('token');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (token: string) => {
    localStorage.setItem('token', token);
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch {
      localStorage.removeItem('token');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw new Error('Failed to login');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Optional: Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } finally {
      localStorage.removeItem('token');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    // Mock update - replace with your actual API
    setState((prev: AuthState) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setState((prev: AuthState) => ({
          ...prev,
          user: data.user,
        }));
      }
    } catch {
      // Ignore errors during refresh
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


