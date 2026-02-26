import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiAlertCircle, FiCheck } from 'shared/ui/fiIcons';
import { useAppDispatch } from '../store/hooks';
import { activateUserAccount } from '../store/slices/authSlice';
import { useI18n } from '../context/I18nContext';

export const ActivationScreen: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const performActivation = async () => {
      if (!uid || !token) {
        setStatus('error');
        return;
      }
      try {
        await dispatch(activateUserAccount({ uid, token })).unwrap();
        setStatus('success');
      } catch (error) {
        console.error("Activation failed:", error);
        setStatus('error');
      }
    };

    performActivation();
  }, [uid, token, dispatch]);

  return (
    <div className="activation-page">
      <div className="activation-glow activation-glow-left" aria-hidden="true" />
      <div className="activation-glow activation-glow-right" aria-hidden="true" />

      <div className="activation-card">
        <div className="activation-brand">Boardly</div>

        {status === 'loading' && (
          <div className="activation-state">
            <div className="activation-spinner" aria-hidden="true" />
            <h1 className="activation-title">{t('activation.loadingTitle')}</h1>
            <p className="activation-text">{t('activation.loadingHint')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="activation-state">
            <div className="activation-icon success" aria-hidden="true"><FiCheck /></div>
            <h1 className="activation-title success">{t('activation.successTitle')}</h1>
            <p className="activation-text">{t('activation.successHint')}</p>
            <Link to="/auth" className="activation-action">
              {t('activation.signIn')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="activation-state">
            <div className="activation-icon error" aria-hidden="true"><FiAlertCircle /></div>
            <h1 className="activation-title error">{t('activation.errorTitle')}</h1>
            <p className="activation-text">{t('activation.errorHint')}</p>
            <Link to="/auth" className="activation-action secondary">
              {t('activation.back')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
