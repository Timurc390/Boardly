import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

type LanguageSelectProps = {
  compact?: boolean;
  className?: string;
};

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ compact = false, className }) => {
  const { user, updateProfile } = useAuth();
  const { locale, setLocale, supportedLocales, t } = useI18n();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as typeof locale;
    setLocale(next);
    if (user?.profile?.language !== next) {
      void updateProfile({ profile: { language: next } });
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
