import apiClient from './apiClient';

// ── Leads ────────────────────────────────────────────────────────────────────

export const getAdminLeads = async (params = {}) => {
  const res = await apiClient.get('/admin/leads', { params });
  return res.data;
};

export const getAdminProspects = async (params = {}) => {
  const res = await apiClient.get('/admin/leads/prospects', { params });
  return res.data;
};

export const getAdminFollowUps = async (params = {}) => {
  const res = await apiClient.get('/admin/leads/followups', { params });
  return res.data;
};

export const getAdminDump = async (params = {}) => {
  const res = await apiClient.get('/admin/leads/dump', { params });
  return res.data;
};

// ── Sales ─────────────────────────────────────────────────────────────────────

export const getAdminSalesAnalytics = async () => {
  const res = await apiClient.get('/admin/sales/analytics');
  return res.data;
};

export const getAdminSalesTargets = async (params = {}) => {
  const res = await apiClient.get('/admin/sales/targets', { params });
  return res.data;
};
