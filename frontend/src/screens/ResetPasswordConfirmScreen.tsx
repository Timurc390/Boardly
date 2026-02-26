import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock } from 'shared/ui/fiIcons';
import { KanbanPreview } from '../components/KanbanPreview';
import { useI18n } from '../context/I18nContext';
import { useAppDispatch } from '../store/hooks';
import { confirmUserPasswordReset } from '../store/slices/authSlice';

export const ResetPasswordConfirmScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!uid || !token) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(t('resetConfirm.errorInvalidLink'));
        }
        return;
      }

      try {
        await dispatch(confirmUserPasswordReset({ uid, token })).unwrap();
        if (!cancelled) {
          setStatus('success');
          setTimeout(() => navigate('/auth'), 2500);
        }
      } catch (error: any) {
        if (cancelled) return;
        setStatus('error');
        const payload = error?.payload ?? error;
        if (typeof payload === 'string') {
          setErrorMessage(payload);
          return;
        }
        if (payload?.detail) {
          setErrorMessage(String(payload.detail));
          return;
        }
        const firstKey = payload && typeof payload === 'object' ? Object.keys(payload)[0] : null;
        if (firstKey && Array.isArray(payload[firstKey]) && payload[firstKey].length) {
          setErrorMessage(String(payload[firstKey][0]));
          return;
        }
        setErrorMessage(t('resetConfirm.errorUnknown'));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, uid, token, navigate, t]);

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div className="auth-header">
          <h1><FiLock aria-hidden="true" /> {status === 'success' ? t('resetConfirm.successTitle') : t('common.loading')}</h1>
          <p>
            {status === 'success'
              ? t('resetConfirm.successHint')
              : status === 'error'
                ? t('resetConfirm.errorInvalidLink')
                : t('common.loading')}
          </p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--col-progress)', marginBottom: '12px' }}>{t('resetConfirm.successTitle')}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {t('resetConfirm.successHint')}
            </p>
            <Link to="/auth" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              {t('resetConfirm.successAction')}
            </Link>
          </div>
        ) : status === 'error' ? (
          <>
            {errorMessage && (
              <div style={{ color: 'var(--danger)', marginBottom: 20, fontSize: 14, background: 'rgba(255, 107, 107, 0.1)', padding: 10, borderRadius: 8 }}>
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('resetConfirm.saving')}</div>
        )}
      </div>
      <div className="auth-right">
        <KanbanPreview />
      </div>
    </div>
  );
};
