import api from './api';

export const personService = {
  getPersons: async () => {
    return api.get('/persons');
  },
  getAgents: async () => {
    return api.get('/persons/agents/list');
  },
  getPersonById: async (id: string | number) => {
    return api.get(`/persons/${id}`);
  },
  createPerson: async (personData: any, isFormData: boolean = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/persons', personData, config);
  },
  updatePerson: async (id: string | number, personData: any, isFormData: boolean = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put(`/persons/${id}`, personData, config);
  },
  deletePerson: async (id: string | number) => {
    return api.delete(`/persons/${id}`);
  },
  getProfile: async () => {
    return api.get('/profile');
  },
  updateProfile: async (profileData: any, isFormData: boolean = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put('/profile', profileData, config);
  }
};
