import { makeAutoObservable, runInAction } from 'mobx';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth.service';
import { User, Permission } from '../types';

class AuthStore {
  user: User | null = null;
  isAuthenticated = false;
  isLoading = true;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.checkAuth();
  }

  get isAdmin() {
    return this.user?.role === 'admin';
  }

  get isAgent() {
    return this.user?.role === 'agent' || this.user?.role === 'admin';
  }

  get permissions() {
    return this.user?.permissions || [];
  }

  hasPermission(permission: Permission | string): boolean {
    if (!this.isAuthenticated) return false;
    if (this.isAdmin) return true;
    if (!this.isAgent) return false;
    return this.permissions.includes(permission);
  }

  hasAnyPermission(...permissions: (Permission | string)[]): boolean {
    if (!this.isAuthenticated) return false;
    if (this.isAdmin) return true;
    if (!this.isAgent) return false;
    return permissions.some(permission => this.permissions.includes(permission));
  }

  hasAllPermissions(...permissions: (Permission | string)[]): boolean {
    if (!this.isAuthenticated) return false;
    if (this.isAdmin) return true;
    if (!this.isAgent) return false;
    return permissions.every(permission => this.permissions.includes(permission));
  }

  checkAuth = async () => {
    this.isLoading = true;
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        runInAction(() => {
          this.isAuthenticated = false;
          this.isLoading = false;
        });
        return;
      }

      const response = await authService.getMe();
      runInAction(() => {
        this.user = response.data;
        this.isAuthenticated = true;
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Check auth failed:', error);
      await SecureStore.deleteItemAsync('userToken');
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
        this.isLoading = false;
      });
    }
  };

  updateUserData = (data: Partial<User>) => {
    if (!data) return;
    runInAction(() => {
      this.user = { ...this.user, ...data } as User;
    });
  };

  login = async (phone: string, password: string) => {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await authService.login(phone, password);
      const { token, ...userData } = response.data;
      
      if (token) {
        await SecureStore.setItemAsync('userToken', token);
      }

      runInAction(() => {
        this.user = userData as User;
        this.isAuthenticated = true;
        this.isLoading = false;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Login failed';
        this.isLoading = false;
      });
      return false;
    }
  };

  register = async (userData: any) => {
    this.isLoading = true;
    this.error = null;
    try {
      const response = await authService.register(userData);
      const { token, ...data } = response.data;

      if (token) {
        await SecureStore.setItemAsync('userToken', token);
      }

      runInAction(() => {
        this.user = data as User;
        this.isAuthenticated = true;
        this.isLoading = false;
      });
      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Registration failed';
        this.isLoading = false;
      });
      return false;
    }
  };

  logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
      });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
}

const authStore = new AuthStore();
export default authStore;
