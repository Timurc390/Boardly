import React from 'react';
import { useI18n } from '../context/I18nContext';

export const HelpScreen: React.FC = () => {
  const { t } = useI18n();

  const featuredItems = [
    { titleKey: 'help.featured.item1' },
    { titleKey: 'help.featured.item2' },
    { titleKey: 'help.featured.item3' },
    { titleKey: 'help.featured.item4' },
    { titleKey: 'help.featured.item5' },
    { titleKey: 'help.featured.item6' },
    { titleKey: 'help.featured.item7' },
    { titleKey: 'help.featured.item8' },
    { titleKey: 'help.featured.item9' }
  ];

  const resourceItems = [
    {
      icon: '/help-icons/chat.png',
      titleKey: 'help.resources.community.title',
      bodyKey: 'help.resources.community.body',
      linkKey: 'help.resources.community.link'
    },
    {
      icon: '/help-icons/notification-bell.png',
      titleKey: 'help.resources.status.title',
      bodyKey: 'help.resources.status.body',
      linkKey: 'help.resources.status.link'
    },
    {
      icon: '/help-icons/idea.png',
      titleKey: 'help.resources.suggestions.title',
      bodyKey: 'help.resources.suggestions.body',
      linkKey: 'help.resources.suggestions.link'
    },
    {
      icon: '/help-icons/puzzle.png',
      titleKey: 'help.resources.marketplace.title',
      bodyKey: 'help.resources.marketplace.body',
      linkKey: 'help.resources.marketplace.link'
    },
    {
      icon: '/help-icons/flash-card.png',
      titleKey: 'help.resources.billing.title',
      bodyKey: 'help.resources.billing.body',
      linkKey: 'help.resources.billing.link'
    },
    {
      icon: '/help-icons/badge.png',
      titleKey: 'help.resources.training.title',
      bodyKey: 'help.resources.training.body',
      linkKey: 'help.resources.training.link'
    },
    {
      icon: '/help-icons/app-development.png',
      titleKey: 'help.resources.developers.title',
      bodyKey: 'help.resources.developers.body',
      linkKey: 'help.resources.developers.link'
    },
    {
      icon: '/help-icons/enterprise.png',
      titleKey: 'help.resources.enterprise.title',
      bodyKey: 'help.resources.enterprise.body',
      linkKey: 'help.resources.enterprise.link'
    },
    {
      icon: '/help-icons/cloud-server.png',
      titleKey: 'help.resources.government.title',
      bodyKey: 'help.resources.government.body',
      linkKey: 'help.resources.government.link'
    },
    {
      icon: '/help-icons/collaboration.png',
      titleKey: 'help.resources.success.title',
      bodyKey: 'help.resources.success.body',
      linkKey: 'help.resources.success.link'
    }
  ];

  return (
    <div className="help-page">
      <section className="help-hero">
        <div className="help-hero-inner">
          <h1>{t('help.title')}</h1>
          <p className="help-hero-subtitle">{t('help.subtitle')}</p>
          
        </div>
      </section>

      <div className="page-shell help-shell">
        <section className="help-featured">
          <div className="help-featured-card">
            <div className="help-featured-header">
              <h2>{t('help.featured.title')}</h2>
              
            </div>
            <div className="help-featured-list">
              {featuredItems.map((item) => (
                <div className="help-featured-item" key={item.titleKey}>
                  {t(item.titleKey)}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="help-resources">
          <h2>{t('help.resources.title')}</h2>
          <div className="resource-grid">
            {resourceItems.map((item) => (
              <div className="resource-card" key={item.titleKey}>
                <div className="resource-icon" aria-hidden="true">
                  <img src={item.icon} alt="" />
                </div>
                <div className="resource-title">{t(item.titleKey)}</div>
                <div className="resource-body">{t(item.bodyKey)}</div>
                <div className="resource-link">{t(item.linkKey)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="help-footer-cta">
          <p>{t('help.contact.title')}</p>
          <button type="button" className="help-contact-btn">
            {t('help.contact.button')}
          </button>
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
