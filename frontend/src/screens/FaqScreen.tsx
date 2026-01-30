import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { LanguageSelect } from '../components/LanguageSelect';

// REDUX: Додаємо хуки та екшн для виходу
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';

export const FaqScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  // Отримуємо тільки дані зі стану
  const { user } = useAppSelector(state => state.auth);
  
  const { t } = useI18n();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const closeMobileNav = () => setShowMobileNav(false);

  const handleLogout = () => {
    closeMobileNav();
    dispatch(logoutUser()); // Викликаємо екшн через dispatch
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        {/* Зазвичай шлях до списку дошок /boards */}
        <Link to="/boards" className="nav-logo" onClick={closeMobileNav}>Boardly</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label={t('nav.menu')}
        >
          ☰
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              <Link to="/boards" className="link" onClick={closeMobileNav}>{t('nav.board')}</Link>
              <Link to="/my-cards" className="link" onClick={closeMobileNav}>{t('nav.myCards')}</Link>
              <Link to="/profile" className="link" onClick={closeMobileNav}>{t('nav.profile')}</Link>
              <Link to="/faq" className="link" onClick={closeMobileNav}>{t('nav.faq')}</Link>
              <LanguageSelect compact />
              <span className="nav-greeting" style={{ marginLeft: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                {t('nav.greeting', { name: user.first_name || user.username })}
              </span>
              <button onClick={handleLogout} className="btn-link" style={{ color: 'var(--danger)', marginLeft: 12 }}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" onClick={closeMobileNav} style={{ width: 'auto' }}>
              {t('auth.signIn')}
            </Link>
          )}
        </div>
      </nav>

      <div className="content-page" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '32px', textAlign: 'center' }}>{t('faq.title')}</h2>
        <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="faq-item" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary-blue)' }}>{t('faq.q1')}</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('faq.a1')}</p>
          </div>
          <div className="faq-item" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary-blue)' }}>{t('faq.q2')}</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('faq.a2')}</p>
          </div>
          <div className="faq-item" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary-blue)' }}>{t('faq.q3')}</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('faq.a3')}</p>
          </div>
          <div className="faq-item" style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary-blue)' }}>{t('faq.q4')}</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('faq.a4')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};