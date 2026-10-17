/**
 * api/client.js
 * Scalable HTTP client with cookie-based credential handling, interceptors, and error normalization.
 */
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://backend.justride.cc/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenCookieName = 'justride_admin_token';
    this.userCookieName = 'justride_admin_user';
    this.roleCookieName = 'justride_admin_role';
    this.pendingGets = new Map();
  }

  getToken() {
    try {
      return Cookies.get(this.tokenCookieName);
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
      } else {
        Cookies.remove(this.tokenCookieName, { path: '/' });
        localStorage.removeItem(this.tokenCookieName);
      }
    } catch (e) {
      console.error('Failed to set token in cookies/storage', e);
    }
  }

  clearSession() {
    this.pendingGets.clear();
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
    const fullUrl = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const url = new URL(fullUrl, window.location.origin);

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

    const controller = new AbortController();
    const cancel = () => controller.abort(options.signal?.reason);
    if (options.signal?.aborted) cancel();
    else options.signal?.addEventListener('abort', cancel, { once: true });
    let timedOut = false;
    const timeoutMs = options.timeoutMs ?? (body instanceof FormData ? 300000 : (options.method || 'GET') === 'GET' ? 15000 : 30000);
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const config = {
      method: options.method || 'GET',
      headers,
      body,
      credentials: 'include',
      signal: controller.signal,
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
        error.retryAfter = Number(response.headers.get('Retry-After')) || null;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (timedOut) {
        const timeout = new Error(config.method === 'GET'
          ? 'The request took too long. Please try again.'
          : 'The request took too long. Check whether your change was saved before trying again.');
        timeout.code = 'REQUEST_TIMEOUT';
        throw timeout;
      }
      // Re-throw with consistent structure
      if (!error.status && error.name === 'TypeError') {
        error.message = 'Network error: Backend server is unreachable. Please ensure the backend is running.';
      }
      throw error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
    }
  }

  get(endpoint, params = {}, options = {}) {
    if (options.signal) return this.request(endpoint, { ...options, method: 'GET', params });
    const key = JSON.stringify([endpoint, params, this.getToken(), options]);
    if (this.pendingGets.has(key)) return this.pendingGets.get(key);
    const pending = this.request(endpoint, { ...options, method: 'GET', params })
      .finally(() => { if (this.pendingGets.get(key) === pending) this.pendingGets.delete(key); });
    this.pendingGets.set(key, pending);
    return pending;
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
