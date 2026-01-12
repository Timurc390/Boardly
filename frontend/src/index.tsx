import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { BoardListScreen, BoardDetailScreen } from './screens/BoardScreens';
import { ProfileScreen } from './screens/ProfileScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordConfirmScreen } from './screens/ResetPasswordConfirmScreen';
import { FaqScreen } from './screens/FaqScreen';
import { LegacyAppScreen } from './screens/LegacyAppScreen';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route path="/login" element={<AuthScreen defaultRegister={false} />} />
            <Route path="/register" element={<AuthScreen defaultRegister />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmScreen />} />
            <Route path="/legacy" element={<LegacyAppScreen />} />
            <Route path="/board" element={<LegacyAppScreen />} />
            <Route path="/board2" element={<BoardListScreen />} />
            <Route path="/board2/:boardId" element={<BoardDetailScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/faq" element={<FaqScreen />} />
            <Route path="*" element={<Navigate to="/board" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
