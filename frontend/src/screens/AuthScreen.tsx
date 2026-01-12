import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ВАШ CLIENT ID
const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

export const AuthScreen: React.FC = () => {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Авто-редирект
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Google Script Init
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        await googleLogin(response.credential);
      } catch (err) {
        console.error(err);
        setError('Не вдалося увійти через Google.');
      }
    };

    const initializeGoogleButton = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
        });
        
        const parent = document.getElementById("googleSignInDiv");
        if (parent) {
            // Використовуємо 'filled_blue' або 'outline' в залежності від стилю
            window.google.accounts.id.renderButton(
              parent,
              { theme: "outline", size: "large", width: "320", shape: "rectangular" } 
            );
        }
      }
    };

    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-client-script';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.body.appendChild(script);
    } else {
      initializeGoogleButton();
    }
  }, [googleLogin, isRegistering]); // Перемальовуємо кнопку при зміні режиму

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await register(formData);
      } else {
        await login({ username: formData.username, password: formData.password });
      }
    } catch (err: any) {
      if (err.response?.data) {
         const data = err.response.data;
         const key = Object.keys(data)[0];
         const val = data[key];
         setError(`${key}: ${Array.isArray(val) ? val[0] : val}`);
      } else {
         setError('Помилка авторизації.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Затемнення фону */}
      <div className="auth-overlay"></div>

      <div className="card">
        <div className="logo-area">
            <span>📋</span> Boardly
        </div>
        
        <div className="auth-title">
            {isRegistering ? 'Створіть свій акаунт' : 'Увійдіть в Boardly'}
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ім'я</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Іван"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                  required={isRegistering}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Прізвище</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Петренко"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                  required={isRegistering}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Логін</label>
            <input
              className="form-input"
              type="text"
              placeholder="Введіть ваш логін"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn ${isRegistering ? 'btn-success' : 'btn-primary'}`}
          >
            {loading ? 'Зачекайте...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}
          </button>
        </form>
        
        {/* Кнопки перемикання та відновлення */}
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn-link"
              style={{ margin: 0, fontSize: '13px' }}
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            >
              {isRegistering ? 'Маєте акаунт? Увійти' : 'Реєстрація'}
            </button>

            {!isRegistering && (
                <Link to="/forgot-password" style={{ color: '#0052CC', fontSize: '13px', textDecoration: 'none' }}>
                  Забули пароль?
                </Link>
            )}
        </div>

        {/* Google Button Section */}
        <div className="google-btn-container">
             <div id="googleSignInDiv" style={{ height: '40px' }}></div>
        </div>
      </div>
    </div>
  );
};