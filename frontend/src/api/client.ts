import axios from 'axios';

// Базовий URL з зміною, якщо треба
export const API_URL = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматичне додавання токена до кожного запиту
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Перехоплення помилок авторизації (401)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Якщо токен недійсний - видаляємо його і редіректимо (опціонально)
      // localStorage.removeItem('authToken');
      // window.location.href = '/auth'; // Можна увімкнути, якщо хочеш жорсткий редірект
    }
    return Promise.reject(error);
  }
);

export default client;