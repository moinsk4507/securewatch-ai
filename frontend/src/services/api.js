import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'sw_token';

export const tokenStorage = {
  set: (token, remember) => {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  },
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null,
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

const API = axios.create({ baseURL: BASE_URL, timeout: 10000 });

API.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Safe unwrap: if response body has {data: ...} envelope, return .data
// Otherwise return the raw body. Handles backend inconsistency.
export function unwrap(response) {
  const body = response.data;
  if (body && typeof body === 'object' && 'data' in body && 'status' in body) {
    return body.data;
  }
  return body;
}

export function getErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.detail) {
    const d = error.response.data.detail;
    if (Array.isArray(d)) return d[0]?.msg || 'Validation error';
    return typeof d === 'string' ? d : 'Validation error';
  }
  if (error.response?.status === 403) return 'You do not have permission for this action';
  if (error.response?.status === 404) return 'Resource not found';
  if (error.message === 'Network Error') return 'Cannot connect to server';
  return 'An unexpected error occurred';
}

export default API;
