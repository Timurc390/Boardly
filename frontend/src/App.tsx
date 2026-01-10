import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordConfirmScreen } from './screens/ResetPasswordConfirmScreen';

// --- ГЛОБАЛЬНІ СТИЛІ ---
const globalStyles = `
  /* ... ті самі стилі, що й раніше ... */
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F5F7; color: #172B4D; }
  * { box-sizing: border-box; }
  .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F9FAFC; }
  .card { background: white; padding: 40px; border-radius: 3px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; border: 1px solid #DFE1E6; }
  .form-group { margin-bottom: 15px; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: #5E6C84; margin-bottom: 6px; }
  .form-input { width: 100%; padding: 8px 12px; border: 2px solid #DFE1E6; border-radius: 3px; font-size: 14px; }
  .btn { width: 100%; padding: 10px; border: none; border-radius: 3px; font-weight: 600; color: white; cursor: pointer; margin-top: 10px; }
  .btn-primary { background-color: #0052CC; }
  .btn-success { background-color: #5AAC44; }
  .btn-link { background: none; border: none; color: #0052CC; cursor: pointer; margin-top: 15px; font-size: 14px; text-decoration: none; display: inline-block; }
  .error-message { background: #FFEBE6; color: #DE350B; padding: 10px; border-radius: 3px; margin-bottom: 20px; font-size: 14px; text-align: left; }
  .app-header { background: #026AA7; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
  .profile-card { max-width: 700px; margin: 40px auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 2px rgba(9,30,66,0.25); }
  .avatar { width: 64px; height: 64px; background: #DFE1E6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #172B4D; }
  .dark-mode { background-color: #121212; color: #e0e0e0; }
  .dark-mode .app-header { background-color: #1F2937; }
  .dark-mode .profile-card { background-color: #1E1E1E; border: 1px solid #333; }
`;

// Компонент для захищених маршрутів
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated && !user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Публічні маршрути */}
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
            
            {/* Приватні маршрути */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              } 
            />
            
            {/* Перенаправлення для невідомих маршрутів */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}