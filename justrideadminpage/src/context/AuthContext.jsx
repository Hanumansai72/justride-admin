import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/services';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => api.getUser());
  const [role, setRoleState] = useState(() => {
    const savedRole = api.getRole();
    const user = api.getUser();
    if (user?.role === 'ADMIN') return 'ADMIN';
    if (user?.role === 'HELPER' || user?.employee_id) return 'HELPER';
    return savedRole || 'ADMIN';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const setRole = useCallback((newRole) => {
    const normalized = (newRole || 'ADMIN').toUpperCase();
    setRoleState(normalized);
    api.setRole(normalized);
  }, []);

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
        if (isMounted && response?.success && response?.data) {
          const user = response.data;
          setCurrentUser(user);
          api.setUser(user);
          const computedRole = user.role === 'ADMIN' ? 'ADMIN' : 'HELPER';
          setRole(computedRole);
        }
      } catch (err) {
        console.warn('Session verification failed, continuing with cached session or logout', err.message);
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
      setRole('ADMIN');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [setRole]);

  const login = useCallback(async ({ identifier, password, role: requestedRole }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const payload = {
        identifier: identifier.trim(),
        password,
      };
      const response = await authApi.login(payload);

      if (response?.success && response?.data) {
        const user = response.data;
        const accessToken = response.accessToken;

        api.setToken(accessToken);
        api.setUser(user);

        setCurrentUser(user);
        const resolvedRole = user.role === 'ADMIN' ? 'ADMIN' : 'HELPER';
        setRole(resolvedRole);
        return { success: true, user, role: resolvedRole };
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
  }, [setRole]);

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
        api.setUser(response.data);
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  }, []);

  const value = {
    user: currentUser,
    currentUser,
    role,
    setRole,
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
