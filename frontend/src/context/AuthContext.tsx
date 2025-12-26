import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

const apiBase = (process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '') + '/api';
const API_URL = apiBase;

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
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { organization?: string, theme?: string }) => Promise<void>;
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
      // ВАЖНО: Используем наш кастомный endpoint /users/me/ вместо /auth/users/me/
      // Это гарантирует использование нашего сериализатора с логикой профиля
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Session expired or invalid token", error);
      logout();
    }
  };

  const login = async (data: any) => {
    // Логин оставляем через Djoser
    const response = await axios.post(`${API_URL}/auth/token/login/`, data);
    const token = response.data.auth_token;
    setAuthToken(token);
    localStorage.setItem('authToken', token);
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
    // ВАЖНО: Используем PATCH на наш кастомный endpoint
    await axios.patch(`${API_URL}/users/me/`, data, {
      headers: { Authorization: `Token ${authToken}` }
    });
    // После обновления перезапрашиваем данные, чтобы обновить UI
    await fetchMe(authToken);
  };

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated: !!authToken, user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
