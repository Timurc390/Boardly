import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AuthComponent: React.FC = () => {
  const { isAuthenticated, login, register, logout, fetchUsers } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [isAuthenticated]); // Оновлюємо список при зміні статусу автентифікації

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError('Не вдалося завантажити список користувачів (Можливо, проблеми з токеном).');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ username, password });
        alert('Реєстрація успішна! Ви залогінені.');
      } else {
        await login({ username, password });
        alert('Логін успішний!');
      }
    } catch (err) {
      setError('Помилка автентифікації. Перевірте логін та пароль.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Стилі для кращого вигляду
  const containerStyle = {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };
  const inputStyle = {
    width: '100%',
    padding: '10px',
    margin: '8px 0',
    borderRadius: '4px',
    border: '1px solid #ddd'
  };
  const buttonStyle = {
    width: '100%',
    padding: '10px',
    margin: '10px 0 5px 0',
    backgroundColor: isRegistering ? '#38a169' : '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  if (!isAuthenticated) {
    return (
      <div style={containerStyle}>
        <h2>{isRegistering ? 'Реєстрація' : 'Вхід'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ім'я користувача"
            style={inputStyle as React.CSSProperties}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            style={inputStyle as React.CSSProperties}
            required
          />
          <button type="submit" style={buttonStyle as React.CSSProperties} disabled={loading}>
            {loading ? 'Завантаження...' : isRegistering ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ ...buttonStyle, backgroundColor: '#718096' } as React.CSSProperties}
          disabled={loading}
        >
          {isRegistering ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Реєстрація'}
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2>Список усіх користувачів (Захищений API)</h2>
      <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Успішна аутентифікація. Токен надіслано.</p>
      <button onClick={logout} style={{ ...buttonStyle, backgroundColor: '#e53e3e' } as React.CSSProperties}>
        Вийти
      </button>
      
      {loading ? (
        <p>Завантаження користувачів...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {users.map((u) => (
            <li key={u.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
              <strong>{u.username}</strong> ({u.email || 'N/A'})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuthComponent;