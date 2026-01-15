import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LanguageSelect } from '../components/LanguageSelect';

export const FaqScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const closeMobileNav = () => setShowMobileNav(false);

  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link to="/board" className="nav-logo" onClick={closeMobileNav}>Boardly</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label={t('nav.menu')}
        >
          {t('nav.menu')}
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              <Link to="/board" className="link" onClick={closeMobileNav}>{t('nav.board')}</Link>
              <Link to="/my-cards" className="link" onClick={closeMobileNav}>{t('nav.myCards')}</Link>
              <Link to="/profile" className="link" onClick={closeMobileNav}>{t('nav.profile')}</Link>
              <Link to="/faq" className="link" onClick={closeMobileNav}>{t('nav.faq')}</Link>
              <LanguageSelect compact />
              <span className="nav-greeting">
                {t('nav.greeting', { name: user.first_name || user.username })}
              </span>
              <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{ color: 'var(--accent-danger)' }}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/auth" className="link" onClick={closeMobileNav}>{t('auth.signIn')}</Link>
          )}
        </div>
      </nav>
      <div className="content-page">
        <h2>{t('faq.title')}</h2>
        <div className="faq-list">
          <div className="faq-item">
            <strong>{t('faq.q1')}</strong>
            <p>{t('faq.a1')}</p>
          </div>
          <div className="faq-item">
            <strong>{t('faq.q2')}</strong>
            <p>{t('faq.a2')}</p>
          </div>
          <div className="faq-item">
            <strong>{t('faq.q3')}</strong>
            <p>{t('faq.a3')}</p>
          </div>
          <div className="faq-item">
            <strong>{t('faq.q4')}</strong>
            <p>{t('faq.a4')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
