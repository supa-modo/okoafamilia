/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

// Normalize API URL to ensure it's properly formatted
const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) {
    return import.meta.env.DEV ? "/api" : "http://localhost:3001/api";
  }

  // If it's already a full URL (starts with http:// or https://), use it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  // If it looks like a domain (contains dots and no slashes at start), prepend https://
  if (url.includes(".") && !url.startsWith("/")) {
    return `https://${url}`;
  }

  // Otherwise, treat as relative path
  return url.startsWith("/") ? url : `/${url}`;
};

// Use relative URL when in development (Vite proxy handles it)
// Use absolute URL in production or if VITE_API_URL is explicitly set
const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // For FormData requests, don't set Content-Type - let axios set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't try to refresh token for login/register endpoints or if already retried
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register");

    // If error is 401 and we haven't retried yet and it's not an auth endpoint
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(
            new Error("Session expired. Please sign in again.")
          );
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // Update tokens in store
        const { user } = useAuthStore.getState();
        if (user) {
          useAuthStore
            .getState()
            .setAuth(user, newAccessToken, newRefreshToken);
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(
          new Error("Session expired. Please sign in again.")
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;
