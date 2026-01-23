import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Прибираємо <React.StrictMode> — це обов'язково для @hello-pangea/dnd v16+ у dev-режимі
root.render(
    <App />
);

reportWebVitals();