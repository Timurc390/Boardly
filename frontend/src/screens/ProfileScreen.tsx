// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    theme: 'light'
  });

  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        organization: user.profile?.organization || '',
        theme: user.profile?.theme || 'light'
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      // Формуємо об'єкт так, як очікує наш UserSerializer (profile вкладений)
      const payload = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        profile: {
            organization: editData.organization,
            theme: editData.theme
        }
      };
      await updateProfile(payload as any);
      setIsEditing(false);
    } catch (error) {
      alert("Помилка збереження. Перевірте консоль.");
    }
  };

  if (!user) return <div className="auth-container">Завантаження профілю...</div>;

  const isDark = user.profile?.theme === 'dark';

  return (
    <div className={isDark ? 'dark-mode' : ''} style={{ minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#026AA7', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }} className="app-header">
        <div style={{ fontWeight: 'bold', fontSize: '20px' }}>📋 Boardly</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>{user.username}</span>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: 600 }}>Вийти</button>
        </div>
      </header>

      <div className="profile-card">
        <div style={{ padding: '32px', borderBottom: '1px solid #DFE1E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="profile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#DFE1E6', color: '#172B4D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold' }}>
                {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: '0 0 5px 0' }}>{user.first_name} {user.last_name}</h2>
              <div style={{ opacity: 0.7 }}>@{user.username}</div>
            </div>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
              ✎ Редагувати
            </button>
          )}
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label">Ім'я</label>
              {isEditing ? (
                <input className="form-input" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} />
              ) : (
                <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.first_name || '—'}</div>
              )}
            </div>

            <div>
              <label className="form-label">Прізвище</label>
              {isEditing ? (
                <input className="form-input" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} />
              ) : (
                <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.last_name || '—'}</div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Організація</label>
              {isEditing ? (
                <input className="form-input" value={editData.organization} onChange={e => setEditData({...editData, organization: e.target.value})} />
              ) : (
                <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>{user.profile?.organization || 'Не вказано'}</div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Тема</label>
              {isEditing ? (
                <select className="form-select" value={editData.theme} onChange={e => setEditData({...editData, theme: e.target.value})} >
                  <option value="light">🌞 Світла</option>
                  <option value="dark">🌑 Темна</option>
                </select>
              ) : (
                <div style={{ padding: '8px 0', borderBottom: '1px solid #EBECF0' }}>
                  {user.profile?.theme === 'dark' ? '🌑 Темна' : '🌞 Світла'}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>Скасувати</button>
              <button onClick={handleSave} className="btn-success" style={{ padding: '8px 16px', border: 'none', borderRadius: '3px', color: 'white' }}>Зберегти</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};