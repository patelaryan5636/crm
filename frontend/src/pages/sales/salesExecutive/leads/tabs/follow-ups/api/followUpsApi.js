/**
 * Follow-Ups API — Sales Executive
 * Backend: /api/sales-executive/follow-ups
 */
import apiClient from '../../../../../../../services/apiClient';

/**
 * Fetch all follow-up reminders for the current Sales Executive.
 * @param {Object} params  Optional: { type, status, dateFrom, dateTo }
 * @returns {Promise<{ reminders: Array, stats: Object }>}
 */
export const fetchFollowUps = async (params = {}) => {
  const { data } = await apiClient.get('/sales-executive/follow-ups', { params });
  return data.data; // { reminders, stats }
};

/**
 * Mark a follow-up reminder as done.
 * @param {string} id  Reminder _id
 * @returns {Promise<Object>}
 */
export const markFollowUpDone = async (id) => {
  const { data } = await apiClient.patch(`/sales-executive/follow-ups/${id}/done`);
  return data.data;
};
