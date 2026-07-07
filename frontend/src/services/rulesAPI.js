import API from './api';

export const rulesAPI = {
  getAll: async () => {
    const res = await API.get('/api/rules');
    const body = res.data;
    // Known shape: {data: {rules: [...], total: N}} - nested under data.rules
    const inner = body.data || {};
    return { rules: inner.rules || [], total: inner.total || 0 };
  },
  create: (rule) => API.post('/api/rules', rule),
  patch: (id, partial) => API.patch(`/api/rules/${id}`, partial),
  update: (id, full) => API.put(`/api/rules/${id}`, full),
  remove: (id) => API.delete(`/api/rules/${id}`),
};
