/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { WalletService } from '../services/wallet.service';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Restore wallet state from localStorage first
      WalletService.restore();
      
      // Call /api/me which returns null user if not authenticated (no error)
      const response = await userService.getMe();
      
      if (response.user) {
        // User is authenticated - merge unread count into user object
        setUser({ 
          ...response.user, 
          unreadNotifications: response.unread || 0 
        });
      } else {
        // No active session - this is normal for first-time visitors
        setUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      // On error (network issue, server down), treat as no session
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verify(data);
      setUser({
        ...response.user,
        unreadNotifications: response.user?.unreadNotifications ?? 0,
      });
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await userService.getMe();
      if (response.user) {
        setUser({ 
          ...response.user, 
          unreadNotifications: response.unread || 0 
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('User refresh failed:', err);
      // Don't clear user on refresh failure - might be temporary network issue
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        updateUser,
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
