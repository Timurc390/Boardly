import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
// ВИПРАВЛЕНО: Redux
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';

import { useI18n } from '../../context/I18nContext';
import { LanguageSelect } from '../LanguageSelect';

export const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  // Беремо юзера зі стору
  const { user } = useAppSelector(state => state.auth);
  
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const avatarUrl = user?.profile?.avatar_url || user?.profile?.avatar || '';

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Функція для перевірки активного посилання
  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const isBoardRoute = location.pathname.startsWith('/boards/');

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

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

              {isBoardRoute && (
                <input
                  className="form-input"
                  placeholder="Пошук..."
                  value={new URLSearchParams(location.search).get('q') || ''}
                  onChange={(e) => updateSearch(e.target.value)}
                  style={{ width: 200 }}
                />
              )}

              <LanguageSelect className="nav-lang-select" compact />
              
              <Link to="/profile" className={`link ${isActive('/profile')}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {/* Аватарка (кружечок) */}
                 <div className="nav-profile-avatar" style={{width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-blue)', color: 'white', fontWeight: 'bold'}}>
                   {avatarUrl ? (
                     <img src={avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                   ) : (
                     user.username.charAt(0).toUpperCase()
                   )}
                 </div>
                 <span>{t('nav.profile')}</span>
              </Link>

              <button 
                onClick={handleLogout} 
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
