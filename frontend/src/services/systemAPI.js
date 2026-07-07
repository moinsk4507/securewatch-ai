import API, { unwrap } from './api';

export const systemAPI = {
  getMetrics: async () => unwrap(await API.get('/api/system/metrics')),
  getProcesses: async (limit = 10) => unwrap(await API.get('/api/system/processes', { params: { limit } })),
  getHealth: async () => unwrap(await API.get('/api/system/health')),
  getLogs: async (limit = 20) => unwrap(await API.get('/api/system/logs', { params: { limit } })),

  // Attack simulation controls
  startSimulation: () => API.post('/api/system/simulate/start'),
  stopSimulation: () => API.post('/api/system/simulate/stop'),
  getSimulationStatus: async () => unwrap(await API.get('/api/system/simulate/status')),
};
