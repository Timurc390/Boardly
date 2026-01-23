import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

const KanbanPreview = () => (
  <div className="auth-right">
    <div className="board-wrapper">
      <div className="column-preview todo">
        <h3>До виконання</h3>
        <div className="card-preview">Дизайн сторінки входу</div>
      </div>
      <div className="column-preview progress">
        <h3>У процесі</h3>
        <div className="card-preview">Реалізувати drag & drop</div>
      </div>
      <div className="column-preview done">
        <h3>Готово</h3>
        <div className="card-preview">Створення дошки</div>
      </div>
    </div>
  </div>
);

export const LegacyAuthScreen: React.FC<{ defaultRegister?: boolean }> = ({ defaultRegister = false }) => {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(defaultRegister);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/board');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsRegistering(defaultRegister);
  }, [defaultRegister]);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        await googleLogin(response.credential);
      } catch {
        setError('Не вдалося увійти через Google.');
      }
    };
    const initBtn = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
        const p = document.getElementById("googleSignInDiv");
        if (p) window.google.accounts.id.renderButton(p, { theme: "filled_blue", size: "large", width: "400", shape: "rectangular" });
      } catch {
        setError('Не вдалося завантажити Google Sign-In.');
      }
    };
    if (!document.getElementById('google-client-script')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.id = 'google-client-script';
      s.async = true;
      s.defer = true;
      s.onload = initBtn;
      s.onerror = () => setError('Не вдалося завантажити Google Sign-In.');
      document.body.appendChild(s);
    } else {
      initBtn();
    }
  }, [googleLogin, isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) await register(formData);
      else await login({ username: formData.username, password: formData.password });
    } catch (err: any) {
      if (err.response?.data) {
        const d = err.response.data;
        const k = Object.keys(d)[0];
        setError(`${k}: ${d[k]}`);
      } else {
        setError('Помилка авторизації.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{isRegistering ? 'Створити акаунт' : 'Ласкаво просимо'}</h1>
        <p>{isRegistering ? 'Приєднуйтесь до Boardly та керуйте завданнями ефективно.' : 'Введіть свої дані, щоб увійти в систему.'}</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group"><label className="label">Ім'я</label><input className="input" type="text" placeholder="Іван" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required={isRegistering} /></div>
              <div className="form-group"><label className="label">Прізвище</label><input className="input" type="text" placeholder="Петренко" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required={isRegistering} /></div>
            </div>
          )}
          <div className="form-group"><label className="label">Логін</label><input className="input" type="text" placeholder="Ваш логін" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required /></div>
          <div className="form-group"><label className="label">Пароль</label><input className="input" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required /></div>
          {!isRegistering && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}><Link to="/forgot-password" className="link">Забули пароль?</Link></div>}
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Обробка...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}</button>
        </form>
        <div className="auth-footer"><span>{isRegistering ? 'Вже є акаунт? ' : 'Немає акаунту? '}</span><button className="link" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>{isRegistering ? 'Увійти' : 'Створити акаунт'}</button></div>
        <div className="google-wrapper"><div id="googleSignInDiv" style={{ height: '44px' }}></div></div>
      </div>
      <KanbanPreview />
    </div>
  );
};
