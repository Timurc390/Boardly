import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordConfirmScreen: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const { resetPasswordConfirm } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [reNewPassword, setReNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (newPassword !== reNewPassword) {
      setErrorMessage("Паролі не співпадають");
      return;
    }
    
    setStatus('loading');
    try {
      await resetPasswordConfirm({
        uid,
        token,
        new_password: newPassword,
        re_new_password: reNewPassword
      });
      setStatus('success');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (error: any) {
      setStatus('error');
      // Обробка помилок від Djoser/Django
      if (error.response && error.response.data) {
        const data = error.response.data;
        // Беремо першу помилку з об'єкта відповіді
        const firstKey = Object.keys(data)[0];
        const errorText = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        
        // Перекладаємо стандартні помилки (опціонально)
        if (firstKey === 'new_password') {
             setErrorMessage(`Пароль: ${errorText}`);
        } else if (firstKey === 'token') {
             setErrorMessage('Посилання для скидання недійсне або застаріло.');
        } else {
             setErrorMessage(`${firstKey}: ${errorText}`);
        }
      } else {
        setErrorMessage('Сталася невідома помилка. Спробуйте ще раз.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0052CC', marginBottom: '20px' }}>
            🔒 Новий пароль
        </div>

        {status === 'success' ? (
          <div>
            <h3 style={{ color: '#5AAC44' }}>Успішно!</h3>
            <p>Пароль змінено. Зараз вас перенаправить на сторінку входу...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Новий пароль</label>
              <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Мінімум 8 символів"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Підтвердження паролю</label>
              <input
                className="form-input"
                type="password"
                value={reNewPassword}
                onChange={e => setReNewPassword(e.target.value)}
                required
                placeholder="Повторіть пароль"
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={status === 'loading'}>
              {status === 'loading' ? 'Збереження...' : 'Змінити пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};