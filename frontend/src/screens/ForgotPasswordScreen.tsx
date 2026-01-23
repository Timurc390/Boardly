import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
      setErrorMsg('Не вдалося знайти користувача або сталася помилка.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
           <div className="auth-logo">🔐 Відновлення</div>
        </div>

        <div className="auth-card">
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>Лист відправлено!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Перевірте вашу пошту, щоб знайти посилання для скидання паролю.
              </p>
              <Link to="/auth" className="btn btn-primary btn-full" style={{ textDecoration: 'none' }}>
                Повернутися до входу
              </Link>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                Введіть ваш email, і ми надішлемо інструкції для відновлення.
              </p>

              {status === 'error' && (
                <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
                    {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />

                <Button type="submit" className="btn-full" isLoading={status === 'loading'}>
                  Відновити пароль
                </Button>
              </form>

              <div className="auth-footer">
                <Link to="/auth" className="btn-link" style={{ fontSize: '14px' }}>
                  ← Я згадав пароль
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};