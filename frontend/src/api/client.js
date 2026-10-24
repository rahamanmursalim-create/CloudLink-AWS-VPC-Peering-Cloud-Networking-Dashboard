import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Response interceptor — unwrap .data, surface errors cleanly
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Resources ────────────────────────────────────────────────────────────────
export const resourcesApi = {
  getAll:  (params) => client.get('/api/resources', { params }),
  getOne:  (id)     => client.get(`/api/resources/${id}`),
  create:  (body)   => client.post('/api/resources', body),
  update:  (id, body) => client.put(`/api/resources/${id}`, body),
  remove:  (id)     => client.delete(`/api/resources/${id}`),
};

// ─── Connectivity Tests ────────────────────────────────────────────────────────
export const connectivityApi = {
  getAll:  (params) => client.get('/api/connectivity', { params }),
  create:  (body)   => client.post('/api/connectivity', body),
  update:  (id, body) => client.put(`/api/connectivity/${id}`, body),
  remove:  (id)     => client.delete(`/api/connectivity/${id}`),
};

// ─── Stats ─────────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => client.get('/api/stats'),
};

// ─── Health ─────────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => client.get('/api/health'),
};

export default client;
