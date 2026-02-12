import api from './api';

export const locationService = {
  getProvinces: async () => {
    return api.get('/locations/provinces');
  },
  getDistricts: async (provinceId: string | number) => {
    return api.get(`/locations/provinces/${provinceId}/districts`);
  },
  getAreas: async (districtId: string | number) => {
    return api.get(`/locations/districts/${districtId}/areas`);
  }
};
