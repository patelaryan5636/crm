import apiClient from "./apiClient";

export const getDashboardData = () => {
  return apiClient.get("/finance/dashboard");
};

export const getQuickInsights = () => {
  return apiClient.get("/finance/dashboard/quick-insights");
};

export const getExpenses = () => {
  return apiClient.get("/finance/expenses");
};

export const getExpenseChart = () => {
  return apiClient.get("/finance/expenses/chart");
};

export const createExpense = (data) => {
  return apiClient.post("/finance/expenses", data);
};

export const updateExpense = (id, data) => {
  return apiClient.put(`/finance/expenses/${id}`, data);
};

export const deleteExpense = (id) => {
  return apiClient.delete(`/finance/expenses/${id}`);
};
