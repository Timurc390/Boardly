import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import client, { API_URL } from '../api/client';
import { User, ProfileData } from '../types';

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (authCode: string) => Promise<void>; // Тепер приймає code
  logout: () => void;
  updateProfile: (data: Partial<User> & { profile?: Partial<ProfileData> }) => Promise<void>;
  refreshUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMe = useCallback(async () => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await client.get('/users/me/');
      setUser(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (data: any) => {
    const res = await client.post('/auth/token/login/', data);
    const token = res.data.auth_token;
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    await fetchMe();
  };

  // --- ОНОВЛЕНИЙ GOOGLE LOGIN (Code Flow) ---
  const googleLogin = async (authCode: string) => {
    try {
        // Відправляємо 'code' на бекенд. 
        // Бекенд обміняє його на токени доступу.
        const res = await client.post('/auth/google/', { 
            code: authCode
        });
        
        const authToken = res.data.key || res.data.auth_token;
        setAuthToken(authToken);
        localStorage.setItem('authToken', authToken);
        await fetchMe();
    } catch (error: any) {
        console.error("Google Auth Failed:", error.response?.data || error.message);
        throw error;
    }
  };

  const register = async (d: any) => {
    await client.post('/auth/users/', { ...d, email: d.email || `${d.username}@boardly.local` });
    await login({ username: d.username, password: d.password });
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    client.post('/auth/token/logout/').catch(() => {});
  };

  const updateProfile = async (d: any) => {
    await client.patch('/users/me/', d);
    await fetchMe();
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await client.post('/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setUser(res.data);
  };

  const removeAvatar = async () => {
    const res = await client.delete('/users/me/avatar/');
    setUser(res.data);
  };

  const resetPassword = async (email: string) => {
    await client.post('/auth/users/reset_password/', { email });
  };

  const resetPasswordConfirm = async (data: any) => {
    await client.post('/auth/users/reset_password_confirm/', data);
  };

  return (
    <AuthContext.Provider value={{
      authToken,
      isAuthenticated: !!authToken,
      user,
      isLoading,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};