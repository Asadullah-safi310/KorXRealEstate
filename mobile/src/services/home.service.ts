import axiosInstance from './api';

export const homeService = {
  getContainers: async () => {
    try {
      const response = await axiosInstance.get('/home/containers');
      return response.data;
    } catch (error) {
      console.error('Error fetching home containers:', error);
      throw error;
    }
  },
};
