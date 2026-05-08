import api from "./api";

export const getInventory = async () => {
  const response = await api.get("/inventory");
  return response.data;
};

export const createInventoryItem = async (item: any) => {
  const response = await api.post("/inventory", item);
  return response.data;
};

export const updateInventoryItem = async (id: string, item: any) => {
  const response = await api.put(`/inventory/${id}`, item);
  return response.data;
};

export const deleteInventoryItem = async (id: string) => {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};
