import axios from 'axios';

// Базовий URL з зміною, якщо треба
export const API_URL = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({
  baseURL: API_URL,
});

// Автоматичне додавання токена до кожного запиту
client.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // Let the browser set multipart boundary for file uploads.
    if (config.headers) {
      delete (config.headers as Record<string, any>)['Content-Type'];
      delete (config.headers as Record<string, any>)['content-type'];
    }
  }
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
    return Promise.reject(error);
  }
);

export default client;
