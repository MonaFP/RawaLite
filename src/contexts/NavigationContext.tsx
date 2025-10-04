import React, { createContext, useContext, useState, useEffect } from 'react';

export type NavigationMode = 'header' | 'sidebar' | 'full-sidebar';

interface NavigationContextType {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => void;
  sidebarWidth: number;
  isCompact: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<NavigationMode>('sidebar');

  useEffect(() => {
    // Load navigation mode from localStorage
    const savedMode = localStorage.getItem('rawalite-navigation-mode') as NavigationMode;
    if (savedMode && (savedMode === 'header' || savedMode === 'sidebar' || savedMode === 'full-sidebar')) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    // Apply CSS class to root element for layout changes
    const root = document.documentElement;
    root.setAttribute('data-navigation-mode', mode);
    
    // Save to localStorage
    localStorage.setItem('rawalite-navigation-mode', mode);
  }, [mode]);

  const sidebarWidth = mode === 'header' ? 200 : mode === 'full-sidebar' ? 240 : 240;
  const isCompact = mode === 'header';

  return (
    <NavigationContext.Provider value={{
      mode,
      setMode,
      sidebarWidth,
      isCompact
    }}>
      {children}
    </NavigationContext.Provider>
  );
};