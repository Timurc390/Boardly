import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// ВИПРАВЛЕНО: Імпортуємо Redux хуки та потрібну дію
import { useAppDispatch } from '../store/hooks';
import { activateUserAccount } from '../store/slices/authSlice';
import { useI18n } from '../context/I18nContext';

export const ActivationScreen: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Отримуємо диспетчер
  const { t } = useI18n();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const performActivation = async () => {
      if (!uid || !token) {
        setStatus('error');
        return;
      }
      try {
        // ВИПРАВЛЕНО: Викликаємо дію через dispatch
        // .unwrap() дозволяє обробити результат як звичайний Promise
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
    <div className="auth-page-split" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-left" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div className="auth-header">
          <h1>Boardly.</h1>
        </div>

        {status === 'loading' && (
          <div>
            <h3>{t('activation.loadingTitle')}</h3>
            <p>{t('activation.loadingHint')}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <h3 style={{ color: 'var(--col-progress)' }}>{t('activation.successTitle')}</h3>
            <p>{t('activation.successHint')}</p>
            <Link to="/auth" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block', textDecoration: 'none' }}>
              {t('activation.signIn')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h3 style={{ color: 'var(--danger)' }}>{t('activation.errorTitle')}</h3>
            <p>{t('activation.errorHint')}</p>
            <Link to="/auth" className="btn btn-secondary" style={{ marginTop: 20, display: 'inline-block', textDecoration: 'none' }}>
              {t('activation.back')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
