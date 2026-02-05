import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authAPI } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          const response = await authAPI.getMe();
          setState({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
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
    try {
      const response = await authAPI.login(token);
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    const response = await authAPI.updateProfile(userData);
    setState(prev => ({
      ...prev,
      user: response.data.user,
    }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setState(prev => ({
        ...prev,
        user: response.data.user,
      }));
    } catch (error) {
      console.error('Refresh user error:', error);
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


