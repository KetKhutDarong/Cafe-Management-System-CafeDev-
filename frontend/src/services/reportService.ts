import api from "./api";

export const getSalesReport = async (params?: any) => {
  const response = await api.get("/reports/sales", { params });
  return response.data;
};

export const getPopularItems = async () => {
  const response = await api.get("/reports/popular-items");
  return response.data;
};

export const getStaffPerformance = async () => {
  const response = await api.get("/reports/staff-performance");
  return response.data;
};

export const seedSampleData = async (params?: any) => {
  const response = await api.post("/reports/seed", null, { params });
  return response.data;
};

export const clearAllData = async () => {
  const response = await api.delete("/reports/clear");
  return response.data;
};

export const getInventoryUsage = async () => {
  const response = await api.get("/reports/inventory-usage");
  return response.data;
};
