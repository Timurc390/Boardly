import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';

export const PwaInstallButton: React.FC = () => {
  const { t } = useI18n();
  const { canInstall, promptInstall } = usePwaInstallPrompt();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      className="btn-secondary"
      style={{ width: 'auto' }}
      onClick={() => {
        void promptInstall();
      }}
    >
      {t('nav.installApp')}
    </button>
  );
};
