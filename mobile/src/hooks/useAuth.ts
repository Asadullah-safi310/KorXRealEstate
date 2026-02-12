import authStore from '../stores/AuthStore';

export const useAuth = () => {
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    isAdmin: authStore.isAdmin,
    isAgent: authStore.isAgent,
  };
};
