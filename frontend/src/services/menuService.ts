import api from "./api";

export const getMenuItems = async () => {
  const response = await api.get("/menu/items");
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/menu/categories");
  return response.data;
};

export const createMenuItem = async (item: any) => {
  const response = await api.post("/menu/items", item);
  return response.data;
};

export const updateMenuItem = async (id: string, item: any) => {
  const response = await api.put(`/menu/items/${id}`, item);
  return response.data;
};

export const deleteMenuItem = async (id: string) => {
  const response = await api.delete(`/menu/items/${id}`);
  return response.data;
};
