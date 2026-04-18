import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { type Language } from '../data/assessmentSchema';
import { resolveTranslation, translations } from '../data/translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('nursing-language');
    return stored === 'en' || stored === 'ar' ? stored : 'fr';
  });

  useEffect(() => {
    localStorage.setItem('nursing-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => {
        const value = resolveTranslation(translations[language], key);
        return value === key ? resolveTranslation(translations.en, key) : value;
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
