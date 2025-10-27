import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    isAdmin: false
  });

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/auth/me', { 
        credentials: 'include',
        method: 'GET'
      });
      
      if (response.ok) {
        const user = await response.json();
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
          isAdmin: user.role === 'admin'
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isAdmin: false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isAdmin: false
      });
    }
  };

  const login = () => {
    window.location.href = '/auth/signin';
  };

  const logout = async () => {
    try {
      window.location.href = '/auth/signout';
    } catch (error) {
      console.error('Error during logout:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isAdmin: false
      });
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshUser
  } as AuthContextType;
}