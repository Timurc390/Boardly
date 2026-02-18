import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
// ЗМІНА: Імпортуємо хук Redux замість useAuth
import { useAppSelector } from '../store/hooks';
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
  // ЗМІНА: Отримуємо користувача з Redux Store
  const { user } = useAppSelector(state => state.auth);
  
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const [isLocalePinned, setIsLocalePinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem('locale'));
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(normalizeLocale(next));
    setIsLocalePinned(true);
  }, []);

  // Синхронізація мови з профілем користувача
  useEffect(() => {
    if (!user?.profile?.language) return;
    if (isLocalePinned) return;
    const profileLocale = normalizeLocale(user.profile.language);
    if (profileLocale !== locale) {
      setLocaleState(profileLocale);
    }
  }, [user?.id, user?.profile?.language, locale, isLocalePinned]);

  // Збереження мови в localStorage та html тег
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
      // @ts-ignore
      const base = translations.uk[key] ?? key;
      // @ts-ignore
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
    supportedLocales: [...SUPPORTED_LOCALES]
  }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
