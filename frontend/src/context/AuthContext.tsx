import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

// --- КОНФІГУРАЦІЯ ---
const API_URL = 'http://localhost:8000/api';

// --- ТИПИ ---
export interface ProfileData {
  organization: string;
  theme: 'light' | 'dark';
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: ProfileData;
}

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (data: any) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  // Нові методи для скидання паролю
  resetPassword: (email: string) => Promise<void>;
  resetPasswordConfirm: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (authToken) {
      fetchMe(authToken);
    } else {
      setUser(null);
    }
  }, [authToken]);

  const fetchMe = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Помилка сесії:", error);
      logout();
    }
  };

  const login = async (data: any) => {
    const response = await axios.post(`${API_URL}/auth/token/login/`, data);
    const token = response.data.auth_token;
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  const googleLogin = async (googleToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google/`, {
        access_token: googleToken, 
        id_token: googleToken 
      });
      const token = response.data.key;
      setAuthToken(token);
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error("Помилка Google Auth:", error);
      throw error;
    }
  };

  const register = async (data: any) => {
    const registrationData = {
      ...data,
      email: data.email || `${data.username}@boardly.local`
    };
    await axios.post(`${API_URL}/auth/users/`, registrationData);
    await login({ username: data.username, password: data.password });
  };

  const logout = () => {
    if (authToken) {
      axios.post(`${API_URL}/auth/token/logout/`, null, {
        headers: { Authorization: `Token ${authToken}` }
      }).catch(console.error);
    }
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const updateProfile = async (data: any) => {
    if (!authToken) return;
    await axios.patch(`${API_URL}/users/me/`, data, {
      headers: { Authorization: `Token ${authToken}` }
    });
    await fetchMe(authToken);
  };

  // 1. Запит на скидання паролю (відправка листа)
  const resetPassword = async (email: string) => {
    await axios.post(`${API_URL}/auth/users/reset_password/`, { email });
  };

  // 2. Підтвердження скидання (новий пароль)
  const resetPasswordConfirm = async (data: any) => {
    // data має містити: uid, token, new_password, re_new_password
    await axios.post(`${API_URL}/auth/users/reset_password_confirm/`, data);
  };

  return (
    <AuthContext.Provider value={{ 
      authToken, isAuthenticated: !!authToken, user, 
      login, googleLogin, register, logout, updateProfile,
      resetPassword, resetPasswordConfirm 
    }}>
      {children}
    </AuthContext.Provider>
  );
};