import apiClient from "../../../../services/apiClient";

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (typeof error?.message === "string" && error.message.trim()) return error.message;
  return fallback;
};

export const fetchMyProspects = async () => {
  const response = await apiClient.get("/sales-executive/prospects");
  if (response.data?.data) {
    return response.data.data;
  }
  throw new Error("Invalid server response for prospects");
};

export const fetchProspectById = async (prospectId) => {
  const response = await apiClient.get(`/sales-executive/prospects/${prospectId}`);
  if (response.data?.data) {
    return response.data.data;
  }
  throw new Error("Invalid server response for prospect details");
};

export const updateProspect = async (prospectId, payload) => {
  const response = await apiClient.put(`/sales-executive/prospects/${prospectId}`, payload);
  if (response.data?.data) {
    return response.data.data;
  }
  throw new Error("Invalid server response for prospect update");
};

export { getErrorMessage };
