// src/screens/AuthScreen.tsx
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
        // Обробка помилок від DRF/Djoser
        const firstErrorKey = Object.keys(err.response.data)[0];
        const msg = err.response.data[firstErrorKey];
        setError(`${firstErrorKey}: ${Array.isArray(msg) ? msg[0] : msg}`);
      } else {
        setError('Помилка з\'єднання з сервером');
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
        <div style={{ marginBottom: '20px', fontWeight: 600, color: '#5E6C84' }}>
            {isRegistering ? 'Створити акаунт' : 'Вхід в систему'}
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Логін</label>
            <input
              className="form-input"
              type="text"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          {isRegistering && (
            <div style={{ display: 'flex', gap: '15px' }}>
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
            {loading ? 'Обробка...' : isRegistering ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>

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