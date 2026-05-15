/**
 * Dump Data API — Sales Executive
 * Fetches dump leads scoped to the logged-in executive + their admin tenant.
 * Backend: GET /api/sales-executive/leads/dump
 */
import apiClient from '../../../../../services/apiClient';

/**
 * Fetch dump leads for the current Sales Executive.
 * @param {Object} params - Optional query params
 * @param {number}  params.page
 * @param {number}  params.pageSize
 * @param {string}  params.search
 * @param {string}  params.reason
 * @param {string}  params.dateFrom  ISO date string
 * @param {string}  params.dateTo    ISO date string
 * @returns {Promise<{ leads: Array, stats: Object, pagination: Object }>}
 */
export const fetchDumpLeads = async (params = {}) => {
  const { data } = await apiClient.get('/sales-executive/leads/dump', { params });
  return data.data; // { leads, stats, pagination }
};
