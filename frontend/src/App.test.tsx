import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from './App';
//import { AuthProvider } from './context/AuthContext';
import { FaqScreen } from './screens/FaqScreen';

test('renders faq placeholder', () => {
  render(
    <MemoryRouter initialEntries={['/faq']}>
        <Routes>
          <Route element={<App />}>
            <Route path="/faq" element={<FaqScreen />} />
          </Route>
        </Routes>
    </MemoryRouter>
  );
  const title = screen.getByText(/FAQ/i);
  expect(title).toBeInTheDocument();
});
