import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Використовуємо Link замість перемикання станів
import { useAuth } from '../context/AuthContext';

export const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await resetPassword(email);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMsg('Не вдалося знайти користувача з таким email або сталася помилка.');
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0052CC', marginBottom: '20px' }}>
            🔐 Відновлення
        </div>
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#5AAC44' }}>Лист відправлено!</h3>
            <p style={{ color: '#5E6C84', marginBottom: '20px' }}>
              Перевірте вашу пошту (або консоль розробника Django), щоб знайти посилання для скидання паролю.
            </p>
            <Link to="/auth" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
              Повернутися до входу
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: '#5E6C84', marginBottom: '20px' }}>
              Введіть вашу електронну пошту, і ми надішлемо вам посилання для відновлення доступу.
            </p>

            {status === 'error' && <div className="error-message">{errorMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Відправка...' : 'Відновити пароль'}
              </button>
            </form>

            <Link to="/auth" className="btn-link" style={{ display: 'block', marginTop: '15px' }}>
              Я згадав пароль
            </Link>
          </>
        )}
      </div>
    </div>
  );
};