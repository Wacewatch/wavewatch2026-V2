import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  withCredentials: true,
});

let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingRequests = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest ||
      originalRequest.url?.includes('/api/auth/refresh') ||
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/register') ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isNetworkError = !error.response;
    const isAuthError = status === 401;

    if (!isAuthError && !isNetworkError) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      })
        .then(() => API(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const { data } = await API.post('/api/auth/refresh');
      if (data?.token) {
        localStorage.setItem('ww_token', data.token);
      }
      processQueue(null);
      return API(originalRequest);
    } catch (refreshError) {
      if (!refreshError.response) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      }
      processQueue(refreshError);
      localStorage.removeItem('ww_token');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
export const TMDB_IMG = 'https://image.tmdb.org/t/p';
