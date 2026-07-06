import API from './api';

export const authAPI = {
  login: (email, password) => API.post('/api/auth/login', { email, password }),
  register: (data) => API.post('/api/auth/register', data),
  checkEmail: (email) => API.get('/api/auth/check-email', { params: { email } }),
  me: () => API.get('/api/auth/me'),
};
