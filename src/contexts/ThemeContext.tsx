import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'default' | 'sage' | 'sky' | 'lavender' | 'peach' | 'rose';

export interface ThemeInfo {
  id: Theme;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
  };
}

export const THEMES: Record<Theme, ThemeInfo> = {
  default: {
    id: 'default',
    name: 'Standard',
    description: 'Klassisches Tannengrün Theme',
    icon: '🌲',
    colors: {
      primary: '#1e3a2e',
      accent: '#f472b6',
      background: '#f1f5f9'
    }
  },
  sage: {
    id: 'sage',
    name: 'Salbeigrün',
    description: 'Dezentes Salbeigrün für augenschonende Atmosphäre',
    icon: '🟢',
    colors: {
      primary: '#7d9b7d',
      accent: '#6b876b',
      background: '#fbfcfb'
    }
  },
  sky: {
    id: 'sky',
    name: 'Himmelblau',
    description: 'Sanftes Himmelblau für entspannte Eleganz',
    icon: '🔵',
    colors: {
      primary: '#8bacc8',
      accent: '#7a9bb7',
      background: '#fbfcfd'
    }
  },
  lavender: {
    id: 'lavender',
    name: 'Lavendel',
    description: 'Beruhigendes Lavendel mit sanften Untertönen',
    icon: '🟣',
    colors: {
      primary: '#a89dc8',
      accent: '#978bb7',
      background: '#fcfbfd'
    }
  },
  peach: {
    id: 'peach',
    name: 'Pfirsich',
    description: 'Warme Pfirsichtöne für gemütliche Lesbarkeit',
    icon: '🟠',
    colors: {
      primary: '#c8a89d',
      accent: '#b7978b',
      background: '#fdfcfb'
    }
  },
  rose: {
    id: 'rose',
    name: 'Rosé',
    description: 'Dezente Rosétöne für sanfte Eleganz',
    icon: '🌸',
    colors: {
      primary: '#c89da8',
      accent: '#b78b97',
      background: '#fdfbfc'
    }
  }
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Record<Theme, ThemeInfo>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('rawalite-theme') as Theme;
    if (savedTheme && savedTheme in THEMES) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (currentTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme]);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('rawalite-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      themes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
};