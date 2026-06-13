/**
 * salesTargetService.js
 * API client for the Sales Target feature.
 * Used by both TL (CRUD) and SE (read-only).
 */
import apiClient from './apiClient';

const BASE = '/targets';

const salesTargetService = {
  // ── TL ───────────────────────────────────────────────────────────────────

  /** Fetch executives in TL's team */
  getTeamMembers: () =>
    apiClient.get(`${BASE}/tl/team-members`).then(r => r.data.data),

  /**
   * Fetch all team targets for a given month/year
   * @param {number} month 1-12
   * @param {number} year  e.g. 2026
   */
  getTeamTargets: (month, year) =>
    apiClient
      .get(`${BASE}/tl/team`, { params: { month, year } })
      .then(r => r.data.data),

  /**
   * Create a monthly target for a team member
   * @param {object} payload { userId, month, year, targetCalls, targetSales, targetRevenue, notes }
   */
  createTarget: (payload) =>
    apiClient.post(`${BASE}/tl`, payload).then(r => r.data.data),

  /**
   * Update target values or achieved progress
   * @param {string} id target _id
   * @param {object} payload fields to update
   */
  updateTarget: (id, payload) =>
    apiClient.put(`${BASE}/tl/${id}`, payload).then(r => r.data.data),

  /** Delete a target */
  deleteTarget: (id) =>
    apiClient.delete(`${BASE}/tl/${id}`).then(r => r.data),

  /** Sync achieved values from live Lead data */
  syncProgress: () =>
    apiClient.post(`${BASE}/sync`).then(r => r.data),

  // ── SE ───────────────────────────────────────────────────────────────────

  /**
   * Fetch SE's own targets for a given month/year
   * @param {number} month 1-12
   * @param {number} year  e.g. 2026
   */
  getMyTargets: (month, year) =>
    apiClient
      .get(`${BASE}/se/my`, { params: { month, year } })
      .then(r => r.data.data),
};

export default salesTargetService;
