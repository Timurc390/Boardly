import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';
import { useI18n } from '../context/I18nContext';

import { useAppDispatch } from '../store/hooks';
import { confirmUserPasswordReset } from '../store/slices/authSlice';

export const ResetPasswordConfirmScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  
  const [newPassword, setNewPassword] = useState('');
  const [reNewPassword, setReNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (newPassword !== reNewPassword) {
      setErrorMessage(t('resetConfirm.errorMismatch'));
      return;
    }
    
    setStatus('loading');
    try {
      await dispatch(confirmUserPasswordReset({
        uid,
        token,
        new_password: newPassword,
        re_new_password: reNewPassword
      }));
      setStatus('success');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (error: any) {
      setStatus('error');
      if (error.response?.data) {
          const data = error.response.data;
          const firstVal = Object.values(data)[0];
          if (Array.isArray(firstVal)) setErrorMessage(t('resetConfirm.errorPassword', { message: String(firstVal[0]) }));
          else setErrorMessage(t('resetConfirm.errorInvalidLink'));
      } else {
          setErrorMessage(t('resetConfirm.errorUnknown'));
      }
    }
  };

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div className="auth-header">
           <h1>🔐 {t('resetConfirm.title')}</h1>
           <p>{t('resetConfirm.description')}</p>
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
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
                <div style={{ color: 'var(--danger)', marginBottom: 20, fontSize: 14, background: 'rgba(255, 107, 107, 0.1)', padding: 10, borderRadius: 8 }}>
                    {errorMessage}
                </div>
            )}
            
            <div className="form-group" style={{ position: 'relative' }}>
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                name="new-password"
                required
                minLength={8}
                placeholder={t('resetConfirm.newPasswordPlaceholder')}
              />
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'
                }}
              >
                {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              </button>
            </div>

            <div className="form-group">
              <Input
                type="password"
                value={reNewPassword}
                onChange={e => setReNewPassword(e.target.value)}
                autoComplete="new-password"
                name="confirm-new-password"
                required
                placeholder={t('resetConfirm.confirmPasswordPlaceholder')}
              />
            </div>

            <Button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? t('resetConfirm.saving') : t('resetConfirm.submit')}
            </Button>
          </form>
        )}
      </div>
      <div className="auth-right">
        <KanbanPreview />
      </div>
    </div>
  );
};
