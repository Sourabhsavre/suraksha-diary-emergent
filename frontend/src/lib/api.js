import axios from 'axios';
import { SESSION_STORAGE_KEY, SEVADAR_NAME_KEY, SEVADAR_DEVICE_KEY, ADMIN_PROFILE_KEY } from './constants';

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || runtimeOrigin;
export const API = `${BACKEND_URL.replace(/\/$/, '')}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem(SESSION_STORAGE_KEY);
  if (t) config.headers['X-Session-Token'] = t;
  return config;
});

// Auto-clear session on 401 — defence-in-depth so a stolen or expired token
// cannot linger. Combined with CSP in index.html this reduces XSS blast radius.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    }
    return Promise.reject(err);
  }
);

export const getSevadarName = () => localStorage.getItem(SEVADAR_NAME_KEY) || '';
export const setSevadarName = (n) => localStorage.setItem(SEVADAR_NAME_KEY, n);

export const getOrCreateSevadarDeviceId = () => {
  const existing = localStorage.getItem(SEVADAR_DEVICE_KEY);
  if (existing) return existing;

  const generated = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `sd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SEVADAR_DEVICE_KEY, generated);
  return generated;
};
