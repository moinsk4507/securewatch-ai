import API, { unwrap } from './api';

export const settingsAPI = {
  get: async () => unwrap(await API.get('/api/settings')),
  saveGeneral: (d) => API.post('/api/settings/general', d),
  saveNotifications: (d) => API.post('/api/settings/notifications', d),
  saveML: (d) => API.post('/api/settings/ml', d),
  saveSecurity: (d) => API.post('/api/settings/security', d),
  testConnections: async () => unwrap(await API.get('/api/settings/test-connections')),
  flushLogs: (confirm) => API.delete('/api/settings/flush-logs', { data: { confirm } }),
  resetML: (confirm) => API.post('/api/settings/reset-ml', { confirm }),
  deleteUsers: (confirm) => API.delete('/api/settings/delete-users', { data: { confirm } }),
};
