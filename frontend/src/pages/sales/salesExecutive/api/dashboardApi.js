/**
 * Sales Executive Dashboard API
 * All calls are tenant + user scoped via JWT (handled by apiClient interceptor).
 */
import apiClient from "../../../../services/apiClient";

const BASE = "/sales-executive/dashboard";

const unwrap = (res) => {
  if (res?.data?.data !== undefined) return res.data.data;
  throw new Error(res?.data?.message || "Invalid server response");
};

export const fetchDashboardSummary = () =>
  apiClient.get(`${BASE}/summary`).then(unwrap);

export const fetchWeeklyTrend = () =>
  apiClient.get(`${BASE}/weekly-trend`).then(unwrap);

export const fetchProspectDistribution = () =>
  apiClient.get(`${BASE}/prospect-distribution`).then(unwrap);

export const fetchCallsVsConversion = () =>
  apiClient.get(`${BASE}/calls-vs-conversion`).then(unwrap);

export const fetchDailyTarget = () =>
  apiClient.get(`${BASE}/daily-target`).then(unwrap);

export const fetchRecentProspects = (params = {}) =>
  apiClient.get(`${BASE}/recent-prospects`, { params }).then(unwrap);

export const fetchUpcomingReminders = (limit = 3) =>
  apiClient.get(`${BASE}/upcoming-reminders`, { params: { limit } }).then(unwrap);
