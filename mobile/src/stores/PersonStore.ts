import { makeAutoObservable, runInAction } from 'mobx';
import { personService } from '../services/person.service';

class PersonStore {
  persons: any[] = [];
  agents: any[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchPersons = async () => {
    this.loading = true;
    try {
      const response = await personService.getPersons();
      runInAction(() => {
        this.persons = response.data;
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  fetchAgents = async () => {
    this.loading = true;
    try {
      const response = await personService.getAgents();
      runInAction(() => {
        this.agents = response.data;
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  fetchPersonById = async (id: number | string) => {
    this.loading = true;
    try {
      const response = await personService.getPersonById(id);
      runInAction(() => {
        this.error = null;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || error.response?.data?.error || error.message;
      });
      return null;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  createPerson = async (personData: any) => {
    this.loading = true;
    try {
      const isFormData = personData instanceof FormData;
      await personService.createPerson(personData, isFormData);
      await this.fetchPersons();
      runInAction(() => {
        this.error = null;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || error.response?.data?.error || error.message;
      });
      return false;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  updatePerson = async (id: number | string, personData: any) => {
    this.loading = true;
    try {
      const isFormData = personData instanceof FormData;
      await personService.updatePerson(id, personData, isFormData);
      await this.fetchPersons();
      runInAction(() => {
        this.error = null;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || error.response?.data?.error || error.message;
      });
      return false;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  deletePerson = async (id: number | string) => {
    this.loading = true;
    try {
      await personService.deletePerson(id);
      await this.fetchPersons();
      runInAction(() => {
        this.error = null;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.error || error.message;
      });
      return false;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}

const personStore = new PersonStore();
export default personStore;
