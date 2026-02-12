import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslate } from '../hooks/useTranslate';
import { Language } from '../locals';

interface LanguageContextType {
  t: (key: string) => string;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const translateHook = useTranslate();

  return (
    <LanguageContext.Provider value={translateHook}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
