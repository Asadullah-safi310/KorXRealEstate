import api from './api';

export interface ParentProperty {
  property_id: number;
  id?: number; // For compatibility
  title: string;
  property_category: 'apartment' | 'market' | 'sharak' | 'normal';
  province_id?: number;
  district_id?: number;
  area_id?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  total_floors?: number;
  total_units?: number;
  description?: string;
  facilities?: any;
  photos?: string[];
  created_by_user_id: number;
  status: string;
  ProvinceData?: { name: string };
  DistrictData?: { name: string };
  AreaData?: { name: string };
  Children?: any[];
  Agent?: { full_name: string; email: string };
  createdAt: string;
}

class ParentService {
  async getAgentParents(category: string) {
    const response = await api.get<ParentProperty[]>(`/agent/parents?category=${category}`);
    return response.data;
  }

  async getParentById(id: number) {
    const response = await api.get<ParentProperty>(`/parents/${id}`);
    return response.data;
  }

  async getParentChildren(id: number) {
    const response = await api.get<any[]>(`/parents/${id}/children`);
    return response.data;
  }

  async createChild(parentId: number, data: any) {
    const response = await api.post(`/parents/${parentId}/children`, data);
    return response.data;
  }

  async updateParent(id: number, data: Partial<ParentProperty>) {
    const response = await api.put<ParentProperty>(`/parents/${id}`, data);
    return response.data;
  }

  async deleteParent(id: number) {
    const response = await api.delete<{ message: string }>(`/parents/${id}`);
    return response.data;
  }
}

export default new ParentService();
