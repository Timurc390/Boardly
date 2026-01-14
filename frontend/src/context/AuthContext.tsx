import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { User, ProfileData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

type CachedBoard = { id: number; [key: string]: any };
type CachedCard = { id: number; [key: string]: any };
type CardsCache = Record<number, CachedCard[]>;

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { profile?: Partial<ProfileData> }) => Promise<void>;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordConfirm: (data: any) => Promise<void>;
  boardCache: CachedBoard[] | null;
  setBoardCache: (boards: CachedBoard[]) => void;
  cardsCache: CardsCache;
  setCardsCacheForBoard: (boardId: number, cards: CachedCard[]) => void;
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
  const [boardCache, setBoardCache] = useState<CachedBoard[] | null>(null);
  const [cardsCache, setCardsCache] = useState<CardsCache>({});
  const isAuthenticated = !!authToken;

  useEffect(() => { if (authToken) fetchMe(authToken); else setUser(null); }, [authToken]);

  const fetchMe = async (token: string) => {
    try {
      const res = await axios.get(`${API_URL}/users/me/`, { headers: { Authorization: `Token ${token}` } });
      setUser(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logout();
      } else {
        setUser(null);
      }
    }
  };

  const login = async (data: any) => {
    const res = await axios.post(`${API_URL}/auth/token/login/`, data);
    const token = res.data.auth_token || res.data.key || res.data.token;
    if (!token) throw new Error('token_missing');
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    setBoardCache(null);
    setCardsCache({});
  };
  const googleLogin = async (t: string) => {
    const res = await axios.post(`${API_URL}/auth/google/`, { access_token: t, id_token: t });
    const token = res.data.auth_token || res.data.key || res.data.token;
    if (!token) throw new Error('token_missing');
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    setBoardCache(null);
    setCardsCache({});
  };
  const register = async (d: any) => {
    await axios.post(`${API_URL}/auth/users/`, { ...d, email: d.email || `${d.username}@boardly.local` });
    await login({ username: d.username, password: d.password });
  };
  const logout = () => {
    setAuthToken(null); setUser(null); localStorage.removeItem('authToken');
    setBoardCache(null);
    setCardsCache({});
    if (authToken) axios.post(`${API_URL}/auth/token/logout/`, null, { headers: { Authorization: `Token ${authToken}` } }).catch(()=>{});
  };
  const updateProfile = async (d: any) => {
    if (!authToken) return;
    await axios.patch(`${API_URL}/users/me/`, d, { headers: { Authorization: `Token ${authToken}` } });
    await fetchMe(authToken);
  };
  const refreshUser = async () => {
    if (!authToken) return;
    await fetchMe(authToken);
  };
  const uploadAvatar = async (file: File) => {
    if (!authToken) return;
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await axios.post(`${API_URL}/users/me/avatar/`, formData, {
      headers: { Authorization: `Token ${authToken}` }
    });
    setUser(res.data);
  };
  const removeAvatar = async () => {
    if (!authToken) return;
    const res = await axios.delete(`${API_URL}/users/me/avatar/`, {
      headers: { Authorization: `Token ${authToken}` }
    });
    setUser(res.data);
  };
  const resetPassword = async (e: string) => { await axios.post(`${API_URL}/auth/users/reset_password/`, { email: e }); };
  const resetPasswordConfirm = async (d: any) => { await axios.post(`${API_URL}/auth/users/reset_password_confirm/`, d); };
  const setCardsCacheForBoard = (boardId: number, cards: CachedCard[]) => {
    setCardsCache(prev => ({ ...prev, [boardId]: cards }));
  };

  return (
    <AuthContext.Provider value={{
      authToken,
      isAuthenticated,
      user,
      login,
      register,
      googleLogin,
      logout,
      updateProfile,
      refreshUser,
      uploadAvatar,
      removeAvatar,
      resetPassword,
      resetPasswordConfirm,
      boardCache,
      setBoardCache,
      cardsCache,
      setCardsCacheForBoard
    }}>
      {children}
    </AuthContext.Provider>
  );
};
