import api from './api';

export const dealService = {
  getDeals: async () => {
    return api.get('/deals');
  },
  getDealById: async (id: string | number) => {
    return api.get(`/deals/${id}`);
  },
  createDeal: async (dealData: any) => {
    return api.post('/deals', dealData);
  }
};
