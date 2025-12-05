import React from 'react';
import { AuthProvider } from './AuthContext';
import AuthComponent from './AuthComponent';
import './App.css'; // Припускаємо, що App.css існує

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <header className="App-header">
          <h1>Boardly Clone</h1>
          <AuthComponent />
        </header>
      </div>
    </AuthProvider>
  );
};

export default App;