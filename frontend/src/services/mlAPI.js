import API, { unwrap } from './api';

export const mlAPI = {
  getMetrics: async () => unwrap(await API.get('/api/ml/metrics')),
  getClassification: async () => unwrap(await API.get('/api/ml/classification')),
  getScores: async () => unwrap(await API.get('/api/ml/scores')),
  getAnomalies: async () => unwrap(await API.get('/api/ml/anomalies')),
  getConfig: async () => unwrap(await API.get('/api/ml/config')),
  retrain: () => API.post('/api/ml/retrain'),
  rescan: () => API.post('/api/ml/rescan'),
};
