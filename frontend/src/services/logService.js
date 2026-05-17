import apiClient from './apiClient';

const logService = {
  // GET /api/logs/login
  async getLoginLogs() {
    const response = await apiClient.get('/logs/login', { params: { _t: Date.now() } });
    return response.data;
  }
};

export default logService;
