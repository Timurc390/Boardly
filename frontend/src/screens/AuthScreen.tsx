import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';
import { useI18n } from '../context/I18nContext';

// Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, registerUser, googleLoginUser, clearError } from '../store/slices/authSlice';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google: any;
  }
}

export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { isAuthenticated, loading, error: authError } = useAppSelector(state => state.auth);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/boards';

  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', organization: '' });
  
  // Використовуємо setLocalError для локальних повідомлень про помилки
  const [localError, setLocalError] = useState('');
  
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Очищення помилок при зміні режиму
  useEffect(() => {
    setLocalError('');
    dispatch(clearError());
  }, [isRegistering, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      if (isRegistering) {
        navigate('/boards', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, isRegistering]);

  useEffect(() => {
    if (window.google) {
        setGoogleScriptLoaded(true);
        return;
    }
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleGoogleClick = () => {
    if (!window.google) return;
    if (!GOOGLE_CLIENT_ID) {
      setLocalError(t('auth.googleError'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (response: any) => {
        if (response.access_token) {
          try {
            await dispatch(googleLoginUser({ access_token: response.access_token })).unwrap();
          } catch (err: any) {
            console.error("Google Auth Error:", err);
            setLocalError(t('auth.googleError'));
          }
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (isRegistering) {
        if (formData.password !== confirmPassword) {
          setLocalError(t('auth.passwordMismatch'));
          return;
        }
        const emailValue = formData.email?.trim();
        const emailValid = !!emailValue && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue);
        if (!emailValid) {
          setLocalError(t('auth.invalidEmail'));
          return;
        }
        if ((formData.password || '').length < 8) {
          setLocalError(t('auth.passwordTooShort', { min: '8' }));
          return;
        }
        if (!acceptPolicy) {
          setLocalError(t('auth.policyRequired'));
          return;
        }
    }

    try {
      if (isRegistering) {
        await dispatch(registerUser(formData)).unwrap();
        setRegistrationSuccess(true);
      } else {
        await dispatch(loginUser({ username: formData.username, password: formData.password })).unwrap();
      }
    } catch (err: any) {
      if (err && typeof err === 'object') {
         if (err.email) setLocalError(err.email[0]);
         else if (err.non_field_errors) setLocalError(err.non_field_errors[0]);
         else if (err.detail) setLocalError(err.detail);
         else setLocalError(t('auth.loginError'));
      } else {
         setLocalError(t('common.noConnection'));
      }
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-page-split">
        <div className="auth-left" style={{ textAlign: 'center' }}>
          <div className="auth-header">
            <h1>{t('auth.registerSuccessTitle')}</h1>
            <p>{t('auth.registerSuccessHint', { email: formData.email })}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setRegistrationSuccess(false); setIsRegistering(false); }}>{t('auth.backToLogin')}</button>
        </div>
        <div className="auth-right"><KanbanPreview /></div>
      </div>
    );
  }

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div>
          <div className="auth-header">
            <h1>Boardly</h1>
            <p>{isRegistering ? t('auth.joinBoardly') : t('auth.enterDetails')}</p>
          </div>

          {(localError || authError) && (
              <div style={{ color: '#ff6b6b', marginBottom: 20, fontSize: 14 }}>
                  {localError || authError}
              </div>
          )}

          <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <input
                    className="input"
                    placeholder={t('auth.firstName')}
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    autoComplete="given-name"
                    name="first_name"
                  />
                  <input
                    className="input"
                    placeholder={t('auth.lastName')}
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    autoComplete="family-name"
                    name="last_name"
                  />
                </div>
              )}
              
              {isRegistering && (
                <div className="form-group">
                  <input
                    className="input"
                    type="email"
                    placeholder={t('auth.email')}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    autoComplete="email"
                    name="email"
                    required
                  />
                </div>
              )}

              {isRegistering && (
                  <div className="form-group">
                      <input
                        className="input"
                        placeholder={t('auth.organizationOptional')}
                        value={formData.organization}
                        onChange={e => setFormData({...formData, organization: e.target.value})}
                        autoComplete="organization"
                        name="organization"
                      />
                  </div>
              )}

              <div className="form-group">
                <input 
                  className="input" 
                  placeholder={isRegistering ? t('auth.username') : t('auth.usernameOrEmail')} 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  autoComplete="username"
                  name="username"
                  required 
                />
              </div>
              
              <div className="form-group" style={{position: 'relative'}}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.password')}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  name={isRegistering ? 'new-password' : 'current-password'}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'}}>{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</button>
              </div>

              {isRegistering && (
                <>
                  <div className="form-group" style={{position: 'relative'}}>
                    <input
                      className="input"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('auth.confirmPassword')}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      name="confirm-password"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'}}>{showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" id="policy-check" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} style={{ marginTop: '3px', cursor: 'pointer' }} />
                    <label htmlFor="policy-check" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
                      {t('auth.policyPrefix')}{' '}
                      <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}>
                        {t('auth.policyLink')}
                      </Link>
                    </label>
                  </div>
                </>
              )}

              {!isRegistering && (
                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                  <Link to="/forgot-password" style={{ fontSize: '13px', color: '#888' }}>{t('auth.forgotPassword')}</Link>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('auth.processing') : (isRegistering ? t('auth.createAccount') : t('auth.signIn'))}
              </button>
          </form>

          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', color: '#555', fontSize: '12px' }}>
              <div style={{ flex: 1, height: 1, background: '#333' }}></div>
              <span style={{ padding: '0 10px' }}>{t('common.or')}</span>
              <div style={{ flex: 1, height: 1, background: '#333' }}></div>
          </div>

          <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleClick}
              disabled={!googleScriptLoaded}
              style={{ width: '100%', background: 'white', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 600 }}
          >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"></path>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.716H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"></path>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"></path>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.271C4.672 5.14 6.656 3.58 9 3.58z" fill="#EA4335"></path>
              </svg>
              {t('auth.googleSignIn')}
          </button>

          <div className="auth-footer">
            {isRegistering ? t('auth.hasAccount') : t('auth.noAccount')}
            <button className="btn-link" onClick={() => { setIsRegistering(!isRegistering); setLocalError(''); }}>
              {isRegistering ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <KanbanPreview />
      </div>
    </div>
  );
};
