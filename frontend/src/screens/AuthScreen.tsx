import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Додаємо useNavigate
import { useAuth } from '../context/AuthContext';

// ЗАМІНІТЬ НА ВАШ РЕАЛЬНИЙ CLIENT ID
const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

export const AuthScreen: React.FC = () => {
  // Дістаємо isAuthenticated з контексту
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate(); // Хук для перенаправлення
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ВАЖЛИВО: АВТОМАТИЧНЕ ПЕРЕНАПРАВЛЕННЯ ---
  useEffect(() => {
    if (isAuthenticated) {
      // Якщо ми авторизовані — одразу йдемо на головну (Профіль)
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  // ---------------------------------------------

  // --- GOOGLE AUTH INITIALIZATION ---
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
            window.google.accounts.id.renderButton(
              parent,
              { theme: "outline", size: "large", width: "320" } 
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
  }, [googleLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await register(formData);
      } else {
        // Використовуємо логін, який ввів користувач (це username)
        await login({ username: formData.username, password: formData.password });
      }
      // Тут не потрібно робити navigate('/'), бо спрацює useEffect вище
    } catch (err: any) {
      console.error(err);
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
      <div className="card">
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0052CC', marginBottom: '20px' }}>
            📋 Boardly
        </div>
        <h3 style={{ margin: '0 0 20px 0', color: '#5E6C84' }}>
            {isRegistering ? 'Створити акаунт' : 'Вхід в систему'}
        </h3>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Логин (Username)</label>
            <input
              className="form-input"
              type="text"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          {isRegistering && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ім'я</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Прізвище</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
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
            {loading ? 'Обробка...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}
          </button>
        </form>
        
        {!isRegistering && (
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <Link to="/forgot-password" style={{ color: '#0052CC', fontSize: '13px', textDecoration: 'none' }}>
              Забули пароль?
            </Link>
          </div>
        )}

        <div style={{ margin: '20px 0', color: '#888', fontSize: '14px' }}>— АБО —</div>

        <div id="googleSignInDiv" style={{ height: '44px', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}></div>

        <button
          className="btn-link"
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
        >
          {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
        </button>
      </div>
    </div>
  );
};