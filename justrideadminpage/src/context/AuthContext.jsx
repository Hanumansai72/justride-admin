import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/services';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const role = currentUser?.role;
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate session on mount with /api/admin/me
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const token = api.getToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        if (!response?.success || !['ADMIN', 'HELPER'].includes(response.data?.role)) throw new Error('Invalid staff session.');
        if (isMounted) setCurrentUser(response.data);
      } catch (err) {
        if (isMounted) setAuthError('Could not verify your session. Please sign in again.');
        if (err.status === 401) {
          api.clearSession();
          if (isMounted) {
            setCurrentUser(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifySession();

    // Listen for unauthorized events from api client
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const payload = {
        identifier: identifier.trim(),
        password,
      };
      const response = await authApi.login(payload);

      if (response?.success && response.accessToken && ['ADMIN', 'HELPER'].includes(response.data?.role)) {
        const user = response.data;
        const accessToken = response.accessToken;

        api.setToken(accessToken);
        setCurrentUser(user);
        return { success: true, user, role: user.role };
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed. Please check credentials.';
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      api.clearSession();
      setCurrentUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response?.success && response?.data) {
        setCurrentUser(response.data);
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  }, []);

  const value = {
    user: currentUser,
    currentUser,
    role,
    isAuthenticated: !!currentUser,
    isLoading,
    authError,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
