/**
 * financeNotificationService.js
 * All API calls for Finance Notification Centre.
 */
import apiClient from './apiClient';

const BASE = '/finance/notifications';

const financeNotificationService = {
  /**
   * Get paginated notifications
   * @param {object} params { page, pageSize, type, status, priority, search }
   */
  getNotifications: (params = {}) =>
    apiClient.get(BASE, { params }).then(r => r.data.data),

  /** KPI summary counts */
  getSummary: () =>
    apiClient.get(`${BASE}/summary`).then(r => r.data.data),

  /** Mark single notification as read */
  markRead: (eventId) =>
    apiClient.patch(`${BASE}/${encodeURIComponent(eventId)}/read`).then(r => r.data),

  /** Mark all as read */
  markAllRead: () =>
    apiClient.patch(`${BASE}/read-all`).then(r => r.data),

  /** Dismiss (delete) a single notification */
  dismiss: (eventId) =>
    apiClient.delete(`${BASE}/${encodeURIComponent(eventId)}`).then(r => r.data),

  /** Clear all read notifications */
  clearAll: () =>
    apiClient.delete(`${BASE}/clear-all`).then(r => r.data),
};

export default financeNotificationService;
