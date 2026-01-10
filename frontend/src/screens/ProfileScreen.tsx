import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'activity', 'settings'
  
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
      await updateProfile({
        first_name: editData.first_name,
        last_name: editData.last_name,
        profile: {
            organization: editData.organization,
            theme: editData.theme
        }
      });
      setIsEditing(false);
    } catch (error) {
      alert("Ошибка при сохранении профиля.");
    }
  };

  if (!user) return <div className="auth-container">Загрузка профиля...</div>;

  const isDark = user.profile?.theme === 'dark';

  return (
    <div className={isDark ? 'dark-mode' : ''} style={{ minHeight: '100vh', backgroundColor: isDark ? '#121212' : '#F4F5F7', transition: 'background-color 0.3s' }}>
      
      {/* HEADER */}
      <header className="app-header" style={{height: '50px'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span style={{ fontSize: '18px', fontWeight: 'bold' }}>📋 Boardly</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="avatar" style={{width: '32px', height: '32px', fontSize: '14px'}}>
                {user.username[0].toUpperCase()}
            </div>
            <button onClick={logout} className="btn-logout" style={{fontSize: '12px'}}>Выйти</button>
        </div>
      </header>

      {/* PROFILE CONTENT */}
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* Profile Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', marginBottom: '40px' }}>
            <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '48px', backgroundColor: '#DFE1E6', border: isDark ? '4px solid #333' : '4px solid white' }}>
                {user.username[0].toUpperCase()}
            </div>
            <div style={{ marginTop: '20px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: isDark ? '#E0E0E0' : '#172B4D' }}>
                    {user.first_name} {user.last_name}
                </h1>
                <div style={{ color: '#5E6C84', fontSize: '14px', marginBottom: '16px' }}>
                    @{user.username} • {user.email}
                </div>
                {!isEditing && (
                    <button className="btn" style={{ width: 'auto', padding: '6px 12px', background: '#E2E4E7', color: '#172B4D', fontSize: '14px' }} onClick={() => setIsEditing(true)}>
                        ✎ Редактировать профиль
                    </button>
                )}
            </div>
        </div>

        {/* Tabs (Visual only for now) */}
        <div style={{ borderBottom: '1px solid #DFE1E6', marginBottom: '32px', display: 'flex', gap: '24px' }}>
            <div 
                style={{ padding: '0 0 12px 0', borderBottom: '2px solid #0052CC', color: '#0052CC', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setActiveTab('profile')}
            >
                Профиль и доступ
            </div>
            <div 
                style={{ padding: '0 0 12px 0', borderBottom: '2px solid transparent', color: '#5E6C84', cursor: 'pointer' }}
                onClick={() => setActiveTab('activity')}
            >
                Активность
            </div>
            <div 
                style={{ padding: '0 0 12px 0', borderBottom: '2px solid transparent', color: '#5E6C84', cursor: 'pointer' }}
                onClick={() => setActiveTab('settings')}
            >
                Настройки
            </div>
        </div>

        {/* Main Info Card */}
        <div className="profile-card" style={{ maxWidth: '100%', margin: '0', padding: '32px' }}>
            
            <h3 style={{ marginTop: 0, marginBottom: '24px', borderBottom: isDark ? '1px solid #333' : '1px solid #EBECF0', paddingBottom: '12px' }}>
                О себе
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label className="form-label">Имя пользователя</label>
                        <div className="info-value">@{user.username}</div>
                    </div>
                    
                    <div>
                        <label className="form-label">Имя</label>
                        {isEditing ? (
                            <input className="form-input" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} />
                        ) : (
                            <div className="info-value">{user.first_name || '—'}</div>
                        )}
                    </div>

                    <div>
                        <label className="form-label">Фамилия</label>
                        {isEditing ? (
                            <input className="form-input" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} />
                        ) : (
                            <div className="info-value">{user.last_name || '—'}</div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     <div>
                        <label className="form-label">Организация / Компания</label>
                        {isEditing ? (
                            <input className="form-input" value={editData.organization} onChange={e => setEditData({...editData, organization: e.target.value})} />
                        ) : (
                            <div className="info-value">{user.profile?.organization || 'Не указана'}</div>
                        )}
                    </div>

                    <div>
                        <label className="form-label">Тема интерфейса</label>
                        {isEditing ? (
                            <select className="form-input" value={editData.theme} onChange={e => setEditData({...editData, theme: e.target.value})} >
                                <option value="light">🌞 Светлая</option>
                                <option value="dark">🌑 Темная</option>
                            </select>
                        ) : (
                            <div className="info-value">
                                {user.profile?.theme === 'dark' ? '🌑 Темная' : '🌞 Светлая'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isEditing && (
                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
                    <button onClick={handleSave} className="btn btn-success" style={{ width: 'auto' }}>Сохранить</button>
                    <button onClick={() => setIsEditing(false)} className="btn" style={{ width: 'auto', background: '#E2E4E7', color: '#333' }}>Отмена</button>
                </div>
            )}
        </div>
        
        {/* Footer info */}
        <div style={{ marginTop: '40px', textAlign: 'center', color: '#5E6C84', fontSize: '12px' }}>
            Boardly • Ваш ID: {user.id}
        </div>

      </div>
    </div>
  );
};