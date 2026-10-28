/**
 * api/services.js
 * Domain-driven API services connecting the Frontend UI to JustRide Backend endpoints.
 */
import api from './client';

// ── 1. Authentication & Profile Services ─────────────────────────────
export const authApi = {
  login: (credentials) => api.post('/admin/login', credentials),
  getProfile: (options = {}) => api.get('/admin/me', {}, options),
  requestPasswordOtp: (currentPassword) => api.post('/admin/profile/password/otp', { currentPassword }),
  changePassword: (data) => api.post('/admin/profile/password', data),
  updateCredentials: (data) => api.put('/admin/credentials', data),
  logout: () => api.post('/admin/logout'),
  recordActivity: (event, path) => api.post('/admin/activity', { event, path }),
};

// ── 2. Dashboard & System Health Services ────────────────────────────
export const dashboardApi = {
  getStats: (options = {}) => api.get('/admin/dashboard/stats', {}, options),
  getHealth: (options = {}) => api.get('/admin/dashboard/health', {}, options),
};

// ── 3. User Management Services ──────────────────────────────────────
export const usersApi = {
  getUsers: (params = {}, options = {}) => api.get('/admin/users', params, options),
  getUserById: (id, options = {}) => api.get(`/admin/users/${id}`, {}, options),
  updateStatus: (id, status, reason = '') =>
    api.patch(`/admin/users/${id}/status`, { status, reason }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserActivity: (id, options = {}) => api.get(`/admin/users/${id}/activity`, {}, options),
};

export const interestApi = {
  getUsers: (page = 1, options = {}) => api.get('/early-interest', { page, limit: 10 }, options),
};

// ── 4. Helper / Support Staff Management Services ────────────────────
export const helpersApi = {
  getHelpers: (params = {}, options = {}) => api.get('/admin/helpers', params, options),
  getHelperById: (id, options = {}) => api.get(`/admin/helpers/${id}`, {}, options),
  createHelper: (data) => api.post('/admin/helpers', data),
  updateStatus: (id, status, reason = '', role) =>
    api.patch(`/admin/helpers/${id}/status`, { status, status_reason: reason, role }),
  deleteHelper: (id) => api.delete(`/admin/helpers/${id}`),
};

// ── 5. Device Fleet & Hardware Services ──────────────────────────────
export const devicesApi = {
  getDevices: (params = {}, options = {}) => api.get('/admin/devices', params, options),
  getDeviceById: (id, options = {}) => api.get(`/admin/devices/${id}`, {}, options),
  registerDevice: (data) => api.post('/admin/devices', data),
  updateDevice: (id, data) => api.put(`/admin/devices/${id}`, data),
  blockDevice: (id, reason = '') => api.patch(`/admin/devices/${id}/block`, { reason }),
  unblockDevice: (id) => api.patch(`/admin/devices/${id}/unblock`),
  forceUnlink: (id, reason = '') => api.patch(`/admin/devices/${id}/force-unlink`, { reason }),
  retireDevice: (id, reason = '') => api.patch(`/admin/devices/${id}/retire`, { reason }),
};

// ── 6. Pairing & Bluetooth Operations ────────────────────────────────
export const pairingApi = {
  getPairingLogs: (params = {}, options = {}) => api.get('/admin/pairing', params, options),
  forceUnpair: (id, reason = '') => api.patch(`/admin/pairing/${id}/force-unpair`, { reason }),
};

// ── 7. Firmware Rollout & Lifecycle Services ─────────────────────────
export const firmwareApi = {
  getReleases: (params = {}, options = {}) => api.get('/admin/firmware', params, options),
  createRelease: (data) => api.post('/admin/firmware', data),
  updateRelease: (id, data) => api.put(`/admin/firmware/${id}`, data),
  featureRelease: (id) => api.patch(`/admin/firmware/${id}/feature`),
  deleteRelease: (id) => api.delete(`/admin/firmware/${id}`),
};

// ── 7B. Mobile App APK Releases & Lifecycle Services ──────────────────
export const appReleasesApi = {
  getReleases: (params = {}, options = {}) => api.get('/admin/app-releases', params, options),
  getUploadUrl: (data) => api.post('/admin/app-releases/upload-url', data),
  createRelease: (data) => api.post('/admin/app-releases', data),
  updateRelease: (id, data) => api.put(`/admin/app-releases/${id}`, data),
  featureRelease: (id) => api.patch(`/admin/app-releases/${id}/feature`),
  deleteRelease: (id) => api.delete(`/admin/app-releases/${id}`),
};

// ── 8. Support Tickets & Troubleshooting Services ────────────────────
export const supportApi = {
  getHelpFeedback: (params = {}, options = {}) => api.get('/admin/support/help-feedback', params, options),
  getTickets: (params = {}, options = {}) => api.get('/admin/support', params, options),
  getTicketById: (id, options = {}) => api.get(`/admin/support/${id}`, {}, options),
  updateTicket: (id, data) => api.patch(`/admin/support/${id}`, data),
  blockDeviceFromTicket: (id, reason = '') =>
    api.post(`/admin/support/${id}/block-device`, { reason }),
  forceUnlinkDeviceFromTicket: (id) =>
    api.post(`/admin/support/${id}/force-unlink-device`),
};

// ── 9. Staff Notifications & Live Alerts ─────────────────────────────
export const notificationsApi = {
  getNotifications: (params = {}, options = {}) => api.get('/admin/notifications', params, options),
  getUnreadCount: (options = {}) => api.get('/admin/notifications/unread-count', {}, options),
  markRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllRead: () => api.patch('/admin/notifications/mark-all-read'),
};

// ── 10. Audit Logs & System Activity ─────────────────────────────────
export const auditApi = {
  getLogs: (params = {}, options = {}) => api.get('/admin/audit-logs', params, options),
  getLogById: (id, options = {}) => api.get(`/admin/audit-logs/${id}`, {}, options),
  getStats: (params = {}, options = {}) => api.get('/admin/audit-logs/stats', params, options),
};
