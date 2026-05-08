import api from "./api";

export const login = async (credentials: any) => {
  const response = await api.post("/auth/login", credentials);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const signup = async (userData: any) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

export const getGoogleAuthUrl = async () => {
  const response = await api.get("/auth/google/url");
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!user || !token) return null;
  try {
    return JSON.parse(user);
  } catch (e) {
    return null;
  }
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

export const updateProfile = async (profileData: any) => {
  const response = await api.put("/auth/profile", profileData);
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const uploadImage = async (formData: FormData) => {
  const response = await api.post("/auth/upload", formData);
  return response.data;
};

export const changePassword = async (passwordData: any) => {
  const response = await api.post("/auth/change-password", passwordData);
  return response.data;
};
