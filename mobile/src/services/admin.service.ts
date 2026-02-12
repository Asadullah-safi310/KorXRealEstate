import api from './api';

export const adminService = {
  getStats: async () => {
    return api.get('/admin/stats');
  },
  
  getUsers: async (params?: any) => {
    return api.get('/admin/users', { params });
  },
  
  updateUserRole: async (id: number | string, role: string) => {
    return api.put(`/admin/users/${id}/role`, { role });
  },
  
  deleteUser: async (id: number | string) => {
    return api.delete(`/admin/users/${id}`);
  },
  
  getProperties: async (params?: any) => {
    return api.get('/admin/properties', { params });
  },
  
  getDeals: async (params?: any) => {
    return api.get('/admin/deals', { params });
  },

  getAvailablePermissions: async () => {
    return api.get('/admin/permissions');
  },

  getUserPermissions: async (id: number | string) => {
    return api.get(`/admin/users/${id}/permissions`);
  },

  updateUserPermissions: async (id: number | string, permissions: string[]) => {
    return api.put(`/admin/users/${id}/permissions`, { permissions });
  },
};
