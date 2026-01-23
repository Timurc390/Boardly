import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { LanguageSelect } from '../LanguageSelect';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const avatarUrl = user?.profile?.avatar_url || user?.profile?.avatar || '';

  // Функція для перевірки активного посилання
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-container">
      <nav className="top-nav">
        {/* ЛІВА ЧАСТИНА: Лого + Основне меню */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/" className="nav-logo">Boardly</Link>
          
          {user && (
            <div className="nav-links-desktop">
              <Link to="/boards" className={`link ${isActive('/boards')}`}>
                {t('nav.board')}
              </Link>
              <Link to="/my-cards" className={`link ${isActive('/my-cards')}`}>
                {t('nav.myCards')}
              </Link>
            </div>
          )}
        </div>
        
        {/* ПРАВА ЧАСТИНА: Дії користувача */}
        <div className={`nav-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              {/* Ці посилання будуть тут для мобільної версії */}
              <div className="mobile-only-links">
                 <Link to="/boards" className="link">{t('nav.board')}</Link>
                 <Link to="/my-cards" className="link">{t('nav.myCards')}</Link>
              </div>

              <LanguageSelect className="nav-lang-select" compact />
              
              <Link to="/profile" className={`link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {/* Аватарка (кружечок) */}
                 <div className="nav-profile-avatar">
                   {avatarUrl ? (
                     <img src={avatarUrl} alt={t('profile.avatarAlt')} />
                   ) : (
                     user.username.charAt(0).toUpperCase()
                   )}
                 </div>
                 <span>{t('nav.profile')}</span>
              </Link>

              <button 
                onClick={logout} 
                className="btn-link" 
                style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '8px' }}
                title={t('nav.logout')}
              >
                Вийти
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: '8px 16px', width: 'auto' }}>
              {t('auth.signIn')}
            </Link>
          )}
        </div>
        
        {/* Мобільна кнопка меню */}
        <button 
          className="nav-menu-button" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
      </nav>

      <main className="content-page">
        <Outlet />
      </main>
    </div>
  );
};
