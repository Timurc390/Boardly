import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext.tsx.bak';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KanbanPreview } from '../components/KanbanPreview';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { confirmUserPasswordReset } from '../store/slices/authSlice';

export const ResetPasswordConfirmScreen: React.FC = () => {
  const dispatch = useAppDispatch();
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
      setErrorMessage("Паролі не співпадають");
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
          if (Array.isArray(firstVal)) setErrorMessage(String(firstVal[0]));
          else setErrorMessage('Посилання недійсне або пароль занадто простий.');
      } else {
          setErrorMessage('Сталася помилка при з\'єднанні з сервером.');
      }
    }
  };

  return (
    <div className="auth-page-split">
      <div className="auth-left">
        <div className="auth-header">
           <h1>🔐 Новий пароль</h1>
           <p>Створіть новий надійний пароль для вашого акаунту.</p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--col-progress)', marginBottom: '12px' }}>Пароль успішно змінено! 🎉</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Зараз вас перенаправить на сторінку входу...
            </p>
            <Link to="/auth" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              Увійти з новим паролем
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
                required
                minLength={8}
                placeholder="Новий пароль"
              />
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="form-group">
              <Input
                type="password"
                value={reNewPassword}
                onChange={e => setReNewPassword(e.target.value)}
                required
                placeholder="Підтвердження паролю"
              />
            </div>

            <Button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Збереження...' : 'Змінити пароль'}
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