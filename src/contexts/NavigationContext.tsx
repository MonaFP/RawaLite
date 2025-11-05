import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationIpcService } from '../services/ipc/NavigationIpcService';
import type { NavigationPreferences, NavigationLayoutConfig } from '../services/DatabaseNavigationService';

export type NavigationMode = 'header-statistics' | 'header-navigation' | 'full-sidebar';

interface NavigationContextType {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => void;
  sidebarWidth: number;
  headerHeight: number;
  isCompact: boolean;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  layoutConfig: NavigationLayoutConfig | null;
  preferences: NavigationPreferences | null;
  isLoading: boolean;
  updateLayoutDimensions: (headerHeight?: number, sidebarWidth?: number) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
  sessionId: string;
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
  userId?: string;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  userId = 'default' 
}) => {
  // Helper function to get mode-specific defaults
  const getModeDefaults = (navigationMode: NavigationMode) => {
    switch (navigationMode) {
      case 'header-statistics':
        return { sidebarWidth: 240, headerHeight: 85 };
      case 'header-navigation':
        return { sidebarWidth: 280, headerHeight: 72 };
      case 'full-sidebar':
        return { sidebarWidth: 240, headerHeight: 72 };
      default:
        return { sidebarWidth: 280, headerHeight: 72 };
    }
  };

  const [mode, setMode] = useState<NavigationMode>('header-navigation');
  
  // Enhanced setMode function that automatically sets correct dimensions
  const enhancedSetMode = (newMode: NavigationMode) => {
    const defaults = getModeDefaults(newMode);
    setMode(newMode);
    setSidebarWidth(defaults.sidebarWidth);
    setHeaderHeight(defaults.headerHeight);
  };
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => getModeDefaults('header-navigation').sidebarWidth);
  const [headerHeight, setHeaderHeight] = useState<number>(() => getModeDefaults('header-navigation').headerHeight);
  const [autoCollapse, setAutoCollapse] = useState<boolean>(false);
  const [rememberFocusMode, setRememberFocusMode] = useState<boolean>(true);
  const [layoutConfig, setLayoutConfig] = useState<NavigationLayoutConfig | null>(null);
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionId] = useState<string>(() => 
    NavigationIpcService.getInstance().generateSessionId()
  );

  const navigationService = NavigationIpcService.getInstance();

  // Load navigation preferences from database with localStorage fallback
  useEffect(() => {
    const loadNavigationPreferences = async () => {
      try {
        setIsLoading(true);

        // Validate schema first
        const schemaValid = await navigationService.validateNavigationSchema();
        if (!schemaValid) {
          console.warn('[NavigationContext] Schema validation failed, using localStorage fallback');
          loadFromLocalStorage();
          return;
        }

        // Load from database
        const dbPreferences = await navigationService.getUserNavigationPreferences(userId);
        const dbLayoutConfig = await navigationService.getNavigationLayoutConfig(userId);

        if (dbPreferences) {
          // Apply database preferences
          setPreferences(dbPreferences);
          setMode(dbPreferences.navigationMode);
          setSidebarWidth(dbPreferences.sidebarWidth);
          setHeaderHeight(dbPreferences.headerHeight);
          setAutoCollapse(dbPreferences.autoCollapse);
          setRememberFocusMode(dbPreferences.rememberFocusMode);
          setLayoutConfig(dbLayoutConfig);
        } else {
          console.warn('[NavigationContext] No database preferences found, using localStorage fallback');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('[NavigationContext] Error loading navigation preferences:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      // localStorage fallback
      const savedMode = localStorage.getItem('rawalite-navigation-mode') as NavigationMode;
      if (savedMode && ['header-statistics', 'header-navigation', 'full-sidebar'].includes(savedMode)) {
        setMode(savedMode);
      }
      
      const savedSidebarWidth = localStorage.getItem('rawalite-sidebar-width');
      if (savedSidebarWidth) {
        const width = parseInt(savedSidebarWidth, 10);
        if (width >= 180 && width <= 320) {
          setSidebarWidth(width);
        }
      }
      
      const savedHeaderHeight = localStorage.getItem('rawalite-header-height');
      if (savedHeaderHeight) {
        const height = parseInt(savedHeaderHeight, 10);
        if (height >= 60 && height <= 120) {
          setHeaderHeight(height);
        }
      }
    };

    loadNavigationPreferences();
  }, [userId, navigationService]);

  // Apply CSS changes and save to database when mode changes
  useEffect(() => {
    const updateNavigationMode = async () => {
      // Apply CSS class to root element for layout changes
      const root = document.documentElement;
      root.setAttribute('data-navigation-mode', mode);
      
      // Update dimensions based on mode if not loaded from database yet
      if (!isLoading && !preferences) {
        const defaults = getModeDefaults(mode);
        setSidebarWidth(defaults.sidebarWidth);
        setHeaderHeight(defaults.headerHeight);
      }
      
      // Save to localStorage as fallback
      localStorage.setItem('rawalite-navigation-mode', mode);

      // Save to database if not loading
      if (!isLoading) {
        try {
          const success = await navigationService.setNavigationMode(userId, mode, sessionId);
          if (!success) {
            console.warn('[NavigationContext] Failed to save navigation mode to database');
          }
        } catch (error) {
          console.error('[NavigationContext] Error saving navigation mode:', error);
        }
      }
    };

    updateNavigationMode();
  }, [mode, userId, sessionId, isLoading, navigationService, preferences]);

  // Apply layout dimensions and save to database
  useEffect(() => {
    const updateLayoutDimensions = async () => {
      // Apply CSS custom properties for dynamic dimensions
      const root = document.documentElement;
      root.style.setProperty('--theme-sidebar-width', `${sidebarWidth}px`);
      root.style.setProperty('--theme-header-height', `${headerHeight}px`);
      
      // Apply database-generated grid configuration if available
      if (layoutConfig) {
        root.style.setProperty('--db-grid-template-columns', layoutConfig.gridTemplateColumns);
        root.style.setProperty('--db-grid-template-rows', layoutConfig.gridTemplateRows);
        root.style.setProperty('--db-grid-template-areas', layoutConfig.gridTemplateAreas);
      }
      
      // Save to localStorage as fallback
      localStorage.setItem('rawalite-sidebar-width', sidebarWidth.toString());
      localStorage.setItem('rawalite-header-height', headerHeight.toString());

      // Save to database if not loading
      if (!isLoading) {
        try {
          const success = await navigationService.updateLayoutDimensions(userId, headerHeight, sidebarWidth);
          if (!success) {
            console.warn('[NavigationContext] Failed to save layout dimensions to database');
          }
        } catch (error) {
          console.error('[NavigationContext] Error saving layout dimensions:', error);
        }
      }
    };

    updateLayoutDimensions();
  }, [sidebarWidth, headerHeight, userId, isLoading, navigationService]);

  // Handler for updating layout dimensions
  const updateLayoutDimensionsHandler = async (newHeaderHeight?: number, newSidebarWidth?: number): Promise<boolean> => {
    try {
      const validation = navigationService.validateLayoutDimensions(newHeaderHeight, newSidebarWidth);
      if (!validation.valid) {
        console.error('[NavigationContext] Invalid dimensions:', validation.errors);
        return false;
      }

      if (newHeaderHeight !== undefined) {
        setHeaderHeight(newHeaderHeight);
      }
      if (newSidebarWidth !== undefined) {
        setSidebarWidth(newSidebarWidth);
      }

      return true;
    } catch (error) {
      console.error('[NavigationContext] Error updating layout dimensions:', error);
      return false;
    }
  };

  // Handler for resetting preferences to defaults
  const resetPreferencesHandler = async (): Promise<boolean> => {
    try {
      const success = await navigationService.resetNavigationPreferences(userId);
      if (success) {
        // Reload preferences from database
        const newPreferences = await navigationService.getUserNavigationPreferences(userId);
        if (newPreferences) {
          setPreferences(newPreferences);
          setMode(newPreferences.navigationMode);
          setSidebarWidth(newPreferences.sidebarWidth);
          setHeaderHeight(newPreferences.headerHeight);
          setAutoCollapse(newPreferences.autoCollapse);
          setRememberFocusMode(newPreferences.rememberFocusMode);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NavigationContext] Error resetting preferences:', error);
      return false;
    }
  };

  const isCompact = mode === 'header-statistics';

  return (
    <NavigationContext.Provider value={{
      mode,
      setMode: enhancedSetMode,
      sidebarWidth,
      headerHeight,
      isCompact,
      autoCollapse,
      rememberFocusMode,
      layoutConfig,
      preferences,
      isLoading,
      updateLayoutDimensions: updateLayoutDimensionsHandler,
      resetPreferences: resetPreferencesHandler,
      sessionId
    }}>
      {children}
    </NavigationContext.Provider>
  );
};