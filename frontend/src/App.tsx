import React, { useEffect, useState } from 'react';
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
import { FaqScreen } from './screens/FaqScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordConfirmScreen } from './screens/ResetPasswordConfirmScreen';
import { MyCardsScreen } from './screens/MyCardsScreen';

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
  
  useEffect(() => {
    // Якщо є токен, пробуємо завантажити профіль
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  return (
    <I18nProvider>
      <Routes>
        {/* Публічні маршрути */}
        <Route path="/" element={<LandingScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
        <Route path="/activate/:uid/:token" element={<ActivationScreen />} />

        {/* Захищені маршрути */}
        <Route element={<Layout />}>
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
          <Route 
            path="/faq" 
            element={
              <ProtectedRoute>
                <FaqScreen />
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

        <Route path="*" element={<Navigate to="/" replace />} />
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
