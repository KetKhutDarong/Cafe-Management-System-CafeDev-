import api from "./api";

export interface Notification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = async (locationId?: string): Promise<Notification[]> => {
  const params = locationId ? { locationId } : {};
  const response = await api.get("/notifications", { params });
  return response.data.map((n: any) => ({
    ...n,
    id: n._id || n.id
  }));
};

export const markAsRead = async (id: string): Promise<Notification> => {
  const response = await api.put(`/notifications/${id}/read`);
  return {
    ...response.data,
    id: response.data._id || response.data.id
  };
};

export const markAllAsRead = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};

export const clearNotifications = async (): Promise<void> => {
  await api.delete("/notifications/clear");
};
