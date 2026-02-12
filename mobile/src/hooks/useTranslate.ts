import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, isRTL } from '../locals';
import { setCurrentLanguage, translate } from '../locals/i18n';

const LANGUAGE_STORAGE_KEY = '@app_language';

export const useTranslate = () => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang && (savedLang === 'en' || savedLang === 'dari' || savedLang === 'pashto')) {
        const lang = savedLang as Language;
        setLanguageState(lang);
        setCurrentLanguage(lang);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key, language);
  }, [language]);

  const isRTLLanguage = isRTL(language);

  return {
    t,
    language,
    setLanguage,
    isLoading,
    isRTL: isRTLLanguage,
  };
};
