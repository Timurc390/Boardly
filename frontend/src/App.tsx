import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nProvider } from './context/I18nContext';
import { Layout } from './components/layout/Layout';

// Redux
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe } from './store/slices/authSlice';

// Screens
import { AuthScreen } from './screens/AuthScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { ActivationScreen } from './screens/ActivationScreen';
import { BoardListScreen } from './features/boards/BoardListScreen';
import { BoardDetailScreen } from './features/boards/BoardDetailScreen';
import { InviteScreen } from './features/boards/InviteScreen'; 
import { ProfileScreen } from './screens/ProfileScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordConfirmScreen } from './screens/ResetPasswordConfirmScreen';
import { MyCardsScreen } from './screens/MyCardsScreen';
import { HelpScreen } from './screens/HelpScreen';
import { CommunityScreen } from './screens/CommunityScreen';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const location = useLocation(); 
  
  if (loading && !isAuthenticated) return <div className="loading-state">Loading...</div>; 
  
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;

  return children;
};

// Компонент-обгортка для ініціалізації
const AppContent = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const homePath = isAuthenticated ? '/boards' : '/community';
  
  useEffect(() => {
    // Якщо є токен, пробуємо завантажити профіль
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  useEffect(() => {
    const nextTheme = 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', nextTheme);
    }
  }, [user?.profile?.theme]);

  return (
    <I18nProvider>
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/" element={<LandingScreen />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
        <Route path="/password-change-confirm/:uid/:token" element={<ResetPasswordConfirmScreen />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
        <Route path="/activate/:uid/:token" element={<ActivationScreen />} />

        {/* Захищені маршрути */}
        <Route element={<Layout />}>
          <Route path="/help" element={<HelpScreen />} />
          <Route path="/support" element={<Navigate to="/help" replace />} />
          <Route path="/community" element={<CommunityScreen />} />
          <Route path="/get-started" element={<Navigate to="/community" replace />} />
          <Route 
            path="/boards" 
            element={
              <ProtectedRoute>
                <BoardListScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/boards/:id" 
            element={
              <ProtectedRoute>
                <BoardDetailScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invite/:link" 
            element={
              <ProtectedRoute>
                <InviteScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-cards" 
            element={
              <ProtectedRoute>
                <MyCardsScreen />
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </I18nProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
