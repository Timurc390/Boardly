import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const FaqScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const closeMobileNav = () => setShowMobileNav(false);

  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link to="/board" className="nav-logo" onClick={closeMobileNav}>Boardly</Link>
        <button
          className="nav-menu-button"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label="Меню"
        >
          Меню
        </button>
        <div className={`nav-actions ${showMobileNav ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              <Link to="/board" className="link" onClick={closeMobileNav}>Дошка</Link>
              <Link to="/my-cards" className="link" onClick={closeMobileNav}>Мої картки</Link>
              <Link to="/profile" className="link" onClick={closeMobileNav}>Профіль</Link>
              <Link to="/faq" className="link" onClick={closeMobileNav}>FAQ</Link>
              <span className="nav-greeting">
                {user.first_name || user.username}
              </span>
              <button onClick={() => { closeMobileNav(); logout(); }} className="link" style={{ color: 'var(--accent-danger)' }}>
                Вийти
              </button>
            </>
          ) : (
            <Link to="/auth" className="link" onClick={closeMobileNav}>Увійти</Link>
          )}
        </div>
      </nav>
      <div className="content-page">
        <h2>FAQ</h2>
        <div className="faq-list">
          <div className="faq-item">
            <strong>Як створити дошку?</strong>
            <p>На сторінці дошки натисніть “Нова дошка” і введіть назву.</p>
          </div>
          <div className="faq-item">
            <strong>Як змінити тему?</strong>
            <p>Перейдіть у профіль та виберіть світлу або темну тему.</p>
          </div>
          <div className="faq-item">
            <strong>Як архівувати картку?</strong>
            <p>Відкрийте дошку та натисніть кнопку архівації на картці.</p>
          </div>
          <div className="faq-item">
            <strong>Гарячі клавіші</strong>
            <p>N — нова картка у поточному списку, / — фокус на пошук, Esc — закрити модалку картки.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
