import React, { useState } from 'react';
import { Link } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetUserPassword } from '../store/slices/authSlice';

export const ForgotPasswordScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await dispatch(resetUserPassword(email));
      setStatus('success');
    } catch (error) {
      setStatus('error');
      // Для безпеки краще писати загальне повідомлення, навіть якщо email не знайдено
      setErrorMsg('Якщо цей email зареєстрований, ми відправили інструкції.');
    }
  };

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div className="auth-header">
           <h1>🔐 Відновлення</h1>
           <p>Введіть вашу пошту, і ми надішлемо посилання для створення нового паролю.</p>
        </div>

        {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--col-progress)', marginBottom: '12px' }}>Лист відправлено! ✉️</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                Ми надіслали інструкції на <strong>{email}</strong>.<br/>
                Перевірте папку "Вхідні" та "Спам".
              </p>
              <Link to="/auth" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                Повернутися до входу
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
                            placeholder="Ваш Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <Button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Відправка...' : 'Відновити пароль'}
                    </Button>
                </form>

                <div className="auth-footer">
                    <Link to="/auth" className="btn-link">
                        ← Назад до входу
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