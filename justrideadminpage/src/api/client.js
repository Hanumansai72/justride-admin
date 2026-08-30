/**
 * api/client.js
 * Scalable HTTP client with cookie-based credential handling, interceptors, and error normalization.
 */
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenCookieName = 'justride_admin_token';
    this.userCookieName = 'justride_admin_user';
    this.roleCookieName = 'justride_admin_role';
  }

  getToken() {
    try {
      // First check cookies
      const token = Cookies.get(this.tokenCookieName);
      if (token) return token;
      // Fallback to localStorage
      return localStorage.getItem(this.tokenCookieName);
    } catch {
      return null;
    }
  }

  setToken(token) {
    try {
      const isHttps = window.location.protocol === 'https:';
      if (token) {
        Cookies.set(this.tokenCookieName, token, {
          expires: 7, // 7 days
          secure: isHttps,
          sameSite: 'lax',
          path: '/',
        });
        localStorage.setItem(this.tokenCookieName, token);
      } else {
        Cookies.remove(this.tokenCookieName, { path: '/' });
        localStorage.removeItem(this.tokenCookieName);
      }
    } catch (e) {
      console.error('Failed to set token in cookies/storage', e);
    }
  }

  getUser() {
    try {
      const userCookie = Cookies.get(this.userCookieName);
      if (userCookie) {
        return JSON.parse(decodeURIComponent(userCookie));
      }
      const stored = localStorage.getItem(this.userCookieName);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    try {
      const isHttps = window.location.protocol === 'https:';
      if (user) {
        const userStr = encodeURIComponent(JSON.stringify(user));
        Cookies.set(this.userCookieName, userStr, {
          expires: 7,
          secure: isHttps,
          sameSite: 'lax',
          path: '/',
        });
        localStorage.setItem(this.userCookieName, JSON.stringify(user));
      } else {
        Cookies.remove(this.userCookieName, { path: '/' });
        localStorage.removeItem(this.userCookieName);
      }
    } catch (e) {
      console.error('Failed to set user in cookies/storage', e);
    }
  }

  getRole() {
    try {
      return Cookies.get(this.roleCookieName) || localStorage.getItem(this.roleCookieName) || 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  }

  setRole(role) {
    try {
      const isHttps = window.location.protocol === 'https:';
      if (role) {
        Cookies.set(this.roleCookieName, role, {
          expires: 7,
          secure: isHttps,
          sameSite: 'lax',
          path: '/',
        });
        localStorage.setItem(this.roleCookieName, role);
      } else {
        Cookies.remove(this.roleCookieName, { path: '/' });
        localStorage.removeItem(this.roleCookieName);
      }
    } catch (e) {
      console.error('Failed to set role in cookies/storage', e);
    }
  }

  clearSession() {
    try {
      Cookies.remove(this.tokenCookieName, { path: '/' });
      Cookies.remove(this.userCookieName, { path: '/' });
      Cookies.remove(this.roleCookieName, { path: '/' });
      localStorage.removeItem(this.tokenCookieName);
      localStorage.removeItem(this.userCookieName);
      localStorage.removeItem(this.roleCookieName);
    } catch (e) {
      console.error('Failed to clear session from cookies', e);
    }
  }

  /**
   * Universal HTTP Request method
   */
  async request(endpoint, options = {}) {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
      window.location.origin
    );

    // Append query params if present
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const headers = {
      ...options.headers,
    };

    // Attach Bearer token if present
    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON content-type if body is an object and not FormData
    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const config = {
      method: options.method || 'GET',
      headers,
      body,
      credentials: 'include',
    };

    try {
      const response = await fetch(url.toString(), config);

      // Extract JSON or text response
      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle 401 Unauthorized Session Expired
        if (response.status === 401 && !endpoint.includes('/login')) {
          this.clearSession();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        const errorMessage =
          data?.message ||
          (typeof data === 'string' && data) ||
          `Request failed with status ${response.status} (${response.statusText})`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Re-throw with consistent structure
      if (!error.status && error.name === 'TypeError') {
        error.message = 'Network error: Backend server is unreachable. Please ensure the backend is running.';
      }
      throw error;
    }
  }

  get(endpoint, params = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
