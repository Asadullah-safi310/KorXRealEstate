import api from './api';

export const userService = {
  getPublicProfile: async (id: string | number) => {
    return api.get(`/public/users/${id}`);
  },
  getPublicAgents: async () => {
    return api.get('/public/users/agents/list');
  },
  getPublicPropertyListers: async () => {
    return api.get('/public/users/listers/list');
  }
};
