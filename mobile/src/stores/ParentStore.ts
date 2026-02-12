import { makeAutoObservable, runInAction } from 'mobx';
import parentService, { ParentProperty } from '../services/parent.service';

class ParentStore {
  parents: ParentProperty[] = [];
  currentParent: ParentProperty | null = null;
  children: any[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchAgentParents = async (category: string) => {
    this.loading = true;
    try {
      const data = await parentService.getAgentParents(category);
      runInAction(() => {
        this.parents = data;
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

  fetchParentById = async (id: number) => {
    this.loading = true;
    try {
      const data = await parentService.getParentById(id);
      runInAction(() => {
        this.currentParent = data;
        this.error = null;
      });
      return data;
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

  fetchChildren = async (id: number) => {
    this.loading = true;
    try {
      const data = await parentService.getParentChildren(id);
      runInAction(() => {
        this.children = data;
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

  updateParent = async (id: number, data: Partial<ParentProperty>) => {
    this.loading = true;
    try {
      const updated = await parentService.updateParent(id, data);
      runInAction(() => {
        if (this.currentParent?.id === id) {
          this.currentParent = updated;
        }
        const index = this.parents.findIndex(p => p.id === id);
        if (index !== -1) {
          this.parents[index] = updated;
        }
        this.error = null;
      });
      return updated;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  deleteParent = async (id: number) => {
    this.loading = true;
    try {
      await parentService.deleteParent(id);
      runInAction(() => {
        this.parents = this.parents.filter(p => p.id !== id);
        if (this.currentParent?.id === id) {
          this.currentParent = null;
        }
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}

const parentStore = new ParentStore();
export default parentStore;
