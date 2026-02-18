import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import { socketMiddleware } from './middleware/socketMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
  },
  // Підключаємо наш кастомний Middleware. 
  // Ми використовуємо prepend або concat. 
  // В даному випадку concat після стандартних middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Корисно для сокетів та складних об'єктів
    }).concat(socketMiddleware),
});

// Ці типи тепер будуть виведені коректно
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;