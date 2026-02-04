import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export const CommunityScreen: React.FC = () => {
  const { t } = useI18n();

  const getStartedItems = [
    {
      icon: '/community/forums.png',
      titleKey: 'community.getStarted.forums.title',
      bodyKey: 'community.getStarted.forums.body'
    },
    {
      icon: '/community/learning.png',
      titleKey: 'community.getStarted.learning.title',
      bodyKey: 'community.getStarted.learning.body'
    },
    {
      icon: '/community/events.png',
      titleKey: 'community.getStarted.events.title',
      bodyKey: 'community.getStarted.events.body'
    },
    {
      icon: '/community/champions.png',
      titleKey: 'community.getStarted.champions.title',
      bodyKey: 'community.getStarted.champions.body'
    }
  ];

  return (
    <div className="community-page community-page-redesign">
      <section className="community-hero">
        <div className="community-brand">Boardly</div>
        <div className="community-hero-inner community-hero-content">
          <Link className="community-back-link" to="/help">
            ← {t('community.back')}
          </Link>
          <h1>{t('community.title')}</h1>
          <p>{t('community.subtitle')}</p>
        </div>
      </section>

      <div className="community-shell">
        <section className="community-get-started">
          <h2>{t('community.getStarted.title')}</h2>
          <div className="community-start-grid">
            {getStartedItems.map((item) => (
              <article className="community-card" key={item.titleKey}>
                <div className="community-card-icon" aria-hidden="true">
                  <img src={item.icon} alt="" />
                </div>
                <div className="community-card-title">{t(item.titleKey)}</div>
                <div className="community-card-body">{t(item.bodyKey)}</div>
                <div className="community-card-link">{t('community.getStarted.link')}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="community-feature community-feature--advice">
          <div className="community-feature-kicker">{t('community.kicker.forums')}</div>
          <h3>{t('community.advice.title')}</h3>
          <p>{t('community.advice.body')}</p>
          <div className="community-feature-image community-feature-image--wide">
            <img src="/community/community-banner.png" alt="Community" />
          </div>
        </section>

        <section className="community-feature community-feature--learning">
          <div className="community-feature-kicker">{t('community.kicker.forums')}</div>
          <h3>{t('community.learning.title')}</h3>
          <p>{t('community.learning.body')}</p>
          <div className="community-learning-grid">
            <div className="community-feature-image community-feature-image--portrait">
              <img src="/community/learning-photo.png" alt="Learning" />
            </div>
            <p className="community-learning-copy">{t('community.learning.longBody')}</p>
          </div>
        </section>
      </div>

      <footer className="help-footer community-footer">
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
