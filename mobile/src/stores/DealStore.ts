import { makeAutoObservable, runInAction } from 'mobx';
import { dealService } from '../services/deal.service';

class DealStore {
  deals: any[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  fetchDeals = async () => {
    this.loading = true;
    try {
      const response = await dealService.getDeals();
      runInAction(() => {
        this.deals = response.data;
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

  fetchDealById = async (id: number | string) => {
    this.loading = true;
    try {
      const response = await dealService.getDealById(id);
      runInAction(() => {
        this.error = null;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
      return null;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  createDeal = async (dealData: any) => {
    this.loading = true;
    try {
      await dealService.createDeal(dealData);
      await this.fetchDeals();
      runInAction(() => {
        this.error = null;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || error.message;
      });
      return false;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}

const dealStore = new DealStore();
export default dealStore;
