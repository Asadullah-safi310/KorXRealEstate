import { translations, Language } from './index';

let currentLanguage: Language = 'en';

export const setCurrentLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

export const translate = (key: string, lang?: Language): string => {
  const language = lang || currentLanguage;
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key "${key}" not found for language "${language}"`);
      return key;
    }
  }

  if (typeof value === 'string') {
    return value;
  }

  console.warn(`Translation key "${key}" does not resolve to a string for language "${language}"`);
  return key;
};

export const t = translate;
