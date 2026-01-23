import React from 'react';
import { useI18n } from '../context/I18nContext';

export const MyCardsScreen: React.FC = () => {
  const { t } = useI18n();

  return (
    <div style={{ padding: '32px', color: 'var(--text-primary)' }}>
      <h1>{t('nav.myCards')}</h1>
      <p>Цей функціонал у процесі оновлення...</p>
    </div>
  );
};