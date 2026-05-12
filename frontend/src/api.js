import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hireflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Auth error handling
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("hireflow_token");
      localStorage.removeItem("hireflow_user");
      window.dispatchEvent(new Event("auth-error"));
      return Promise.reject(error);
    }
    
    // Simple retry logic for network errors or 5xx
    if (!originalRequest._retry && (!error.response || error.response.status >= 500)) {
      originalRequest._retry = true;
      try {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
