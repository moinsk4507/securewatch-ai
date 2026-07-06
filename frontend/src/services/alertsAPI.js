import API from './api';

export const alertsAPI = {
  getAll: async (params) => {
    const res = await API.get('/api/alerts', { params });
    const body = res.data;
    // Known shape: {data: [...alerts]} - data is the array directly
    return { alerts: body.data || [], total: body.total || 0 };
  },
  updateStatus: (id, status) => API.post(`/api/alerts/${id}/status`, { status }),
  resolveAll: () => API.post('/api/alerts/resolve-all'),
};
