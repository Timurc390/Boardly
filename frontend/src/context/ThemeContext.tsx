import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ initialTheme?: Theme; children: React.ReactNode }> = ({
  initialTheme = 'light',
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    localStorage.setItem('boardly_theme', value);
  };

  useEffect(() => {
    const stored = localStorage.getItem('boardly_theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.body.classList.remove('dark-mode', 'light-mode');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    // debug info to валідувати перемикання
    console.log('theme changed', theme, document.body.className, document.documentElement.dataset.theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
