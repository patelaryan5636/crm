import apiClient from './apiClient';

export const getAdminLeads = async (params = {}) => {
  const response = await apiClient.get('/admin/leads', {
    params,
  });

  return response.data;
};
