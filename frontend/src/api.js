import axios from "axios";

const DEFAULT_API_URL = "http://127.0.0.1:8000/api";

export function normalizeApiBaseUrl(value) {
  const rawValue = String(value || DEFAULT_API_URL).trim();
  const baseUrl = rawValue.replace(/\/+$/, "");

  if (!baseUrl) {
    return DEFAULT_API_URL;
  }

  if (/\/api$/i.test(baseUrl)) {
    return baseUrl;
  }

  try {
    const parsedUrl = new URL(baseUrl);
    if (parsedUrl.pathname === "/" || parsedUrl.pathname === "") {
      return `${baseUrl}/api`;
    }
  } catch {
    if (baseUrl === "/") {
      return "/api";
    }
  }

  return baseUrl;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
