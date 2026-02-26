import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FiLogOut, FiMenu } from 'shared/ui/fiIcons';
// ВИПРАВЛЕНО: Redux
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';

import { useI18n } from '../../context/I18nContext';
import { LanguageSelect } from '../LanguageSelect';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  // Беремо юзера зі стору
  const { user } = useAppSelector(state => state.auth);
  
  const { t, locale } = useI18n();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isBoardDetail = /^\/boards\/[^/]+$/.test(normalizedPath);
  const isBoardsPage = normalizedPath === '/boards';
  const isCommunityPage = normalizedPath === '/community' || normalizedPath === '/get-started';
  const isHelpPage = normalizedPath === '/help' || normalizedPath === '/support';
  const hideTopNav = isBoardDetail || isBoardsPage || isCommunityPage || isHelpPage;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  const rawAvatarUrl = user?.profile?.avatar_url || '';
  const rawAvatarPath = user?.profile?.avatar || '';
  const resolvedAvatarUrl = useMemo(() => {
    return resolveMediaUrl(rawAvatarUrl || rawAvatarPath);
  }, [rawAvatarUrl, rawAvatarPath]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [resolvedAvatarUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    const setAppHeight = () => {
      const nextHeight = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty('--app-height', `${nextHeight}px`);
    };
    setAppHeight();
    const handleResize = () => setAppHeight();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [locale]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Функція для перевірки активного посилання
  const isActive = (path: string) => normalizedPath === path ? 'active' : '';
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={`app-container${isBoardDetail ? ' app-container--board' : ''}`}
      style={hideTopNav ? ({ ['--top-nav-height' as any]: '0px' } as React.CSSProperties) : undefined}
    >
      {!hideTopNav && (
      <nav className="top-nav">
        {/* ЛІВА ЧАСТИНА: Лого + Основне меню */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" className="nav-logo">Boardly</Link>

          <div className="nav-links-desktop">
            {user && (
              <>
                <Link to="/boards" className={`link ${isActive('/boards')}`}>
                  {t('nav.board')}
                </Link>
                <Link to="/my-cards" className={`link ${isActive('/my-cards')}`}>
                  {t('nav.myCards')}
                </Link>
              </>
            )}
            <Link to="/help" className={`link ${isActive('/help')}`}>
              {t('nav.help')}
            </Link>
            <Link to="/community" className={`link ${isActive('/community')}`}>
              {t('nav.community')}
            </Link>
          </div>
        </div>
        
        <div className="nav-right">
          {/* ПРАВА ЧАСТИНА: Дії користувача */}
          <div className={`nav-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {user ? (
              <div className="nav-actions-content">
                <div className="nav-actions-col nav-actions-primary">
                  <div className="mobile-only-links">
                    <Link to="/boards" className="link" onClick={closeMobileMenu}>{t('nav.board')}</Link>
                    <Link to="/my-cards" className="link" onClick={closeMobileMenu}>{t('nav.myCards')}</Link>
                    <Link to="/help" className="link" onClick={closeMobileMenu}>{t('nav.help')}</Link>
                    <Link to="/community" className="link" onClick={closeMobileMenu}>{t('nav.community')}</Link>
                  </div>

                </div>

                <div className="nav-actions-col nav-actions-secondary">
                  <LanguageSelect className="nav-lang-select" compact onLocaleChange={closeMobileMenu} />
                  
                  <Link to="/profile" className={`link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={closeMobileMenu}>
                    {/* Аватарка (кружечок) */}
                    <div className="nav-profile-avatar" style={{width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-blue)', color: 'white', fontWeight: 'bold'}}>
                      {resolvedAvatarUrl && !avatarFailed ? (
                        <img src={resolvedAvatarUrl} alt="Avatar" loading="lazy" decoding="async" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={() => setAvatarFailed(true)} />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span>{t('nav.profile')}</span>
                  </Link>

                  <button 
                    onClick={() => { handleLogout(); closeMobileMenu(); }}
                    className="btn-link" 
                    style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '8px' }}
                    title={t('nav.logout')}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-actions-content">
                <div className="nav-actions-col nav-actions-primary">
                  <div className="mobile-only-links">
                    <Link to="/help" className="link" onClick={closeMobileMenu}>{t('nav.help')}</Link>
                    <Link to="/community" className="link" onClick={closeMobileMenu}>{t('nav.community')}</Link>
                  </div>
                </div>
                <div className="nav-actions-col nav-actions-secondary">
                  <LanguageSelect className="nav-lang-select" compact onLocaleChange={closeMobileMenu} />
                  <Link to="/auth" className="btn btn-primary" style={{ padding: '8px 16px', width: 'auto' }}>
                    {t('auth.signIn')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user ? (
            <div className="nav-actions-mobile">
              <LanguageSelect className="nav-lang-select nav-lang-select-mobile" compact />
              <Link to="/profile" className="nav-mobile-profile" title={t('nav.profile')} aria-label={t('nav.profile')}>
                <div className="nav-profile-avatar" style={{width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-blue)', color: 'white', fontWeight: 'bold'}}>
                  {resolvedAvatarUrl && !avatarFailed ? (
                    <img src={resolvedAvatarUrl} alt="Avatar" loading="lazy" decoding="async" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={() => setAvatarFailed(true)} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
              <button className="btn-icon nav-mobile-logout" onClick={handleLogout} title={t('nav.logout')} aria-label={t('nav.logout')}>
                <FiLogOut aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary nav-mobile-signin">
              {t('auth.signIn')}
            </Link>
          )}
          
          {/* Мобільна кнопка меню */}
          <button 
            className="nav-menu-button" 
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={t('nav.menu')}
            aria-expanded={isMobileMenuOpen}
          >
            <FiMenu aria-hidden="true" />
          </button>
        </div>
      </nav>
      )}

      {!hideTopNav && isMobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={closeMobileMenu} />
      )}

      <main className="content-page">
        <Outlet />
      </main>
    </div>
  );
};
