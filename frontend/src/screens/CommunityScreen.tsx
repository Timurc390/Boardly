import React from 'react';
import { useI18n } from '../context/I18nContext';

export const CommunityScreen: React.FC = () => {
  const { t } = useI18n();

  const getStartedItems = [
    {
      icon: '/help-icons/chat.png',
      titleKey: 'community.getStarted.forums.title',
      bodyKey: 'community.getStarted.forums.body'
    },
    {
      icon: '/help-icons/flash-card.png',
      titleKey: 'community.getStarted.learning.title',
      bodyKey: 'community.getStarted.learning.body'
    },
    {
      icon: '/help-icons/notification-bell.png',
      titleKey: 'community.getStarted.events.title',
      bodyKey: 'community.getStarted.events.body'
    },
    {
      icon: '/help-icons/badge.png',
      titleKey: 'community.getStarted.champions.title',
      bodyKey: 'community.getStarted.champions.body'
    }
  ];

  return (
    <div className="community-page">
      <div className="page-shell">
        <section className="community-hero">
          <h1>{t('community.title')}</h1>
          <p>{t('community.subtitle')}</p>
        </section>

        <section className="community-start">
          <div className="community-start-card">
            <div className="section-header">
              <h2>{t('community.getStarted.title')}</h2>
            </div>
            <div className="community-start-grid">
              {getStartedItems.map((item) => (
                <div className="community-card" key={item.titleKey}>
                  <div className="community-card-icon" aria-hidden="true">
                    <img src={item.icon} alt="" />
                  </div>
                  <div className="community-card-title">{t(item.titleKey)}</div>
                  <div className="community-card-body">{t(item.bodyKey)}</div>
                  <div className="community-card-link">{t('community.getStarted.link')}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="community-advice">
          <h3>{t('community.advice.title')}</h3>
          <p>{t('community.advice.body')}</p>
        </section>

      </div>
      <footer className="help-footer">
        <div className="help-footer-left">{t('help.footer.copyright')}</div>
        <div className="help-footer-links">
          <span>{t('help.footer.accessibility')}</span>
          <span>{t('help.footer.privacyChoices')}</span>
          <span>{t('help.footer.privacyPolicy')}</span>
          <span>{t('help.footer.terms')}</span>
          <span>{t('help.footer.impressum')}</span>
          <span>{t('help.footer.security')}</span>
        </div>
      </footer>
    </div>
  );
};
