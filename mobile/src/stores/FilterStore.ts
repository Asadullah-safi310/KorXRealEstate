import { makeAutoObservable } from 'mobx';

export interface FilterState {
  search: string;
  province_id: string;
  district_id: string;
  area_id: string;
  property_type: string;
  property_category: string;
  record_kind: string;
  purpose: string;
  min_price: string;
  max_price: string;
  bedrooms: string;
  agent_id: string;
}

class FilterStore {
  filters: FilterState = {
    search: '',
    province_id: '',
    district_id: '',
    area_id: '',
    property_type: '',
    property_category: '',
    record_kind: '',
    purpose: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    agent_id: '',
  };

  constructor() {
    makeAutoObservable(this);
  }

  get hasActiveFilters(): boolean {
    return Object.values(this.filters).some(v => v !== '');
  }

  updateFilter = (name: keyof FilterState, value: string) => {
    this.filters[name] = value;
  };

  updateFilters = (newFilters: Partial<FilterState>) => {
    this.filters = { ...this.filters, ...newFilters };
  };

  clearFilters = () => {
    this.filters = {
      search: '',
      province_id: '',
      district_id: '',
      area_id: '',
      property_type: '',
      property_category: '',
      record_kind: '',
      purpose: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      agent_id: '',
    };
  };
}

const filterStore = new FilterStore();
export default filterStore;
