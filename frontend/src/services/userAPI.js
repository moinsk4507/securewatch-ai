import API, { unwrap } from './api';

export const userAPI = {
  getProfile: async () => unwrap(await API.get('/api/user/me')),
  updateProfile: (data) => API.put('/api/user/me', data),
  changePassword: (current, newPass) => API.post('/api/user/change-password', { current, newPass }),
  getStats: async () => unwrap(await API.get('/api/user/stats')),
  getActivity: async () => unwrap(await API.get('/api/user/activity')),
  getPermissions: async () => unwrap(await API.get('/api/user/permissions')),
};
