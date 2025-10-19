/**
 * DatabaseThemeManager - Database-first theme management with fallback compatibility
 * 
 * Replaces hardcoded ThemeContext with database-driven approach while maintaining:
 * - Backward compatibility with existing theme usage
 * - 3-level fallback system (Database → CSS → Emergency)
 * - Performance optimization with caching
 * - Error recovery and graceful degradation
 * 
 * Migration Strategy:
 * 1. Preserve existing Theme interface for compatibility
 * 2. Extend with database capabilities
 * 3. Maintain localStorage fallback for user preferences
 * 4. Gradual migration from hardcoded to database themes
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md} Complete Implementation Documentation
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-SERVICE-LAYER_2025-10-17.md} Service Layer Architecture
 * @see {@link docs/01-core/final/VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md} Core System Architecture
 * @see {@link docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md} Theme Development Rules
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ThemeIpcService } from '../services/ipc/ThemeIpcService';
import { ThemeFallbackManager, type FallbackThemeInfo } from '../services/ThemeFallbackManager';
import type { ThemeWithColors } from '../services/DatabaseThemeService';

// Legacy Theme interface for backward compatibility
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

// Extended interface for database themes
export interface DatabaseThemeInfo extends ThemeWithColors {
  // Computed properties for legacy compatibility
  legacyId?: Theme;
  legacyColors?: {
    primary: string;
    accent: string;
    background: string;
  };
}

export interface DatabaseThemeContextType {
  // Legacy compatibility methods
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Record<Theme, ThemeInfo>;
  
  // Database-first methods
  currentDatabaseTheme: DatabaseThemeInfo | null;
  allDatabaseThemes: DatabaseThemeInfo[];
  setDatabaseTheme: (themeKey: string) => Promise<boolean>;
  createCustomTheme: (theme: Omit<ThemeWithColors, 'id'>) => Promise<boolean>;
  updateCustomTheme: (themeId: number, updates: Partial<ThemeWithColors>) => Promise<boolean>;
  deleteCustomTheme: (themeId: number) => Promise<boolean>;
  
  // System state
  isLoading: boolean;
  fallbackInfo: FallbackThemeInfo | null;
  error: string | null;
  
  // Utility methods
  refreshThemes: () => Promise<void>;
  isCustomTheme: (themeKey: string) => boolean;
  getThemeByKey: (themeKey: string) => DatabaseThemeInfo | null;
}

// Legacy theme definitions for fallback compatibility
const LEGACY_THEMES: Record<Theme, ThemeInfo> = {
  default: {
    id: 'default',
    name: 'Standard',
    description: 'Klassisches Tannengrün Theme',
    icon: '🌲',
    colors: {
      primary: '#1e3a2e',
      accent: '#8b9dc3',
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

const DatabaseThemeContext = createContext<DatabaseThemeContextType | undefined>(undefined);

export const useDatabaseTheme = () => {
  const context = useContext(DatabaseThemeContext);
  if (!context) {
    throw new Error('useDatabaseTheme must be used within a DatabaseThemeProvider');
  }
  return context;
};

// Legacy hook for backward compatibility
export const useTheme = () => {
  const context = useDatabaseTheme();
  return {
    currentTheme: context.currentTheme,
    setTheme: context.setTheme,
    themes: context.themes
  };
};

interface DatabaseThemeProviderProps {
  children: React.ReactNode;
  themeIpcService?: ThemeIpcService; // Injected for testing
}

export const DatabaseThemeProvider: React.FC<DatabaseThemeProviderProps> = ({ 
  children, 
  themeIpcService 
}) => {
  // Core state
  const [currentDatabaseTheme, setCurrentDatabaseTheme] = useState<DatabaseThemeInfo | null>(null);
  const [allDatabaseThemes, setAllDatabaseThemes] = useState<DatabaseThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackInfo, setFallbackInfo] = useState<FallbackThemeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Services
  const themeServiceRef = useRef<ThemeIpcService | null>(null);
  const fallbackManagerRef = useRef<ThemeFallbackManager | null>(null);

  // Initialize services
  useEffect(() => {
    if (themeIpcService) {
      themeServiceRef.current = themeIpcService;
    } else {
      themeServiceRef.current = ThemeIpcService.getInstance();
    }
    fallbackManagerRef.current = ThemeFallbackManager.getInstance();
  }, [themeIpcService]);

  // Initialize database service (when not injected for testing)
  useEffect(() => {
    if (!themeServiceRef.current && !themeIpcService) {
      // For now, we defer database service initialization
      // In a full implementation, this would initialize the service with IPC communication
      console.log('[DatabaseThemeProvider] Database service initialization deferred');
      console.log('[DatabaseThemeProvider] Using CSS fallback until database service is available');
    }
  }, [themeIpcService]);

  // Helper functions
  const isLegacyTheme = (themeKey?: string): themeKey is Theme => {
    return themeKey ? themeKey in LEGACY_THEMES : false;
  };

  const convertToDatabase = (theme: ThemeWithColors): DatabaseThemeInfo => {
    const legacyId = isLegacyTheme(theme.themeKey) ? theme.themeKey : undefined;
    const legacyColors = legacyId ? LEGACY_THEMES[legacyId].colors : undefined;

    return {
      ...theme,
      legacyId,
      legacyColors
    };
  };

  const convertLegacyToDatabase = (legacyTheme: ThemeInfo): DatabaseThemeInfo => {
    return {
      id: undefined,
      themeKey: legacyTheme.id,
      name: legacyTheme.name,
      description: legacyTheme.description,
      icon: legacyTheme.icon,
      isSystemTheme: true,
      isActive: true,
      colors: {
        primary: legacyTheme.colors.primary,
        accent: legacyTheme.colors.accent,
        background: legacyTheme.colors.background
      },
      legacyId: legacyTheme.id,
      legacyColors: legacyTheme.colors
    };
  };

  // Legacy compatibility: current theme as legacy type
  const currentTheme: Theme = currentDatabaseTheme?.legacyId || 
    (isLegacyTheme(currentDatabaseTheme?.themeKey) ? currentDatabaseTheme!.themeKey as Theme : 'default');

  // Load initial theme
  useEffect(() => {
    loadInitialTheme();
  }, []);

  const loadInitialTheme = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get saved theme from localStorage as fallback
      const savedTheme = localStorage.getItem('rawalite-theme') as Theme | null;
      const preferredThemeKey = savedTheme || 'default';

      // Try to load from database first
      const fallbackInfo = await fallbackManagerRef.current!.applyThemeWithFallback(
        preferredThemeKey,
        async () => {
          if (!themeServiceRef.current) return null;
          
          // Get user's active theme from database
          const userTheme = await themeServiceRef.current.getUserActiveTheme();
          return userTheme;
        }
      );

      setFallbackInfo(fallbackInfo);
      
      // Convert to DatabaseThemeInfo format
      const databaseThemeInfo = convertToDatabase(fallbackInfo.theme);
      setCurrentDatabaseTheme(databaseThemeInfo);

      // Load all available themes
      await refreshThemes();

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to load initial theme:', err);
      setError(`Failed to load theme: ${err}`);
      
      // Emergency fallback
      const emergencyFallback = await fallbackManagerRef.current!.applyThemeWithFallback('default');
      setFallbackInfo(emergencyFallback);
      setCurrentDatabaseTheme(convertToDatabase(emergencyFallback.theme));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshThemes = async () => {
    try {
      if (!themeServiceRef.current) {
        // Database not available, use legacy themes
        const legacyThemeInfos = Object.values(LEGACY_THEMES).map(convertLegacyToDatabase);
        setAllDatabaseThemes(legacyThemeInfos);
        return;
      }

      const themes = await themeServiceRef.current.getAllThemes();
      const databaseThemeInfos = themes.map(convertToDatabase);
      setAllDatabaseThemes(databaseThemeInfos);

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to refresh themes:', err);
      setError(`Failed to refresh themes: ${err}`);
    }
  };

  // Legacy setTheme method for backward compatibility
  const setTheme = useCallback((theme: Theme) => {
    setDatabaseTheme(theme);
  }, []);

  const setDatabaseTheme = useCallback(async (themeKey: string): Promise<boolean> => {
    try {
      setError(null);

      // Apply theme with fallback
      const fallbackInfo = await fallbackManagerRef.current!.applyThemeWithFallback(
        themeKey,
        async () => {
          if (!themeServiceRef.current) return null;
          
          const theme = await themeServiceRef.current.getThemeByKey(themeKey);
          if (theme && themeServiceRef.current) {
            // Update user preference
            await themeServiceRef.current.setUserTheme('default', theme.id!, themeKey);
          }
          return theme;
        }
      );

      setFallbackInfo(fallbackInfo);
      const databaseThemeInfo = convertToDatabase(fallbackInfo.theme);
      setCurrentDatabaseTheme(databaseThemeInfo);

      // Save to localStorage for fallback
      localStorage.setItem('rawalite-theme', themeKey);

      return true;

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to set theme:', err);
      setError(`Failed to set theme: ${err}`);
      return false;
    }
  }, []);

  const createCustomTheme = useCallback(async (theme: Omit<ThemeWithColors, 'id'>): Promise<boolean> => {
    try {
      if (!themeServiceRef.current) {
        setError('Database not available for custom themes');
        return false;
      }

      const { colors, ...themeData } = theme;
      
      // Ensure required fields have defaults
      const completeThemeData = {
        themeKey: themeData.themeKey,
        name: themeData.name,
        description: themeData.description || '',
        icon: themeData.icon || '🎨',
        isSystemTheme: themeData.isSystemTheme ?? false,
        isActive: themeData.isActive ?? true,
      };
      
      const createdTheme = await themeServiceRef.current.createTheme(completeThemeData, colors);
      
      if (createdTheme) {
        await refreshThemes();
        return true;
      }
      
      return false;

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to create custom theme:', err);
      setError(`Failed to create custom theme: ${err}`);
      return false;
    }
  }, []);

  const updateCustomTheme = useCallback(async (themeId: number, updates: Partial<ThemeWithColors>): Promise<boolean> => {
    try {
      if (!themeServiceRef.current) {
        setError('Database not available for theme updates');
        return false;
      }

      const { colors, ...themeUpdates } = updates;
      
      // Update theme metadata
      const success = await themeServiceRef.current.updateTheme(themeId, themeUpdates);
      
      // Update colors if provided
      if (colors && success) {
        await themeServiceRef.current.updateThemeColors(themeId, colors);
      }

      if (success) {
        await refreshThemes();
        
        // If this is the current theme, reload it
        if (currentDatabaseTheme?.id === themeId) {
          const updatedTheme = await themeServiceRef.current.getThemeById(themeId);
          if (updatedTheme) {
            setCurrentDatabaseTheme(convertToDatabase(updatedTheme));
          }
        }
      }

      return success;

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to update custom theme:', err);
      setError(`Failed to update custom theme: ${err}`);
      return false;
    }
  }, [currentDatabaseTheme]);

  const deleteCustomTheme = useCallback(async (themeId: number): Promise<boolean> => {
    try {
      if (!themeServiceRef.current) {
        setError('Database not available for theme deletion');
        return false;
      }

      const success = await themeServiceRef.current.deleteTheme(themeId);
      
      if (success) {
        await refreshThemes();
        
        // If deleted theme was active, fall back to default
        if (currentDatabaseTheme?.id === themeId) {
          await setDatabaseTheme('default');
        }
      }

      return success;

    } catch (err) {
      console.error('[DatabaseThemeProvider] Failed to delete custom theme:', err);
      setError(`Failed to delete custom theme: ${err}`);
      return false;
    }
  }, [currentDatabaseTheme]);

  const isCustomTheme = useCallback((themeKey: string): boolean => {
    const theme = allDatabaseThemes.find(t => t.themeKey === themeKey);
    return theme ? !theme.isSystemTheme : false;
  }, [allDatabaseThemes]);

  const getThemeByKey = useCallback((themeKey: string): DatabaseThemeInfo | null => {
    return allDatabaseThemes.find(t => t.themeKey === themeKey) || null;
  }, [allDatabaseThemes]);

  const contextValue: DatabaseThemeContextType = {
    // Legacy compatibility
    currentTheme,
    setTheme,
    themes: LEGACY_THEMES,
    
    // Database-first methods
    currentDatabaseTheme,
    allDatabaseThemes,
    setDatabaseTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    
    // System state
    isLoading,
    fallbackInfo,
    error,
    
    // Utility methods
    refreshThemes,
    isCustomTheme,
    getThemeByKey
  };

  return (
    <DatabaseThemeContext.Provider value={contextValue}>
      {children}
    </DatabaseThemeContext.Provider>
  );
};

// Export for backward compatibility
export const ThemeProvider = DatabaseThemeProvider;
export const ThemeContext = DatabaseThemeContext;
export const THEMES = LEGACY_THEMES;