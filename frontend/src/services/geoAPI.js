import API, { unwrap } from './api';

export const geoAPI = {
  getAttacks: async () => {
    const res = await API.get('/api/geo');
    return unwrap(res);
  },
  getStats: async () => {
    const res = await API.get('/api/geo/stats');
    return unwrap(res);
  },
  getTopIPs: async (limit = 4) => {
    const res = await API.get('/api/top-ips', { params: { limit } });
    return unwrap(res);
  },
};
