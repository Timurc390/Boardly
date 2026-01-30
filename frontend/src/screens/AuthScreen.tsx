import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';

// Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, registerUser, googleLoginUser, clearError } from '../store/slices/authSlice';

const GOOGLE_CLIENT_ID = '374249918192-1mtc1h12qqq33tvrj4g7jkbqat8udrbk.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

export const AuthScreen: React.FC = () => {
  const dispatch = useAppDispatch();
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
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response: any) => {
        if (response.code) {
          try {
            await dispatch(googleLoginUser(response.code)).unwrap();
          } catch (err: any) {
            console.error("Google Auth Error:", err);
            setLocalError('Не вдалося увійти через Google.');
          }
        }
      },
    });
    client.requestCode();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (isRegistering) {
        if (formData.password !== confirmPassword) {
          setLocalError('Паролі не співпадають');
          return;
        }
        if (!acceptPolicy) {
          setLocalError('Будь ласка, погодьтеся з політикою конфіденційності.');
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
         else setLocalError('Помилка авторизації.');
      } else {
         setLocalError('Помилка з\'єднання.');
      }
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-page-split">
        <div className="auth-left" style={{ textAlign: 'center' }}>
          <div className="auth-header">
            <h1>Перевірте пошту! ✉️</h1>
            <p>Ми відправили посилання для активації на <strong>{formData.email}</strong>.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setRegistrationSuccess(false); setIsRegistering(false); }}>Повернутися до входу</button>
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
            <p>{isRegistering ? 'Створіть простір для продуктивності.' : 'Впорядкуйте свої задачі.'}</p>
          </div>

          {(localError || authError) && (
              <div style={{ color: '#ff6b6b', marginBottom: 20, fontSize: 14 }}>
                  {localError || authError}
              </div>
          )}

          <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <input className="input" placeholder="Ім'я" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                  <input className="input" placeholder="Прізвище" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              )}
              
              {isRegistering && (
                <div className="form-group">
                  <input className="input" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
              )}

              {isRegistering && (
                  <div className="form-group">
                      <input className="input" placeholder="Організація (необов'язково)" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
                  </div>
              )}

              <div className="form-group">
                <input 
                  className="input" 
                  placeholder={isRegistering ? "Логін" : "Логін або Email"} 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="form-group" style={{position: 'relative'}}>
                <input className="input" type={showPassword ? "text" : "password"} placeholder="Пароль" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'}}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>

              {isRegistering && (
                <>
                  <div className="form-group" style={{position: 'relative'}}>
                    <input className="input" type={showConfirmPassword ? "text" : "password"} placeholder="Підтвердження паролю" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'}}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" id="policy-check" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} style={{ marginTop: '3px', cursor: 'pointer' }} />
                    <label htmlFor="policy-check" style={{ cursor: 'pointer', lineHeight: '1.4' }}>Я погоджуюсь з <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}>Політикою конфіденційності</Link></label>
                  </div>
                </>
              )}

              {!isRegistering && (
                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                  <Link to="/forgot-password" style={{ fontSize: '13px', color: '#888' }}>Забули пароль?</Link>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Зачекайте...' : (isRegistering ? 'Створити акаунт' : 'Увійти')}
              </button>
          </form>

          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', color: '#555', fontSize: '12px' }}>
              <div style={{ flex: 1, height: 1, background: '#333' }}></div>
              <span style={{ padding: '0 10px' }}>АБО</span>
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
              Увійти через Google
          </button>

          <div className="auth-footer">
            {isRegistering ? 'Вже є акаунт?' : 'Ще немає акаунту?'}
            <button className="btn-link" onClick={() => { setIsRegistering(!isRegistering); setLocalError(''); }}>
              {isRegistering ? 'Увійти' : 'Зареєструватися'}
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