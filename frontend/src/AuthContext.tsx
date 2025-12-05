import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  user: any | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<any | null>(null);

  const isAuthenticated = !!authToken;
  
  // Допоміжна функція для обробки помилок
  const handleAuthError = (err: any) => {
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.data.username) {
        return `Помилка реєстрації: Ім'я користувача - ${err.response.data.username[0]}`;
      }
      if (err.response.data.password) {
        return `Помилка реєстрації: Пароль - ${err.response.data.password[0]}`;
      }
      if (err.response.data.detail) {
        return `Помилка: ${err.response.data.detail}`;
      }
      return 'Помилка автентифікації. Перевірте дані.';
    }
    return 'Помилка мережі або сервера.';
  };


  // 1. ЛОГІН
  const login = async (data: any) => {
    try {
      // Ендпоінт Djoser для логіну та отримання токена
      const response = await axios.post(`${API_URL}/auth/token/login/`, data);
      const token = response.data.auth_token;
      
      setAuthToken(token);
      localStorage.setItem('authToken', token);
    } catch (error) {
        throw new Error(handleAuthError(error));
    }
  };

  // 2. РЕЄСТРАЦІЯ
  const register = async (data: any) => {
    try {
        // Ендпоінт Djoser для реєстрації
        const uniqueEmail = `${data.username}@boardly.local`;
        
        const registrationData = {
            username: data.username,
            password: data.password,
            email: uniqueEmail, // ДОДАНО email
        };

        await axios.post(`${API_URL}/auth/users/`, registrationData);
        
        // Після реєстрації автоматично логінимось
        await login({ username: data.username, password: data.password });
    } catch (error) {
        throw new Error(handleAuthError(error));
    }
  };

  // 3. ВИХІД
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    // Опціонально: надсилаємо запит на видалення токена на бекенд
    axios.post(`${API_URL}/auth/token/logout/`, null, {
        headers: { Authorization: `Token ${authToken}` }
    }).catch(error => console.error("Logout failed:", error));
  };

  // 4. ЗАХИЩЕНИЙ ЗАПИТ: ОТРИМАННЯ КОРИСТУВАЧІВ
  const fetchUsers = async () => {
    if (!authToken) return [];
    
    const response = await axios.get(`${API_URL}/users/`, {
      headers: {
        // Передача токена в заголовку Authorization - ключ доступу до захищеного API
        Authorization: `Token ${authToken}`, 
      },
    });
    return response.data;
  };
  
  // При завантаженні або оновленні токена можна отримати дані поточного користувача

  const value = {
    authToken,
    isAuthenticated,
    user,
    login,
    register,
    logout,
    fetchUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};