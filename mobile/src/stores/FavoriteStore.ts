import { makeAutoObservable, runInAction } from 'mobx';
import * as SecureStore from 'expo-secure-store';

class FavoriteStore {
  favoriteIds: number[] = [];
  isLoading = true;

  constructor() {
    makeAutoObservable(this);
    this.loadFavorites();
  }

  loadFavorites = async () => {
    this.isLoading = true;
    try {
      const stored = await SecureStore.getItemAsync('favorite_properties');
      if (stored) {
        runInAction(() => {
          this.favoriteIds = JSON.parse(stored);
        });
      }
    } catch (error) {
      console.error('Failed to load favorites', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  toggleFavorite = async (propertyId: number) => {
    runInAction(() => {
      if (this.favoriteIds.includes(propertyId)) {
        this.favoriteIds = this.favoriteIds.filter(id => id !== propertyId);
      } else {
        this.favoriteIds.push(propertyId);
      }
    });

    try {
      await SecureStore.setItemAsync('favorite_properties', JSON.stringify(this.favoriteIds));
    } catch (error) {
      console.error('Failed to save favorites', error);
    }
  };

  isFavorite = (propertyId: number) => {
    return this.favoriteIds.includes(propertyId);
  };
}

const favoriteStore = new FavoriteStore();
export default favoriteStore;
