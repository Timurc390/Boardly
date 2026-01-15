import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getInitialLocale, normalizeLocale, SUPPORTED_LOCALES, translations, type Locale } from '../i18n/translations';

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  supportedLocales: Locale[];
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    if (!user?.profile?.language) return;
    const profileLocale = normalizeLocale(user.profile.language);
    if (profileLocale !== locale) {
      setLocale(profileLocale);
    }
  }, [user?.id, user?.profile?.language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('locale', locale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const base = translations.uk[key] ?? key;
      const value = translations[locale][key] ?? base;
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (_match, name) => (
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : ''
      ));
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t,
    supportedLocales: [...SUPPORTED_LOCALES],
  }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
