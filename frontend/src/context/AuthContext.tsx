import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile } from '../types/auth';
import { authApi, tokenStorage, ApiError } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { display_name?: string; experience_level?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = tokenStorage.get();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err) {
      // If token expired or invalid, purge local session
      if (err instanceof ApiError && (err.status === 401 || err.code === 'UNAUTHORIZED')) {
        tokenStorage.remove();
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const authData = await authApi.login({ email, password });
    tokenStorage.set(authData.token);
    setToken(authData.token);
    await fetchCurrentUser();
  };

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    const authData = await authApi.register({
      email,
      username,
      password,
      display_name: displayName
    });
    tokenStorage.set(authData.token);
    setToken(authData.token);
    await fetchCurrentUser();
  };

  const logout = () => {
    tokenStorage.remove();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { display_name?: string; experience_level?: string }) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
