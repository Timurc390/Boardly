import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'shared/ui/fiIcons';
import { useI18n } from '../context/I18nContext';

export const HelpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const featuredItems = [
    { titleKey: 'help.featured.item1', path: '/help' },
    { titleKey: 'help.featured.item2', path: '/help' },
    { titleKey: 'help.featured.item3', path: '/help' },
    { titleKey: 'help.featured.item4', path: '/help' },
    { titleKey: 'help.featured.item5', path: '/help' },
    { titleKey: 'help.featured.item6', path: '/help' },
    { titleKey: 'help.featured.item7', path: '/help' },
    { titleKey: 'help.featured.item8', path: '/help' },
    { titleKey: 'help.featured.item9', path: '/help' }
  ];

  const resourceItems = [
    {
      icon: '/help-icons/chat.png',
      titleKey: 'help.resources.community.title',
      bodyKey: 'help.resources.community.body',
      linkKey: 'help.resources.community.link',
      path: '/community'
    },
    {
      icon: '/help-icons/notification-bell.png',
      titleKey: 'help.resources.status.title',
      bodyKey: 'help.resources.status.body',
      linkKey: 'help.resources.status.link',
      path: '/help'
    },
    {
      icon: '/help-icons/idea.png',
      titleKey: 'help.resources.suggestions.title',
      bodyKey: 'help.resources.suggestions.body',
      linkKey: 'help.resources.suggestions.link',
      path: '/community'
    },
    {
      icon: '/help-icons/puzzle.png',
      titleKey: 'help.resources.marketplace.title',
      bodyKey: 'help.resources.marketplace.body',
      linkKey: 'help.resources.marketplace.link',
      path: '/boards'
    },
    {
      icon: '/help-icons/flash-card.png',
      titleKey: 'help.resources.billing.title',
      bodyKey: 'help.resources.billing.body',
      linkKey: 'help.resources.billing.link',
      path: '/help'
    },
    {
      icon: '/help-icons/badge.png',
      titleKey: 'help.resources.training.title',
      bodyKey: 'help.resources.training.body',
      linkKey: 'help.resources.training.link',
      path: '/community'
    },
    {
      icon: '/help-icons/app-development.png',
      titleKey: 'help.resources.developers.title',
      bodyKey: 'help.resources.developers.body',
      linkKey: 'help.resources.developers.link',
      path: '/help'
    },
    {
      icon: '/help-icons/enterprise.png',
      titleKey: 'help.resources.enterprise.title',
      bodyKey: 'help.resources.enterprise.body',
      linkKey: 'help.resources.enterprise.link',
      path: '/help'
    },
    {
      icon: '/help-icons/cloud-server.png',
      titleKey: 'help.resources.government.title',
      bodyKey: 'help.resources.government.body',
      linkKey: 'help.resources.government.link',
      path: '/auth'
    },
    {
      icon: '/help-icons/collaboration.png',
      titleKey: 'help.resources.success.title',
      bodyKey: 'help.resources.success.body',
      linkKey: 'help.resources.success.link',
      path: '/community',
      centerOnDesktop: true
    }
  ];

  const footerKeys = [
    'help.footer.accessibility',
    'help.footer.privacyChoices',
    'help.footer.privacyPolicy',
    'help.footer.terms',
    'help.footer.impressum',
    'help.footer.security'
  ];

  return (
    <div className="help-page support-page">
      <section className="help-hero support-hero help-animate">
        <div className="support-hero-container">
          <Link to="/" className="support-logo">
            Boardly
          </Link>
          <button type="button" className="support-back" onClick={() => navigate(-1)}>
            <span aria-hidden="true"><FiArrowLeft /></span>
            <span>{t('community.back')}</span>
          </button>
          <h1>{t('help.title')}</h1>
          <p className="help-hero-subtitle">{t('help.subtitle')}</p>
        </div>
      </section>

      <div className="help-shell support-shell">
        <section className="help-featured help-animate" style={{ animationDelay: '100ms' }}>
          <div className="help-featured-card">
            <h2>{t('help.featured.title')}</h2>
            <div className="help-featured-list">
              {featuredItems.map((item, index) => (
                <button
                  type="button"
                  className="help-featured-item"
                  key={item.titleKey}
                  style={{ animationDelay: `${180 + index * 40}ms` }}
                  onClick={() => navigate(item.path)}
                >
                  {t(item.titleKey)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="help-resources help-animate" style={{ animationDelay: '180ms' }}>
          <h2>{t('help.resources.title')}</h2>
          <div className="resource-grid">
            {resourceItems.map((item, index) => (
              <article
                className={`resource-card${item.centerOnDesktop ? ' resource-card--center' : ''}`}
                key={item.titleKey}
                style={{ animationDelay: `${220 + index * 40}ms` }}
              >
                <div className="resource-icon" aria-hidden="true">
                  <img src={item.icon} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="resource-title">{t(item.titleKey)}</div>
                <div className="resource-body">{t(item.bodyKey)}</div>
                <button
                  type="button"
                  className="resource-link"
                  onClick={() => navigate(item.path)}
                >
                  {t(item.linkKey)}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="help-footer-cta help-animate" style={{ animationDelay: '260ms' }}>
          <p>{t('help.contact.title')}</p>
          <button type="button" className="help-contact-btn" onClick={() => navigate('/help')}>
            {t('help.contact.button')}
          </button>
        </section>

      </div>
      <footer className="help-footer support-footer help-animate" style={{ animationDelay: '320ms' }}>
        <div className="help-footer-left">{t('help.footer.copyright')}</div>
        <div className="help-footer-links">
          {footerKeys.map((key) => (
            <button type="button" className="support-footer-link" key={key}>
              {t(key)}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};
