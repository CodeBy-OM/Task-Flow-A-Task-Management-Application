import api from './api';

export const taskService = {
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data.data;
  },
};
