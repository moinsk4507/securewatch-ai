import API, { unwrap } from './api';

export const logsAPI = {
  get: async () => unwrap(await API.get('/api/logs')),
  streamUrl: () => `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/logs/stream`,
};
