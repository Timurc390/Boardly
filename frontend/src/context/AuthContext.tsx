import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { User, ProfileData } from '../types';

const API_URL = 'http://localhost:8000/api';

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { organization?: string, theme?: string }) => Promise<void>;
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
  const isAuthenticated = !!authToken;

  useEffect(() => { if (authToken) fetchMe(authToken); else setUser(null); }, [authToken]);

  const fetchMe = async (token: string) => {
    try {
      const res = await axios.get(`${API_URL}/users/me/`, { headers: { Authorization: `Token ${token}` } });
      setUser(res.data);
    } catch { logout(); }
  };

  const login = async (data: any) => {
    const res = await axios.post(`${API_URL}/auth/token/login/`, data);
    setAuthToken(res.data.auth_token); localStorage.setItem('authToken', res.data.auth_token);
  };
  const googleLogin = async (t: string) => {
    const res = await axios.post(`${API_URL}/auth/google/`, { access_token: t, id_token: t });
    setAuthToken(res.data.key); localStorage.setItem('authToken', res.data.key);
  };
  const register = async (d: any) => {
    await axios.post(`${API_URL}/auth/users/`, { ...d, email: d.email || `${d.username}@boardly.local` });
    await login({ username: d.username, password: d.password });
  };
  const logout = () => {
    setAuthToken(null); setUser(null); localStorage.removeItem('authToken');
    if (authToken) axios.post(`${API_URL}/auth/token/logout/`, null, { headers: { Authorization: `Token ${authToken}` } }).catch(()=>{});
  };
  const updateProfile = async (d: any) => {
    if (!authToken) return;
    await axios.patch(`${API_URL}/users/me/`, d, { headers: { Authorization: `Token ${authToken}` } });
    await fetchMe(authToken);
  };
  const resetPassword = async (e: string) => { await axios.post(`${API_URL}/auth/users/reset_password/`, { email: e }); };
  const resetPasswordConfirm = async (d: any) => { await axios.post(`${API_URL}/auth/users/reset_password_confirm/`, d); };

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, user, login, register, googleLogin, logout, updateProfile, resetPassword, resetPasswordConfirm }}>
      {children}
    </AuthContext.Provider>
  );
};