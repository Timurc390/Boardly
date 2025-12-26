// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [themeInitialized, setThemeInitialized] = useState(false);

  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    theme: 'light',
  });

  useEffect(() => {
    if (user && !themeInitialized) {
      const currentTheme = user.profile?.theme || 'light';
      setTheme(currentTheme as 'light' | 'dark');
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: currentTheme,
      });
      setThemeInitialized(true);
    }
  }, [user, setTheme, themeInitialized]);

  const handleSave = async () => {
    try {
      const payload = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        profile: {
          organization: editData.organization,
          theme: theme,
        },
      };
      await updateProfile(payload as any);
      setIsEditing(false);
    } catch (error) {
      alert('Помилка збереження. Перевірте консоль.');
    }
  };

  const handleCancel = () => {
    if (user) {
      const currentTheme = user.profile?.theme || 'light';
      setTheme(currentTheme as 'light' | 'dark');
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: currentTheme,
      });
    }
    setIsEditing(false);
  };

  if (!user) return <div className="auth-container">Завантаження профілю...</div>;

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'dark-mode' : ''} style={{ minHeight: '100vh', background: isDark ? '#0f1720' : '#f4f6f8' }}>
      <div style={{ maxWidth: 1080, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, color: isDark ? '#e6eaef' : '#0b2744', fontSize: 26 }}>Профіль</h1>
          <p style={{ margin: '4px 0 0', color: isDark ? '#96a2b3' : '#5a6b7b' }}>Керування особистими даними та темою інтерфейсу.</p>
        </div>

        <div className="profile-card">
          <div
            style={{
              padding: '28px',
              borderBottom: '1px solid #DFE1E6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            className="profile-header"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#DFE1E6',
                  color: '#172B4D',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0' }}>
                  {user.first_name} {user.last_name}
                </h2>
                <div style={{ opacity: 0.7 }}>@{user.username}</div>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✎ Редагувати
              </button>
            )}
          </div>

          <div style={{ padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label className="form-label">Ім'я</label>
                {isEditing ? (
                  <input
                    className="form-input"
                    value={editData.first_name}
                    onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                  />
                ) : (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.first_name || '-'}</div>
                )}
              </div>

              <div>
                <label className="form-label">Прізвище</label>
                {isEditing ? (
                  <input className="form-input" value={editData.last_name} onChange={e => setEditData({ ...editData, last_name: e.target.value })} />
                ) : (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.last_name || '-'}</div>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Організація</label>
                {isEditing ? (
                  <input
                    className="form-input"
                    value={editData.organization}
                    onChange={e => setEditData({ ...editData, organization: e.target.value })}
                  />
                ) : (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.profile?.organization || 'Не вказано'}</div>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Тема</label>
                {isEditing ? (
                  <select
                    className="form-select"
                    value={theme}
                    onChange={e => {
                      const selected = e.target.value as 'light' | 'dark';
                      setTheme(selected);
                      setEditData({ ...editData, theme: selected });
                    }}
                  >
                    <option value="light">🌞 Світла</option>
                    <option value="dark">🌙 Темна</option>
                  </select>
                ) : (
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>
                    {user.profile?.theme === 'dark' ? '🌙 Темна' : '🌞 Світла'}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  Скасувати
                </button>
                <button onClick={handleSave} className="btn-success" style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', color: 'white' }}>
                  Зберегти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
