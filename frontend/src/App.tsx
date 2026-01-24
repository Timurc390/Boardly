import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { Layout } from './components/layout/Layout';

// Screens
import { AuthScreen } from './screens/AuthScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { BoardListScreen } from './features/boards/BoardListScreen';
import { BoardDetailScreen } from './features/boards/BoardDetailScreen';
import { InviteScreen } from './features/boards/InviteScreen'; 
import { ProfileScreen } from './screens/ProfileScreen';
import { FaqScreen } from './screens/FaqScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordConfirmScreen } from './screens/ResetPasswordConfirmScreen';
import { MyCardsScreen } from './screens/MyCardsScreen';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Отримуємо поточне місцезнаходження
  
  if (isLoading) return <div className="loading-state">Loading...</div>; 
  
  // Якщо не авторизований, перенаправляємо на /auth, але передаємо поточний шлях у state.from
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <Routes>
            {/* Публічні маршрути */}
            <Route path="/" element={<LandingScreen />} />
            <Route path="/signup" element={<LandingScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
            <Route path="/privacy" element={<PrivacyPolicyScreen />} />

            {/* Захищені маршрути (всередині Layout) */}
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
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileScreen />
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
