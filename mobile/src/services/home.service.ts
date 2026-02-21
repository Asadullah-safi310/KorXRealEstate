import axiosInstance from './api';

export interface HomeContainerItem {
  id: number;
  title: string;
  images: string[];
  district?: string;
  province?: string;
  availableUnits: number;
  totalUnits: number;
  forSaleUnits?: number;
  forRentUnits?: number;
  category: 'tower' | 'apartment' | 'market' | 'sharak';
}

export interface HomeContainersResponse {
  towers: HomeContainerItem[];
  apartments: HomeContainerItem[];
  markets: HomeContainerItem[];
  sharaks: HomeContainerItem[];
}

export const homeService = {
  getContainers: async (): Promise<HomeContainersResponse> => {
    try {
      const response = await axiosInstance.get<HomeContainersResponse>('/home/containers');
      return response.data;
    } catch (error) {
      console.error('Error fetching home containers:', error);
      throw error;
    }
  },
};
