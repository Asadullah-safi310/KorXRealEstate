import { en, TranslationKeys } from './en';
import { dari } from './dari';
import { pashto } from './pashto';

export type Language = 'en' | 'dari' | 'pashto';

export const translations: Record<Language, TranslationKeys> = {
  en,
  dari,
  pashto,
};

export const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', isRTL: false },
  { code: 'dari' as Language, name: 'Dari', nativeName: 'دری', isRTL: true },
  { code: 'pashto' as Language, name: 'Pashto', nativeName: 'پښتو', isRTL: true },
];

export const isRTL = (lang: Language): boolean => {
  return lang === 'dari' || lang === 'pashto';
};

export const getLanguageName = (code: Language): string => {
  const lang = languages.find(l => l.code === code);
  return lang?.nativeName || 'English';
};

export * from './en';
export * from './dari';
export * from './pashto';
