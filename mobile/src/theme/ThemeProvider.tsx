import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { observer } from 'mobx-react-lite';
import themeStore from '../stores/ThemeStore';
import { lightTheme, darkTheme, ThemeColors } from './colors';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  theme: 'light' | 'dark';
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = observer(({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme() ?? 'light';
  
  const themeMode = themeStore.theme === 'system' ? systemColorScheme : themeStore.theme;
  const isDark = themeMode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  const value = {
    colors,
    isDark,
    theme: themeMode as 'light' | 'dark',
    setTheme: themeStore.setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
