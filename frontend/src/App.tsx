import React, { useState, useEffect, createContext, useContext, ReactNode, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// --- КОНФІГУРАЦИЯ ---
const API_URL = 'http://localhost:8000/api';
// ВАШ CLIENT ID
const GOOGLE_CLIENT_ID = '374249918192-fq8ktn1acvuhsr3ecmfq1fd861afcj1d.apps.googleusercontent.com';

declare global {
  interface Window {
    google: any;
  }
}

// --- ГЛОБАЛЬНІ СТИЛІ (DARK MODERN SAAS - KANBAN PREVIEW) ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* 1. CSS Variables */
  :root {
    --bg-main: #1f1f1f;
    --bg-surface: #2a2a2a;
    --bg-input: #3a3a3a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-muted: #7a7a7a;
    
    /* Kanban Accents */
    --accent-todo: #ffc233;
    --accent-progress: #b6b3ff;
    --accent-done: #9e9e9e;
    --accent-link: #8f8cff;
    --accent-danger: #ff6b6b;

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --font-main: 'Inter', system-ui, sans-serif;
  }

  * { box-sizing: border-box; }
  
  body {
    margin: 0;
    font-family: var(--font-main);
    background-color: var(--bg-main);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* 3. Layout */
  .page {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    min-height: 100vh;
    padding: 40px 0 40px 40px; 
    gap: 0;
    max-width: 100%;
    margin: 0;
    overflow: hidden; 
  }

  .auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    padding: 20px 40px 20px 0;
  }

  .auth-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    padding-right: 0;
  }

  /* Typography */
  h1 { font-size: 48px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.1; }
  h2 { font-size: 32px; font-weight: 600; margin: 0 0 24px 0; }
  p { font-size: 16px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 32px 0; }
  .label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500; }

  /* Forms */
  .form-group { margin-bottom: 20px; }
  .input {
    width: 100%; padding: 14px 16px; background-color: var(--bg-input);
    border: 1px solid transparent; border-radius: var(--radius-sm);
    color: var(--text-primary); font-size: 15px; transition: all 0.2s ease;
  }
  .input:focus { outline: none; background-color: #454545; border-color: var(--accent-link); }

  /* Buttons */
  .btn-primary {
    width: 100%; padding: 14px; background-color: #ffffff; color: #1f1f1f;
    border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600;
    cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
  }
  .btn-primary:hover { opacity: 0.9; }
  
  .btn-icon {
    background: none; border: none; cursor: pointer; color: var(--text-secondary); 
    padding: 4px; transition: color 0.2s;
  }
  .btn-icon:hover { color: var(--text-primary); }
  .btn-icon.danger:hover { color: var(--accent-danger); }

  .google-wrapper { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--bg-input); }
  .link { color: var(--accent-link); text-decoration: none; font-size: 14px; cursor: pointer; background: none; border: none; }
  .auth-footer { margin-top: 24px; font-size: 14px; color: var(--text-muted); text-align: center; }

  /* --- KANBAN BOARD STYLES --- */
  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .top-nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 40px;
    background: var(--bg-main);
    border-bottom: 1px solid var(--bg-surface);
  }
  
  .nav-logo { font-size: 20px; font-weight: 700; color: var(--text-primary); text-decoration: none; }
  .nav-actions { display: flex; gap: 20px; align-items: center; }

  .board-layout {
    flex: 1;
    display: flex;
    gap: 24px;
    padding: 40px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .kanban-column {
    width: 320px;
    min-width: 320px;
    background: var(--bg-surface);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .column-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1px solid var(--bg-input);
  }
  .column-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .count-badge { background: var(--bg-input); padding: 2px 8px; border-radius: 12px; font-size: 12px; }

  .task-list {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
    padding-right: 4px; /* Space for scrollbar */
  }

  .task-card {
    background: var(--bg-input);
    border-radius: var(--radius-sm);
    padding: 16px;
    cursor: grab;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 1px solid transparent;
  }
  .task-card:hover { border-color: rgba(255,255,255,0.1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  
  .task-title { font-size: 15px; font-weight: 500; margin-bottom: 8px; line-height: 1.4; }
  .task-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; }
  
  .task-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
  .task-controls { display: flex; gap: 8px; }
  
  .move-btn { font-size: 10px; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: none; cursor: pointer; }
  .move-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

  /* Specific accents for live board */
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.col-0 { background: var(--accent-todo); }
  .dot.col-1 { background: var(--accent-progress); }
  .dot.col-2 { background: var(--accent-done); }

  /* Auth Preview (Keep existing) */
  .board-wrapper {
    background-color: #2b2b2b;
    border-top-left-radius: 56px; border-bottom-left-radius: 56px;
    padding: 64px 0 64px 64px;
    display: flex; gap: 40px; width: 100%; height: 60vh;
    align-self: center; box-shadow: -20px 0 80px rgba(0,0,0,0.4); overflow: hidden;
  }
  .column-preview { width: 280px; min-width: 280px; border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .column-preview.todo { background-color: var(--accent-todo); }
  .column-preview.progress { background-color: var(--accent-progress); }
  .column-preview.done { background-color: var(--accent-done); }
  .card-preview { border-radius: 16px; padding: 18px; font-size: 15px; font-weight: 600; color: #1a1a1a; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .column-preview.todo .card-preview { background-color: #ffe19a; }
  .column-preview.progress .card-preview { background-color: #e3e2ff; }
  .column-preview.done .card-preview { background-color: #dcdcdc; }
`;

// --- TYPES & CONTEXT ---
export interface User {
  id: number; username: string; email: string; first_name: string; last_name: string;
  profile?: { organization: string; theme: 'light' | 'dark' };
}

// Оновлені інтерфейси відповідно до бекенду (models.py)
export interface Board {
  id: number;
  title: string;
  description: string;
}

export interface List {
  id: number;
  title: string;
  board: number;
  order: number;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  list: number; // ID списку
}

interface AuthContextType {
  authToken: string | null; isAuthenticated: boolean; user: User | null;
  login: (data: any) => Promise<void>; register: (data: any) => Promise<void>;
  googleLogin: (token: string) => Promise<void>; logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>; resetPasswordConfirm: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = !!authToken;

  useEffect(() => { if (authToken) fetchMe(authToken); else setUser(null); }, [authToken]);

  const fetchMe = async (token: string) => {
    try {
      const res = await axios.get(`${API_URL}/users/me/`, { headers: { Authorization: `Token ${token}` } });
      setUser(res.data);
    } catch { logout(); }
  };

  const login = async (data: any) => {
    const res = await axios.post(`${API_URL}/auth/token/login/`, data);
    setAuthToken(res.data.auth_token); localStorage.setItem('authToken', res.data.auth_token);
  };
  const googleLogin = async (t: string) => {
    const res = await axios.post(`${API_URL}/auth/google/`, { access_token: t, id_token: t });
    setAuthToken(res.data.key); localStorage.setItem('authToken', res.data.key);
  };
  const register = async (d: any) => {
    await axios.post(`${API_URL}/auth/users/`, { ...d, email: d.email || `${d.username}@boardly.local` });
    await login({ username: d.username, password: d.password });
  };
  const logout = () => {
    setAuthToken(null); setUser(null); localStorage.removeItem('authToken');
    if (authToken) axios.post(`${API_URL}/auth/token/logout/`, null, { headers: { Authorization: `Token ${authToken}` } }).catch(()=>{});
  };
  const updateProfile = async (d: any) => {
    if (!authToken) return;
    await axios.patch(`${API_URL}/users/me/`, d, { headers: { Authorization: `Token ${authToken}` } });
    await fetchMe(authToken);
  };
  const resetPassword = async (e: string) => { await axios.post(`${API_URL}/auth/users/reset_password/`, { email: e }); };
  const resetPasswordConfirm = async (d: any) => { await axios.post(`${API_URL}/auth/users/reset_password_confirm/`, d); };

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, user, login, register, googleLogin, logout, updateProfile, resetPassword, resetPasswordConfirm }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- COMPONENT: AUTH SIDEBAR (PREVIEW) ---
const KanbanPreview = () => (
  <div className="auth-right">
    <div className="board-wrapper">
      <div className="column-preview todo">
        <h3>To do</h3>
        <div className="card-preview">Design login page</div>
      </div>
      <div className="column-preview progress">
        <h3>In progress</h3>
        <div className="card-preview">Implement drag & drop</div>
      </div>
      <div className="column-preview done">
        <h3>Done</h3>
        <div className="card-preview">Board creation</div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: AUTH SCREEN ---
const AuthScreen: React.FC = () => {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try { await googleLogin(response.credential); } 
      catch (err) { setError('Не вдалося увійти через Google.'); }
    };
    const initBtn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
        const p = document.getElementById("googleSignInDiv");
        if (p) window.google.accounts.id.renderButton(p, { theme: "filled_blue", size: "large", width: "400", shape: "rectangular" });
      }
    };
    if (!document.getElementById('google-client-script')) {
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.id = 'google-client-script'; s.async = true; s.defer = true; s.onload = initBtn; document.body.appendChild(s);
    } else initBtn();
  }, [googleLogin, isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegistering) await register(formData);
      else await login({ username: formData.username, password: formData.password });
    } catch (err: any) {
      if (err.response?.data) {
         const d = err.response.data; const k = Object.keys(d)[0]; setError(`${k}: ${d[k]}`);
      } else setError('Помилка авторизації.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="auth-left">
        <h1>{isRegistering ? 'Створити акаунт' : 'Ласкаво просимо'}</h1>
        <p>{isRegistering ? 'Приєднуйтесь до Boardly та керуйте завданнями ефективно.' : 'Введіть свої дані, щоб увійти в систему.'}</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group"><label className="label">Ім'я</label><input className="input" type="text" placeholder="Іван" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required={isRegistering} /></div>
              <div className="form-group"><label className="label">Прізвище</label><input className="input" type="text" placeholder="Петренко" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required={isRegistering} /></div>
            </div>
          )}
          <div className="form-group"><label className="label">Логін</label><input className="input" type="text" placeholder="Ваш логін" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required /></div>
          <div className="form-group"><label className="label">Пароль</label><input className="input" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required /></div>
          {!isRegistering && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}><Link to="/forgot-password" className="link">Забули пароль?</Link></div>}
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Обробка...' : (isRegistering ? 'Зареєструватися' : 'Увійти')}</button>
        </form>
        <div className="auth-footer"><span>{isRegistering ? 'Вже є акаунт? ' : 'Немає акаунту? '}</span><button className="link" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>{isRegistering ? 'Увійти' : 'Створити акаунт'}</button></div>
        <div className="google-wrapper"><div id="googleSignInDiv" style={{ height: '44px' }}></div></div>
      </div>
      <KanbanPreview />
    </div>
  );
};

// --- COMPONENT: MAIN KANBAN BOARD (FIXED) ---
const KanbanBoardScreen: React.FC = () => {
  const { authToken, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToListId, setAddingToListId] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null); // NEW: State for errors

  // 1. Auth check
  useEffect(() => { if (!isAuthenticated) navigate('/auth'); }, [isAuthenticated, navigate]);

  // 2. Fetch Board & Lists (Init Flow)
  useEffect(() => {
    if (authToken && !activeBoard) {
      // Крок 1: Отримуємо дошки
      axios.get(`${API_URL}/boards/`, { headers: { Authorization: `Token ${authToken}` } })
        .then(async (res) => {
          if (res.data.length > 0) {
            setActiveBoard(res.data[0]); // Вибираємо першу дошку
          } else {
            // Крок 1.1: Якщо дошок немає, створюємо дефолтну
            try {
                const newBoard = await axios.post(`${API_URL}/boards/`, { title: 'My First Board' }, { headers: { Authorization: `Token ${authToken}` } });
                setActiveBoard(newBoard.data);
                
                // Крок 1.2: Створюємо дефолтні списки для цієї дошки
                const boardId = newBoard.data.id;
                await Promise.all([
                  axios.post(`${API_URL}/lists/`, { title: 'To Do', board: boardId, order: 0 }, { headers: { Authorization: `Token ${authToken}` } }),
                  axios.post(`${API_URL}/lists/`, { title: 'In Progress', board: boardId, order: 1 }, { headers: { Authorization: `Token ${authToken}` } }),
                  axios.post(`${API_URL}/lists/`, { title: 'Done', board: boardId, order: 2 }, { headers: { Authorization: `Token ${authToken}` } })
                ]);
            } catch (err: any) {
                setError(`Помилка створення дошки: ${err.message || 'Невідома помилка'}`);
            }
          }
        })
        .catch((err: any) => {
            setError(`Помилка завантаження дошок: ${err.response?.status} ${err.response?.statusText || err.message}`);
        });
    }
  }, [authToken, activeBoard]);

  // 3. Fetch Lists & Cards when ActiveBoard is ready
  useEffect(() => {
    if (authToken && activeBoard) {
      // Завантажуємо списки
      axios.get(`${API_URL}/lists/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => setLists(res.data.sort((a: List, b: List) => a.order - b.order)))
        .catch((err: any) => setError(`Помилка списків: ${err.message}`));

      // Завантажуємо картки
      axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
        .then(res => setCards(res.data))
        .catch((err: any) => setError(`Помилка карток: ${err.message}`));
    }
  }, [authToken, activeBoard]);

  // Actions
  const handleAddTask = async (e: FormEvent, listId: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !authToken) return;
    try {
      // Створюємо картку в конкретному списку (List ID), а не зі статусом
      const res = await axios.post(`${API_URL}/cards/`, { title: newTaskTitle, list: listId }, { headers: { Authorization: `Token ${authToken}` } });
      setCards([...cards, res.data]);
      setNewTaskTitle('');
      setAddingToListId(null);
    } catch (err: any) { 
        alert(`Помилка створення задачі: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  const handleMoveCard = async (card: Card, targetListId: number) => {
    try {
      // Optimistic update
      const updatedCards = cards.map(c => c.id === card.id ? { ...c, list: targetListId } : c);
      setCards(updatedCards);
      
      // Patch request with new LIST ID
      await axios.patch(`${API_URL}/cards/${card.id}/`, { list: targetListId }, { headers: { Authorization: `Token ${authToken}` } });
    } catch (err: any) { 
      alert(`Помилка переміщення: ${JSON.stringify(err.response?.data || err.message)}`);
      // Re-fetch to sync
      if (activeBoard) {
         axios.get(`${API_URL}/cards/?board_id=${activeBoard.id}`, { headers: { Authorization: `Token ${authToken}` } })
          .then(res => setCards(res.data));
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Видалити задачу?")) return;
    try {
      setCards(cards.filter(c => c.id !== id));
      await axios.delete(`${API_URL}/cards/${id}/`, { headers: { Authorization: `Token ${authToken}` } });
    } catch { alert('Помилка видалення'); }
  };

  if (!isAuthenticated || !user) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Завантаження...</div>;
  
  if (error) return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', flexDirection: 'column'}}>
          <h2 style={{color: 'var(--accent-danger)'}}>Виникла помилка</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{width: 'auto'}}>Спробувати ще раз</button>
      </div>
  );

  if (!activeBoard) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Створення вашої дошки...</div>;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <Link to="/" className="nav-logo">Boardly / {activeBoard.title}</Link>
        <div className="nav-actions">
          <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>Привіт, {user.first_name || user.username}</span>
          <Link to="/profile" className="link">Профіль</Link>
          <button onClick={logout} className="link" style={{color: 'var(--accent-danger)'}}>Вийти</button>
        </div>
      </nav>

      {/* Board Area */}
      <div className="board-layout">
        {lists.map((list, index) => (
          <div key={list.id} className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <div className={`dot col-${index % 3}`}></div>
                {list.title}
              </div>
              <span className="count-badge">{cards.filter(c => c.list === list.id).length}</span>
            </div>

            <div className="task-list">
              {cards.filter(c => c.list === list.id).map(card => (
                <div key={card.id} className="task-card">
                  <div className="task-title">{card.title}</div>
                  {card.description && <div className="task-desc">{card.description}</div>}
                  
                  <div className="task-footer">
                    <div className="task-controls">
                      {/* Move Logic: Find other lists */}
                      {lists.filter(l => l.id !== list.id).map(targetList => (
                         <button key={targetList.id} onClick={() => handleMoveCard(card, targetList.id)} className="move-btn">
                           → {targetList.title}
                         </button>
                      ))}
                    </div>
                    <button onClick={() => handleDelete(card.id)} className="btn-icon danger">×</button>
                  </div>
                </div>
              ))}
              
              {/* Add Task Button */}
              {addingToListId === list.id ? (
                <form onSubmit={(e) => handleAddTask(e, list.id)} style={{marginTop: 12}}>
                  <input autoFocus className="input" style={{marginBottom: 8}} placeholder="Назва задачі..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                  <div style={{display:'flex', gap: 8}}>
                    <button type="submit" className="btn-primary" style={{padding: '8px 12px', fontSize: 13}}>Додати</button>
                    <button type="button" onClick={() => { setAddingToListId(null); setNewTaskTitle(''); }} className="link">Скасувати</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => { setAddingToListId(list.id); setNewTaskTitle(''); }} className="btn-primary" style={{background: 'transparent', border: '1px dashed var(--bg-input)', color: 'var(--text-muted)', marginTop: 12}}>+ Нова задача</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENT: PROFILE ---
const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{ first_name: string; last_name: string; organization: string; theme: 'light' | 'dark' }>({ first_name: '', last_name: '', organization: '', theme: 'light' });

  useEffect(() => { if (!isAuthenticated) navigate('/auth'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) setEditData({ first_name: user.first_name || '', last_name: user.last_name || '', organization: user.profile?.organization || '', theme: user.profile?.theme || 'light' });
  }, [user]);

  const handleSave = async () => {
    try { await updateProfile({ first_name: editData.first_name, last_name: editData.last_name, profile: { organization: editData.organization, theme: editData.theme } }); setIsEditing(false); } catch { alert("Помилка збереження."); }
  };

  if (!isAuthenticated || !user) return <div style={{padding: 40}}>Завантаження...</div>;

  return (
    <div className="app-container">
        <nav className="top-nav">
           <Link to="/" className="nav-logo">Boardly</Link>
           <button onClick={() => navigate('/')} className="link">← Назад до дошки</button>
        </nav>
        <div style={{padding: 40, maxWidth: 800, margin: '0 auto'}}>
          <div className="profile-card">
              <h2 style={{marginTop:0, marginBottom:'32px'}}>Налаштування профілю</h2>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                  <div className="form-group"><label className="label">Ім'я</label>{isEditing ? <input className="input" value={editData.first_name} onChange={e=>setEditData({...editData, first_name: e.target.value})} /> : <div style={{color:'white', padding:'14px 0'}}>{user.first_name}</div>}</div>
                  <div className="form-group"><label className="label">Прізвище</label>{isEditing ? <input className="input" value={editData.last_name} onChange={e=>setEditData({...editData, last_name: e.target.value})} /> : <div style={{color:'white', padding:'14px 0'}}>{user.last_name}</div>}</div>
                  <div className="form-group"><label className="label">Організація</label>{isEditing ? <input className="input" value={editData.organization} onChange={e=>setEditData({...editData, organization: e.target.value})} /> : <div style={{color:'white', padding:'14px 0'}}>{user.profile?.organization || '—'}</div>}</div>
                  <div className="form-group"><label className="label">Тема</label>{isEditing ? (<select className="input" value={editData.theme} onChange={e=>setEditData({...editData, theme: e.target.value as 'light' | 'dark'})} ><option value="light">Світла</option><option value="dark">Темна</option></select>) : <div style={{color:'white', padding:'14px 0'}}>{user.profile?.theme}</div>}</div>
              </div>
              <div style={{marginTop: '32px'}}>
                  {!isEditing ? (<button onClick={() => setIsEditing(true)} className="btn-primary" style={{width:'auto'}}>Редагувати</button>) : (<div style={{display: 'flex', gap: '16px'}}><button className="btn-primary" style={{width: 'auto'}} onClick={handleSave}>Зберегти</button><button className="link" onClick={()=>setIsEditing(false)}>Скасувати</button></div>)}
              </div>
          </div>
        </div>
    </div>
  );
};

// --- PLACEHOLDER COMPONENTS ---
const ForgotPasswordScreen = () => <div style={{padding: 64, textAlign:'center'}}><h1>Відновлення паролю</h1><Link to="/auth" className="link">Повернутися</Link></div>;
const ResetPasswordConfirmScreen = () => <div style={{padding: 64}}>Reset Confirm logic here...</div>;

// --- APP ROUTER ---
export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/" element={<KanbanBoardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}