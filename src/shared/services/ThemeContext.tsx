import React, { createContext, useContext, useState, useEffect } from 'react';

export type TTheme = 'light' | 'dark';

interface IThemeContextType {
  theme: TTheme;
  toggleTheme: () => void;
  setTheme: (theme: TTheme) => void;
}

const ThemeContext = createContext<IThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<TTheme>(() => {
    const saved = localStorage.getItem('restaurantos_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Fallback to system settings
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return system ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('restaurantos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (nextTheme: TTheme) => {
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeContext;
