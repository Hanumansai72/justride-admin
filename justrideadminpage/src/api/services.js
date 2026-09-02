/**
 * api/services.js
 * Domain-driven API services connecting the Frontend UI to JustRide Backend endpoints.
 */
import api from './client';

// ── 1. Authentication & Profile Services ─────────────────────────────
export const authApi = {
  login: (credentials) => api.post('/admin/login', credentials),
  getProfile: () => api.get('/admin/me'),
  updateCredentials: (data) => api.put('/admin/credentials', data),
  logout: () => {
    api.clearSession();
    return Promise.resolve({ success: true });
  },
};

// ── 2. Dashboard & System Health Services ────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getHealth: () => api.get('/admin/dashboard/health'),
};

// ── 3. User Management Services ──────────────────────────────────────
export const usersApi = {
  getUsers: (params = {}) => api.get('/admin/users', params),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateStatus: (id, status, reason = '') =>
    api.patch(`/admin/users/${id}/status`, { status, reason }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserActivity: (id) => api.get(`/admin/users/${id}/activity`),
};

// ── 4. Helper / Support Staff Management Services ────────────────────
export const helpersApi = {
  getHelpers: (params = {}) => api.get('/admin/helpers', params),
  getHelperById: (id) => api.get(`/admin/helpers/${id}`),
  createHelper: (data) => api.post('/admin/helpers', data),
  updateStatus: (id, status, reason = '', role) =>
    api.patch(`/admin/helpers/${id}/status`, { status, status_reason: reason, role }),
  deleteHelper: (id) => api.delete(`/admin/helpers/${id}`),
};

// ── 5. Device Fleet & Hardware Services ──────────────────────────────
export const devicesApi = {
  getDevices: (params = {}) => api.get('/admin/devices', params),
  getDeviceById: (id) => api.get(`/admin/devices/${id}`),
  registerDevice: (data) => api.post('/admin/devices', data),
  updateDevice: (id, data) => api.put(`/admin/devices/${id}`, data),
  blockDevice: (id, reason = '') => api.patch(`/admin/devices/${id}/block`, { reason }),
  unblockDevice: (id) => api.patch(`/admin/devices/${id}/unblock`),
  forceUnlink: (id, reason = '') => api.patch(`/admin/devices/${id}/force-unlink`, { reason }),
  retireDevice: (id, reason = '') => api.patch(`/admin/devices/${id}/retire`, { reason }),
};

// ── 6. Pairing & Bluetooth Operations ────────────────────────────────
export const pairingApi = {
  getPairingLogs: (params = {}) => api.get('/admin/pairing', params),
  forceUnpair: (id, reason = '') => api.patch(`/admin/pairing/${id}/force-unpair`, { reason }),
};

// ── 7. Firmware Rollout & Lifecycle Services ─────────────────────────
export const firmwareApi = {
  getReleases: (params = {}) => api.get('/admin/firmware', params),
  createRelease: (data) => api.post('/admin/firmware', data),
  updateRelease: (id, data) => api.put(`/admin/firmware/${id}`, data),
  deleteRelease: (id) => api.delete(`/admin/firmware/${id}`),
};

// ── 7B. Mobile App APK Releases & Lifecycle Services ──────────────────
export const appReleasesApi = {
  getReleases: (params = {}) => api.get('/admin/app-releases', params),
  createRelease: (data) => api.post('/admin/app-releases', data),
  updateRelease: (id, data) => api.put(`/admin/app-releases/${id}`, data),
  deleteRelease: (id) => api.delete(`/admin/app-releases/${id}`),
};

// ── 8. Support Tickets & Troubleshooting Services ────────────────────
export const supportApi = {
  getTickets: (params = {}) => api.get('/admin/support', params),
  getTicketById: (id) => api.get(`/admin/support/${id}`),
  updateTicket: (id, data) => api.patch(`/admin/support/${id}`, data),
  blockDeviceFromTicket: (id, reason = '') =>
    api.post(`/admin/support/${id}/block-device`, { reason }),
  forceUnlinkDeviceFromTicket: (id) =>
    api.post(`/admin/support/${id}/force-unlink-device`),
};

// ── 9. Staff Notifications & Live Alerts ─────────────────────────────
export const notificationsApi = {
  getNotifications: (params = {}) => api.get('/admin/notifications', params),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllRead: () => api.patch('/admin/notifications/mark-all-read'),
};

// ── 10. Audit Logs & System Activity ─────────────────────────────────
export const auditApi = {
  getLogs: (params = {}) => api.get('/admin/audit-logs', params),
  getLogById: (id) => api.get(`/admin/audit-logs/${id}`),
  getStats: () => api.get('/admin/audit-logs/stats'),
};
