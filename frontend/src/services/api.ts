import axios from "axios";

const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.debug(`[API] Token found and added to request: ${config.url}`);
  } else if (config.url && !config.url.includes('/auth/login')) {
    // Only warn if token is missing for non-login requests
    console.warn(`[API] No token found for request to: ${config.url}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      console.error(`[API] 401 Unauthorized for ${error.config?.url}. Token in storage: ${token ? 'Present' : 'Missing'}`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Force a hard redirect to login page to clear potential stale React state
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
