import API, { unwrap } from './api';

export const trendsAPI = {
  get: async (period = '7d') => unwrap(await API.get('/api/trends', { params: { period } })),
  getStats: async () => unwrap(await API.get('/api/trends/stats')),
  getBreakdown: async () => unwrap(await API.get('/api/trends/breakdown')),
};
