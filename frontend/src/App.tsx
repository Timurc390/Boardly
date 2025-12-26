// src/App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { globalStyles } from './styles';

// Компонент-перемикач: вирішує, який екран показати
const MainSwitch: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ProfileScreen /> : <AuthScreen />;
};

export default function App() {
  return (
    <>
      {/* Підключаємо глобальні стилі */}
      <style>{globalStyles}</style>
      
      <AuthProvider>
        <MainSwitch />
      </AuthProvider>
    </>
  );
}