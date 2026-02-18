import React from 'react';
// ВИПРАВЛЕНО: Використовуємо Redux
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateUserProfile } from '../store/slices/authSlice';

import { useI18n } from '../context/I18nContext';
import { type Locale } from '../i18n/translations';

type LanguageSelectProps = {
  compact?: boolean;
  className?: string;
  onLocaleChange?: (next: Locale) => void;
};

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ compact = false, className, onLocaleChange }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  
  const { locale, setLocale, supportedLocales, t } = useI18n();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as typeof locale;
    setLocale(next);
    onLocaleChange?.(next);
    
    // Якщо користувач залогінений, зберігаємо мову на сервері
    if (user?.profile?.language !== next && user) {
      dispatch(updateUserProfile({ profile: { language: next } }));
    }
  };

  return (
    <label className={['language-select', className].filter(Boolean).join(' ')}>
      {!compact && <span className="language-label">{t('nav.language')}</span>}
      <select
        className="input"
        value={locale}
        onChange={handleChange}
        aria-label={t('nav.language')}
      >
        {supportedLocales.map(code => (
          <option key={code} value={code}>{t(`lang.${code}`)}</option>
        ))}
      </select>
    </label>
  );
};
