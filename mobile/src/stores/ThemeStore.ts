import { makeAutoObservable, runInAction } from 'mobx';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeStore {
  theme: ThemeMode = 'light';
  isReady = false;

  constructor() {
    makeAutoObservable(this);
    this.load();
  }

  private async load() {
    try {
      const stored = await SecureStore.getItemAsync('theme');
      runInAction(() => {
        this.theme = (stored as ThemeMode) || 'light';
        this.isReady = true;
      });
    } catch (error) {
      console.error('Failed to load theme:', error);
      runInAction(() => (this.isReady = true));
    }
  }

  setTheme = async (mode: ThemeMode) => {
    this.theme = mode;
    try {
      await SecureStore.setItemAsync('theme', mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };
}

const themeStore = new ThemeStore();
export default themeStore;
