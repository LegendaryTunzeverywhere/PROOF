import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, languages } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  locale: string;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  flag: string;
  name: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get language from localStorage
    const stored = localStorage.getItem('proof-language');
    if (stored && (stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'pt' || stored === 'de' || stored === 'zh')) {
      return stored;
    }
    return 'en';
  });

  useEffect(() => {
    // Save to localStorage whenever language changes
    localStorage.setItem('proof-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const value: LanguageContextType = {
    language,
    locale: `${language}-` + (language === 'en' ? 'US' : language === 'es' ? 'ES' : language === 'fr' ? 'FR' : language === 'de' ? 'DE' : language === 'pt' ? 'PT' : 'CN'),
    setLanguage,
    t: translations[language],
    flag: languages[language].flag,
    name: languages[language].name,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
