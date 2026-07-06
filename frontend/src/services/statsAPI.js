import API, { unwrap } from './api';

export const statsAPI = {
  get: async () => {
    const res = await API.get('/api/stats');
    return unwrap(res);
  },
};
