import axios from 'axios';
import { SESSION_STORAGE_KEY, SEVADAR_NAME_KEY, ADMIN_PROFILE_KEY } from './constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

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
