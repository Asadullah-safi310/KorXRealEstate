import api from './api';

export const authService = {
  login: async (phone: string, password: string) => {
    return api.post('/auth/login', { phone, password });
  },
  register: async (userData: any) => {
    return api.post('/auth/register', userData);
  },
  getMe: async () => {
    return api.get('/auth/me');
  },
  forgotPassword: async (phone: string) => {
    return api.post('/auth/forgot-password', { phone });
  },
  verifyResetCode: async (phone: string, code: string) => {
    return api.post('/auth/verify-reset-code', { phone, code });
  },
  resetPassword: async (data: any) => {
    return api.post('/auth/reset-password', data);
  }
};
