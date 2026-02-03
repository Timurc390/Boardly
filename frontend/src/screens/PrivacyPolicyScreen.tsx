import React from 'react';
import { useI18n } from '../context/I18nContext';

export const PrivacyPolicyScreen: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="privacy-page">
      <div className="privacy-header">
        {/* Прибрали justifyContent: 'center', щоб логотип був зліва */}
        <div className="privacy-header-inner">
           <div className="privacy-brand">Boardly</div>
        </div>
      </div>
      <div className="privacy-content">
        <h1>{t('profile.privacy.title')}</h1>
        <p>{t('privacy.body.p1')}</p>
        <p>{t('privacy.body.p2')}</p>
        
        <h3>{t('privacy.summaryTitle')}</h3>
      </div>
      <div className="privacy-footer">
        <div className="privacy-footer-inner">
          <span>© 2026 Boardly</span>
          <div className="privacy-footer-links">
            <span>{t('privacy.footer.accessibility')}</span>
            <span>{t('privacy.footer.choices')}</span>
            <span>{t('privacy.footer.policy')}</span>
            <span>{t('privacy.footer.terms')}</span>
            <span>{t('privacy.footer.data')}</span>
            <span>{t('privacy.footer.security')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
