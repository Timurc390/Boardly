import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KanbanPreview } from '../components/KanbanPreview';

const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

export const AuthScreen: React.FC = () => {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try { await googleLogin(response.credential); } catch (err) { setError('Не вдалося увійти через Google.'); }
    };
    const initBtn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
        const p = document.getElementById("googleSignInDiv");
        if (p) window.google.accounts.id.renderButton(p, { theme: "filled_blue", size: "large", width: "100%", shape: "rectangular" });
      }
    };
    if (!document.getElementById('google-client-script')) {
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.id = 'google-client-script'; s.async = true; s.defer = true; s.onload = initBtn; document.body.appendChild(s);
    } else initBtn();
  }, [googleLogin, isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegistering) await register(formData); else await login({ username: formData.username, password: formData.password });
    } catch (err: any) { setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error'); } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{isRegistering ? 'Реєстрація' : 'Вхід'}</h1>
        <p>Вітаємо в Boardly</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
            {isRegistering && <div className="form-group"><input className="input" placeholder="Ім'я" value={formData.first_name} onChange={e=>setFormData({...formData, first_name:e.target.value})} /></div>}
            <div className="form-group"><input className="input" placeholder="Логін" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} /></div>
            <div className="form-group"><input className="input" type="password" placeholder="Пароль" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} /></div>
            <button className="btn-primary" disabled={loading}>{isRegistering ? 'Створити' : 'Увійти'}</button>
        </form>
        {!isRegistering && <div style={{marginTop:10, textAlign:'right'}}><Link to="/forgot-password" className="link">Забули пароль?</Link></div>}
        <div className="auth-footer"><button className="link" onClick={()=>setIsRegistering(!isRegistering)}>{isRegistering ? 'Маю акаунт' : 'Створити акаунт'}</button></div>
        <div className="google-wrapper"><div id="googleSignInDiv" style={{ height: '44px' }}></div></div>
      </div>
      <KanbanPreview />
    </div>
  );
};

export const ProfileScreen: React.FC = () => {
    const { user, logout, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<{ first_name: string; last_name: string; organization: string; theme: 'light' | 'dark' }>({ first_name: '', last_name: '', organization: '', theme: 'light' });

    useEffect(() => {
        if (user) setEditData({ first_name: user.first_name || '', last_name: user.last_name || '', organization: user.profile?.organization || '', theme: user.profile?.theme || 'light' });
    }, [user]);

    const handleSave = async () => {
        try { await updateProfile({ first_name: editData.first_name, last_name: editData.last_name, profile: { organization: editData.organization, theme: editData.theme } }); setIsEditing(false); } catch { alert("Помилка збереження."); }
    };

    if (!user) return <div>Load...</div>;
    return (
        <div className="app-layout">
            <div className="nav-bar">
                <div style={{fontSize: '24px', fontWeight: 'bold'}}>Boardly</div>
                <button onClick={logout} className="link" style={{color: '#ff6b6b'}}>Вийти</button>
            </div>
            <div className="profile-card">
                <h2 style={{marginTop:0, marginBottom:'32px'}}>Профіль: {user.username}</h2>
                <Link to="/" className="link">← Назад до дошок</Link>
                {/* Тут можна додати форму редагування з попереднього коду */}
            </div>
        </div>
    );
};

export const ForgotPasswordScreen = () => <div style={{padding: 64, textAlign:'center', color:'white'}}><h1>Відновлення паролю</h1><Link to="/auth" className="link">Повернутися</Link></div>;
export const ResetPasswordConfirmScreen = () => <div style={{padding: 64, color:'white'}}>Reset Confirm logic here...</div>;