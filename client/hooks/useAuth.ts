'use client';

import { createContext, useContext, useState, useEffect, createElement } from 'react';
import { apiClient, User, LoginData, RegisterData } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = apiClient.getCurrentUser();
        const token = apiClient.getToken();
        if (storedUser && token) {
          try {
            const profile = await apiClient.getProfile();
            setUser(profile.data);
            apiClient.setCurrentUser(profile.data);
          } catch (profileError) {
            console.error('Profile fetch failed, clearing auth:', profileError);
            apiClient.clearTokens();
            apiClient.clearCurrentUser();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        apiClient.clearTokens();
        apiClient.clearCurrentUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    const response = await apiClient.login(data);
    setUser(response.data.user);
    apiClient.setCurrentUser(response.data.user);
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.register(data);
    setUser(response.data.user);
    apiClient.setCurrentUser(response.data.user);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      apiClient.clearCurrentUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await apiClient.getProfile();
      setUser(profile.data);
      apiClient.setCurrentUser(profile.data);
    } catch (error) {
      await logout();
    }
  };

  const contextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
