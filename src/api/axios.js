import axios from "axios";

export const API_BASE_URL = "/api";
export const DIRECT_BACKEND_URL = "https://id-management-api.runasp.net/api";

function attachInterceptors(instance) {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});
attachInterceptors(api);

// Bypasses the Vercel proxy — use this for requests carrying large files
// (photo/signature uploads), since Vercel serverless functions cap
// request bodies at 4.5MB regardless of your backend's own limits.
export const directApi = axios.create({
  baseURL: DIRECT_BACKEND_URL,
});
attachInterceptors(directApi);

export default api;