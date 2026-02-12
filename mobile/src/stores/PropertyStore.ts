import { makeAutoObservable, runInAction } from 'mobx';
import { propertyService } from '../services/property.service';

class PropertyStore {
  properties: any[] = [];
  publicProperties: any[] = [];
  userProperties: any[] = [];
  dashboardStats: any = null;
  loading = false;
  refreshing = false;
  loadingMore = false;
  loadingStats = false;
  error: string | null = null;
  limit = 10;
  offset = 0;
  hasMore = true;

  constructor() {
    makeAutoObservable(this);
  }

  fetchDashboardStats = async () => {
    runInAction(() => {
      this.loadingStats = true;
    });
    try {
      const response = await propertyService.getDashboardStats();
      runInAction(() => {
        this.dashboardStats = response.data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loadingStats = false;
      });
    }
  };

  fetchPublicProperties = async (limit = 6, offset = 0) => {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const response = await propertyService.getPublicProperties(limit, offset);
      runInAction(() => {
        this.publicProperties = response.data;
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

  fetchUserProperties = async (userId: string | number, limit = 10) => {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const response = await propertyService.getPublicPropertiesByUser(userId, limit);
      runInAction(() => {
        this.userProperties = response.data;
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

  fetchProperties = async (isRefresh = false) => {
    if (this.loading || this.loadingMore) return;

    runInAction(() => {
      if (isRefresh) {
        this.refreshing = true;
        this.offset = 0;
        this.hasMore = true;
      } else if (this.offset > 0) {
        this.loadingMore = true;
      } else {
        this.loading = true;
      }
    });

    try {
      const response = await propertyService.getProperties(this.limit, this.offset);
      const newProperties = response.data;

      runInAction(() => {
        if (isRefresh) {
          this.properties = newProperties;
        } else {
          this.properties = [...this.properties, ...newProperties];
        }
        
        this.offset += newProperties.length;
        this.hasMore = newProperties.length === this.limit;
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.refreshing = false;
        this.loadingMore = false;
      });
    }
  };

  fetchPropertyById = async (id: string | number) => {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const response = await propertyService.getPropertyById(id);
      runInAction(() => {
        this.loading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  };

  fetchParentById = async (id: string | number) => {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const response = await propertyService.getParentById(id);
      runInAction(() => {
        this.loading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  };

  searchProperties = async (filters: any, isLoadMore = false) => {
    if (this.loading || this.loadingMore) return;

    runInAction(() => {
      if (isLoadMore) {
        this.loadingMore = true;
      } else {
        this.loading = true;
        this.offset = 0;
        this.hasMore = true;
        this.error = null;
      }
    });

    try {
      const queryParams = { 
        ...filters, 
        limit: this.limit, 
        offset: this.offset 
      };
      const response = await propertyService.searchProperties(queryParams);
      const newProperties = response.data;

      runInAction(() => {
        if (isLoadMore) {
          this.properties = [...this.properties, ...newProperties];
        } else {
          this.properties = newProperties;
        }
        
        this.offset += newProperties.length;
        this.hasMore = newProperties.length === this.limit;
        this.error = null;
      });
      return newProperties;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.loadingMore = false;
      });
    }
  };

  createProperty = async (propertyData: any) => {
    try {
      const response = await propertyService.createProperty(propertyData);
      this.fetchProperties(true); // Refresh the list
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  createParent = async (parentData: any) => {
    try {
      const response = await propertyService.createParent(parentData);
      // We might need to refresh a different list for parents, 
      // but fetchProperties(true) is fine for now if they are in the same view.
      this.fetchProperties(true); 
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  updateProperty = async (id: string | number, propertyData: any) => {
    try {
      console.log('========== UPDATE PROPERTY (Store) ==========');
      console.log('Property ID:', id);
      console.log('Property data:', JSON.stringify(propertyData, null, 2));
      
      const response = await propertyService.updateProperty(id, propertyData);
      
      console.log('✓ Update successful (Store)');
      this.fetchProperties(true); // Refresh the list
      return response.data;
    } catch (error: any) {
      console.error('========== ERROR UPDATE PROPERTY (Store) ==========');
      console.error('Error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error message:', error?.message);
      throw error;
    }
  };

  updateParent = async (id: string | number, parentData: any) => {
    try {
      const response = await propertyService.updateParent(id, parentData);
      this.fetchProperties(true);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  deletePropertyMedia = async (id: string | number, mediaUrls: string[]) => {
    try {
      console.log('Deleting media:', mediaUrls);
      const deletePromises = mediaUrls.map((url) => 
        propertyService.deletePropertyFile(id, url, 'photo')
      );
      await Promise.all(deletePromises);
      console.log('✓ Media deleted successfully');
    } catch (error: any) {
      console.error('Error deleting media:', error);
      throw error;
    }
  };

  uploadPropertyFiles = async (id: string | number, filesData: FormData) => {
    try {
      const response = await propertyService.uploadPropertyFiles(id, filesData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  deletePropertyFile = async (id: string | number, fileUrl: string, type: 'photo' | 'video' | 'attachment') => {
    try {
      const response = await propertyService.deletePropertyFile(id, fileUrl, type);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  deleteProperty = async (id: string | number) => {
    try {
      await propertyService.deleteProperty(id);
      this.fetchProperties(true); // Refresh the list
    } catch (error: any) {
      throw error;
    }
  };

  fetchPropertyChildren = async (id: string | number) => {
    runInAction(() => {
      this.loading = true;
    });
    try {
      const response = await propertyService.getPropertyChildren(id);
      runInAction(() => {
        this.loading = false;
      });
      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  };

  addChildProperty = async (id: string | number, childData: any) => {
    try {
      console.log('========== ADD CHILD PROPERTY (Store) ==========');
      console.log('Parent ID:', id);
      console.log('Child data:', JSON.stringify(childData, null, 2));
      
      const response = await propertyService.addChildProperty(id, childData);
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('========== ADD CHILD COMPLETE (Store) ==========');
      
      return response.data;
    } catch (error: any) {
      console.error('========== ERROR ADD CHILD (Store) ==========');
      console.error('Error:', error);
      console.error('Error response:', error?.response?.data);
      throw error;
    }
  };
}

const propertyStore = new PropertyStore();
export default propertyStore;
