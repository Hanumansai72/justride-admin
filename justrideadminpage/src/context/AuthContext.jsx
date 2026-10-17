import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/services';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const role = currentUser?.role;
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);

  const verifySession = useCallback(async (signal) => {
      setIsLoading(true);
      setAuthError(null);
      setSessionUnavailable(false);
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile({ signal });
        if (!response?.success || !['ADMIN', 'HELPER'].includes(response.data?.role)) throw new Error('Invalid staff session.');
        if (!signal?.aborted) setCurrentUser(response.data);
      } catch (err) {
        if (signal?.aborted) return;
        setAuthError(err.message || 'Could not verify your session.');
        if (err.status === 401) {
          api.clearSession();
          setCurrentUser(null);
        } else if (err.status !== 403) {
          setSessionUnavailable(true);
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
  }, []);

  // Keep authorization checks mandatory, with cancellation and a retryable service state.
  useEffect(() => {
    const controller = new AbortController();
    verifySession(controller.signal);

    // Listen for unauthorized events from api client
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setSessionUnavailable(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      controller.abort();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [verifySession]);

  const login = useCallback(async ({ identifier, password }) => {
    setIsLoading(true);
    setAuthError(null);
    setSessionUnavailable(false);
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
      setSessionUnavailable(false);
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
    sessionUnavailable,
    retrySession: verifySession,
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
