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
  currency: string;
  bedrooms: string;
  bathrooms: string;
  agent_id: string;
  amenities: string[];
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
    currency: 'USD',
    bedrooms: '',
    bathrooms: '',
    agent_id: '',
    amenities: [],
  };

  constructor() {
    makeAutoObservable(this);
  }

  get hasActiveFilters(): boolean {
    return Object.entries(this.filters).some(([key, value]) => {
      if (key === 'amenities') return Array.isArray(value) && value.length > 0;
      return value !== '' && value !== 'USD';
    });
  }

  updateFilter = (name: keyof FilterState, value: any) => {
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
      currency: 'USD',
      bedrooms: '',
      bathrooms: '',
      agent_id: '',
      amenities: [],
    };
  };
}

const filterStore = new FilterStore();
export default filterStore;
