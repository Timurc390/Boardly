import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiLock } from 'shared/ui/fiIcons';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';
import { useI18n } from '../context/I18nContext';

import { useAppDispatch } from '../store/hooks';
import { resetUserPassword } from '../store/slices/authSlice';

export const ForgotPasswordScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await dispatch(resetUserPassword(email)).unwrap();
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      const payload = error?.payload ?? error;
      if (payload?.detail) {
        setErrorMsg(String(payload.detail));
        return;
      }
      setErrorMsg(t('passwordReset.error'));
    }
  };

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div className="auth-header">
           <h1><FiLock aria-hidden="true" /> {t('passwordReset.title')}</h1>
           <p>{t('passwordReset.description')}</p>
        </div>

        {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--col-progress)', marginBottom: '12px' }}>{t('passwordReset.successTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                {t('passwordReset.successDetail', { email: email || t('passwordReset.emailPlaceholder') })}<br/>
                {t('passwordReset.successHint')}
              </p>
              <Link to="/auth" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                {t('passwordReset.backToLogin')}
              </Link>
            </div>
        ) : (
            <>
                {status === 'error' && (
                    <div style={{ color: 'var(--danger)', marginBottom: 20, fontSize: 14, background: 'rgba(255, 107, 107, 0.1)', padding: 10, borderRadius: 8 }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <Input
                            type="email"
                            placeholder={t('passwordReset.emailPlaceholder')}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            name="email"
                            required
                            autoFocus
                        />
                    </div>

                    <Button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                        {status === 'loading' ? t('passwordReset.sending') : t('passwordReset.submit')}
                    </Button>
                </form>

                <div className="auth-footer">
                    <Link to="/auth" className="btn-link">
                        <FiArrowLeft aria-hidden="true" /> {t('passwordReset.backToLogin')}
                    </Link>
                </div>
            </>
        )}
      </div>
      <div className="auth-right">
        <KanbanPreview />
      </div>
    </div>
  );
};
