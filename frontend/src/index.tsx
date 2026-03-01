import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerServiceWorker } from './registerServiceWorker';
import { initSentry } from './observability/sentry';

// Redux
import { Provider } from 'react-redux';
import { store } from './store/store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

initSentry();
registerServiceWorker();

// Підключаємо Redux Store
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

reportWebVitals();
