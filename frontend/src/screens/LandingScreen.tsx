import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useI18n } from '../context/I18nContext';

export const LandingScreen: React.FC = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const { t } = useI18n();

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
                {t('landing.hero.line1')}
                <br />
                {t('landing.hero.line2')}
                <br />
                {t('landing.hero.line3')}
                <br />
                {t('landing.hero.line4')}
              </h1>
              <p>
                {t('landing.copy.line1')}
                <br />
                {t('landing.copy.line2')}
                <br />
                {t('landing.copy.line3')}
              </p>
              
              {/* Умовний рендер кнопки */}
              {isAuthenticated ? (
                <Link className="landing-cta" to="/boards">
                  {t('landing.cta.openApp')}
                </Link>
              ) : (
                <Link className="landing-cta" to="/auth?mode=register">
                  {t('landing.cta.signUp')}
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
