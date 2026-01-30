import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';

import { useAppDispatch, useAppSelector } from '../store/hooks';

export const LandingScreen: React.FC = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('landing-no-scroll');
    document.documentElement.classList.add('landing-no-scroll');

    return () => {
      document.body.classList.remove('landing-no-scroll');
      document.documentElement.classList.remove('landing-no-scroll');
    };
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-inner">
          <div className="landing-top">
            <div className="landing-brand">
              <img className="landing-brand-icon" src="/anti-trello-logo.png" alt="Anti TRELLO" />
              <span>Anti TRELLO</span>
            </div>
            <div className="landing-logo">Boardly</div>
            <div className="landing-spacer" />
          </div>

          <div className="landing-hero">
            <div className="landing-copy">
              <h1>
                Фіксуйте,
                <br />
                упорядковуйте
                <br />
                й виконуйте завдання
                <br />
                будь-де.
              </h1>
              <p>
                Залиште безлад і хаос позаду —
                <br />
                реалізуйте свій потенціал і
                <br />
                підвищте продуктивність завдяки Boardly.
              </p>
              
              {/* Умовний рендер кнопки */}
              {isAuthenticated ? (
                <Link className="landing-cta" to="/boards">
                  Перейти до роботи
                </Link>
              ) : (
                <Link className="landing-cta" to="/auth?mode=register">
                  Sign up for free !
                </Link>
              )}
            </div>

            <div className="landing-media">
              <img src="/phone-hand.png" alt="Boardly on phone" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};