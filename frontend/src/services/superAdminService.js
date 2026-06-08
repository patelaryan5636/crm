/**
 * SUPER ADMIN SERVICE — API layer for Super Admin operations
 */
import apiClient from './apiClient';

const BASE = '/superadmin';

export const getAllAdmins = async (params = {}) => {
  const { data } = await apiClient.get(`${BASE}/admins`, { params });
  return data.data;
};

export const createAdmin = async (adminData) => {
  const { data } = await apiClient.post(`${BASE}/admins`, adminData);
  return data.data;
};

export const getAdminById = async (id) => {
  const { data } = await apiClient.get(`${BASE}/admins/${id}`);
  return data.data;
};

export const toggleAdminStatus = async (id, isActive) => {
  const { data } = await apiClient.patch(`${BASE}/admins/${id}/status`, { isActive });
  return data.data;
};

// ─── Support Tickets ────────────────────────────────────────────────────────
export const getSupportTickets = async (params = {}) => {
  const { data } = await apiClient.get(`${BASE}/support-tickets`, { params });
  return data.data;
};

export const updateTicketStatus = async (id, status, resolutionMessage = '') => {
  const { data } = await apiClient.patch(`${BASE}/support-tickets/${id}/status`, { 
    status, 
    resolutionMessage 
  });
  return data.data;
};

export const getAdminLoginLogs = async () => {
  const { data } = await apiClient.get(`${BASE}/admin-login-logs`);
  return data.data;
};
