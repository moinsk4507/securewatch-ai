import API, { unwrap } from './api';

export const firewallAPI = {
  block: (ip, reason) => API.post('/api/firewall/block', { ip, reason }),
  getBlocked: async () => unwrap(await API.get('/api/firewall/blocked')),
  unblock: (ip) => API.delete(`/api/firewall/unblock/${ip}`),
};
