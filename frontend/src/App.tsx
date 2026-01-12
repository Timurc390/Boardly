import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --bg-main: #1f1f1f;
    --bg-surface: #2a2a2a;
    --bg-input: #3a3a3a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-muted: #7a7a7a;

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

  .theme-light {
    --bg-main: #f5f6f8;
    --bg-surface: #ffffff;
    --bg-input: #eef0f3;
    --text-primary: #0f172a;
    --text-secondary: #5e6c84;
    --text-muted: #94a3b8;
    --accent-link: #335dff;
    --accent-danger: #e23b3b;
  }

  .theme-dark {
    --bg-main: #1f1f1f;
    --bg-surface: #2a2a2a;
    --bg-input: #3a3a3a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-muted: #7a7a7a;
    --accent-link: #8f8cff;
    --accent-danger: #ff6b6b;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: var(--font-main);
    background-color: var(--bg-main);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    background: var(--bg-main);
    border-bottom: 1px solid var(--bg-surface);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .app-logo {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    text-decoration: none;
  }

  .app-nav {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .app-user {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .app-main {
    min-height: calc(100vh - 64px);
  }

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

  h1 { font-size: 48px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.1; }
  h2 { font-size: 32px; font-weight: 600; margin: 0 0 24px 0; }
  p { font-size: 16px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 32px 0; }
  .label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500; }

  .form-group { margin-bottom: 20px; }
  .input {
    width: 100%; padding: 14px 16px; background-color: var(--bg-input);
    border: 1px solid transparent; border-radius: var(--radius-sm);
    color: var(--text-primary); font-size: 15px; transition: all 0.2s ease;
  }
  .input:focus { outline: none; background-color: #454545; border-color: var(--accent-link); }

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
    padding-right: 4px;
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

  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.col-0 { background: var(--accent-todo); }
  .dot.col-1 { background: var(--accent-progress); }
  .dot.col-2 { background: var(--accent-done); }

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

const App: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const theme = user?.profile?.theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const hideHeader =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/password-reset') ||
    location.pathname === '/board' ||
    location.pathname.startsWith('/board/') ||
    location.pathname === '/legacy';

  return (
    <>
      <style>{globalStyles}</style>
      <div className={`app-root theme-${theme}`} style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        {!hideHeader && (
          <header className="app-header">
            <Link to="/board" className="app-logo">Boardly</Link>
            <nav className="app-nav">
              <Link to="/board" className="link">Board</Link>
              <Link to="/profile" className="link">Profile</Link>
              <Link to="/faq" className="link">FAQ</Link>
              {isAuthenticated ? (
                <>
                  <span className="app-user">{user?.first_name || user?.username}</span>
                  <button className="link" onClick={logout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="link">Login</Link>
                  <Link to="/register" className="link">Register</Link>
                </>
              )}
            </nav>
          </header>
        )}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default App;
