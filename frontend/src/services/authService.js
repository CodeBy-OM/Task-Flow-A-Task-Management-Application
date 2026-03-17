import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    const { accessToken, user } = response.data.data;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user } = response.data.data;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};
