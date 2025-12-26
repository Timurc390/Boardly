// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BoardsScreen } from './screens/BoardsScreen';
import { BoardScreen } from './screens/BoardScreen';
import { globalStyles } from './styles';

// Компонент-перемикач: вирішує, який екран показати
const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <header style={{ background: '#026AA7', padding: '10px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/boards" style={{ color: 'white', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="logo">📋</span> Boardly
        </Link>
        {/* залишаємо лише один пункт меню, щоб не дублювати “Дошки” */}
        <nav style={{ display: 'flex', gap: 14 }}>
          <Link to="/profile" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>Профіль</Link>
        </nav>
        <div style={{ marginLeft: 'auto', color: 'white', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>{user?.username}</span>
          <button
            onClick={logout}
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Вийти
          </button>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  return (
    <>
      {/* Підключаємо глобальні стилі */}
      <style>{globalStyles}</style>

      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/login" element={<AuthScreen />} />
              <Route
                path="/profile"
                element={
                  <Protected>
                    <ProfileScreen />
                  </Protected>
                }
              />
              <Route
                path="/boards"
                element={
                  <Protected>
                    <BoardsScreen />
                  </Protected>
                }
              />
              <Route
                path="/boards/:id"
                element={
                  <Protected>
                    <BoardScreen />
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/boards" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
