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
import { ConfigurationIpcService } from '../services/ipc/ConfigurationIpcService';
import { ThemeFallbackManager, type FallbackThemeInfo } from '../services/ThemeFallbackManager';
import type { ThemeWithColors } from '../services/DatabaseThemeService';
import type { ActiveConfiguration } from '../services/DatabaseConfigurationService';
import type { NavigationMode } from '../services/DatabaseNavigationService';

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
  setTheme: (theme: Theme) => Promise<void>;  // NOW ASYNC for central config
  themes: Record<Theme, ThemeInfo>;
  
  // Database-first methods
  currentDatabaseTheme: DatabaseThemeInfo | null;
  allDatabaseThemes: DatabaseThemeInfo[];
  setDatabaseTheme: (themeKey: string) => Promise<boolean>;
  createCustomTheme: (theme: Omit<ThemeWithColors, 'id'>) => Promise<boolean>;
  updateCustomTheme: (themeId: number, updates: Partial<ThemeWithColors>) => Promise<boolean>;
  deleteCustomTheme: (themeId: number) => Promise<boolean>;
  
  // NEW: Central Configuration Integration
  activeConfig: ActiveConfiguration | null;
  navigationMode: NavigationMode;
  focusMode: boolean;
  
  // System state
  isLoading: boolean;
  fallbackInfo: FallbackThemeInfo | null;
  error: string | null;
  
  // Utility methods
  refreshThemes: () => Promise<void>;
  isCustomTheme: (themeKey: string) => boolean;
  getThemeByKey: (themeKey: string) => DatabaseThemeInfo | null;
  
  // NEW: Central Configuration Methods
  refreshConfiguration: () => Promise<void>;
  updateConfiguration: (updates: Partial<{
    theme: string;
    navigationMode: NavigationMode;
    focusMode: boolean;
    headerHeight: number;
    sidebarWidth: number;
  }>) => Promise<boolean>;
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
  userId?: string;  // NEW: User ID for configuration
  initialNavigationMode?: NavigationMode;  // NEW: Navigation mode integration
  initialFocusMode?: boolean;  // NEW: Focus mode integration
}

export const DatabaseThemeProvider: React.FC<DatabaseThemeProviderProps> = ({ 
  children, 
  themeIpcService,
  userId = 'default',
  initialNavigationMode = 'header-statistics',
  initialFocusMode = false
}) => {
  // Core state
  const [currentDatabaseTheme, setCurrentDatabaseTheme] = useState<DatabaseThemeInfo | null>(null);
  const [allDatabaseThemes, setAllDatabaseThemes] = useState<DatabaseThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackInfo, setFallbackInfo] = useState<FallbackThemeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: Central Configuration State
  const [activeConfig, setActiveConfig] = useState<ActiveConfiguration | null>(null);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>(initialNavigationMode);
  const [focusMode, setFocusMode] = useState<boolean>(initialFocusMode);

  // Services
  const themeServiceRef = useRef<ThemeIpcService | null>(null);
  const fallbackManagerRef = useRef<ThemeFallbackManager | null>(null);
  const configurationServiceRef = useRef<ConfigurationIpcService | null>(null);

  // FIXED: Ensure ThemeIpcService is properly initialized
  useEffect(() => {
    if (themeIpcService) {
      themeServiceRef.current = themeIpcService;
    } else {
      themeServiceRef.current = ThemeIpcService.getInstance();
    }
    fallbackManagerRef.current = ThemeFallbackManager.getInstance();
    configurationServiceRef.current = ConfigurationIpcService.getInstance();
    
    // CRITICAL FIX: Ensure database service is actually available
    console.log('[DatabaseThemeProvider] ThemeIpcService initialized:', !!themeServiceRef.current);
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
  // NOW ENHANCED: Uses central configuration system for unified state management
  useEffect(() => {
    loadInitialTheme();
  }, []);

  const loadInitialTheme = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // SIMPLIFIED: Start with fallback themes immediately for instant UI
      console.log('[DatabaseThemeManager] Starting with fallback themes for instant UI...');
      
      // Get saved theme from localStorage or use default
      const savedTheme = localStorage.getItem('rawalite-theme') as Theme | null;
      const preferredThemeKey = savedTheme || 'sage';

      // Apply theme with database loader immediately
      const databaseThemeLoader = async () => {
        if (!configurationServiceRef.current) return null;
        try {
          const config = await configurationServiceRef.current.getActiveConfig(userId, preferredThemeKey, navigationMode, focusMode);
          if (config && themeServiceRef.current) {
            // Get the theme object by key from the configuration
            const themeKey = config.theme || preferredThemeKey;
            const theme = await themeServiceRef.current.getThemeByKey(themeKey);
            return theme;
          }
          return null;
        } catch (error) {
          console.warn('[DatabaseThemeManager] Database theme loader failed:', error);
          return null;
        }
      };

      const fallbackInfo = await fallbackManagerRef.current!.applyThemeWithFallback(preferredThemeKey, databaseThemeLoader);
      setFallbackInfo(fallbackInfo);
      
      // Convert to DatabaseThemeInfo format and set immediately
      const databaseThemeInfo = convertToDatabase(fallbackInfo.theme);
      setCurrentDatabaseTheme(databaseThemeInfo);
      
      // Load all available legacy themes immediately
      const legacyThemeInfos = Object.values(LEGACY_THEMES).map(convertLegacyToDatabase);
      setAllDatabaseThemes(legacyThemeInfos);
      
      // Set loading to false so UI becomes interactive
      setIsLoading(false);

      // BACKGROUND: Try to enhance with central configuration (non-blocking)
      if (configurationServiceRef.current) {
        try {
          console.log('[DatabaseThemeManager] Attempting central configuration enhancement...');
          const config = await configurationServiceRef.current.getActiveConfig(userId, preferredThemeKey, navigationMode, focusMode);
          
          if (config) {
            console.log('[DatabaseThemeManager] Central configuration loaded successfully');
            
            setActiveConfig(config);
            setNavigationMode(config.navigationMode);
            setFocusMode(config.focusMode);
            
            // Update with central config theme if different
            if (config.theme !== preferredThemeKey) {
              const configThemeInfo = convertToDatabase({
                id: config.themeId,
                themeKey: config.theme,
                name: config.theme,
                description: `Theme from central configuration`,
                icon: '🎨',
                isSystemTheme: true,
                isActive: true,
                colors: {
                  primary: config.primaryColor,
                  secondary: config.secondaryColor || config.primaryColor,
                  accent: config.accentColor,
                  background: config.backgroundColor,
                  text: config.textColor
                }
              });
              
              setCurrentDatabaseTheme(configThemeInfo);
            }
          }
        } catch (configError) {
          console.warn('[DatabaseThemeManager] Central configuration failed, using fallback theme:', configError);
        }
      }

      // BACKGROUND: Try to load database themes (non-blocking but with better detection)
      if (themeServiceRef.current) {
        try {
          console.log('[DatabaseThemeManager] Attempting to load database themes...');
          const availableThemes = await themeServiceRef.current.getAllThemes();
          if (availableThemes && availableThemes.length > 0) {
            console.log('[DatabaseThemeManager] Successfully loaded', availableThemes.length, 'database themes');
            setAllDatabaseThemes(availableThemes.map(convertToDatabase));
            
            // Try to find and apply the user's actual theme from database
            const userTheme = await themeServiceRef.current.getUserActiveTheme();
            if (userTheme) {
              console.log('[DatabaseThemeManager] Found user theme in database:', userTheme.name);
              const userDatabaseTheme = convertToDatabase(userTheme);
              setCurrentDatabaseTheme(userDatabaseTheme);
              
              // Apply the database theme with proper database loader
              const databaseThemeLoader = async () => {
                if (!themeServiceRef.current) return null;
                try {
                  return await themeServiceRef.current.getThemeByKey(userTheme.themeKey);
                } catch (error) {
                  console.warn('[DatabaseThemeManager] Database theme loader failed:', error);
                  return null;
                }
              };
              
              const fallbackInfo = await fallbackManagerRef.current!.applyThemeWithFallback(userTheme.themeKey, databaseThemeLoader);
              setFallbackInfo(fallbackInfo);
              
              console.log('[DatabaseThemeManager] Updated fallback info to database level:', fallbackInfo.level);
            }
          } else {
            console.warn('[DatabaseThemeManager] Database returned empty themes list');
          }
        } catch (dbError) {
          console.warn('[DatabaseThemeManager] Database themes failed, using legacy themes:', dbError);
        }
      } else {
        console.warn('[DatabaseThemeManager] ThemeIpcService not available, using legacy themes only');
      }

    } catch (err) {
      console.error('[DatabaseThemeManager] Failed to load initial theme:', err);
      setError(`Failed to load theme: ${err}`);
      
      // Emergency fallback - just use the simplest possible theme
      const emergencyFallback = await fallbackManagerRef.current!.applyThemeWithFallback('sage');
      setFallbackInfo(emergencyFallback);
      setCurrentDatabaseTheme(convertToDatabase(emergencyFallback.theme));
      
      // Still provide legacy themes for selection
      const legacyThemeInfos = Object.values(LEGACY_THEMES).map(convertLegacyToDatabase);
      setAllDatabaseThemes(legacyThemeInfos);
      
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
  // NOW ENHANCED: Uses central configuration system
  const setTheme = useCallback(async (theme: Theme): Promise<void> => {
    try {
      console.log('[DatabaseThemeManager] Setting theme via legacy method:', theme);
      
      // OPTION 1: Use central configuration system (preferred)
      if (configurationServiceRef.current) {
        const success = await updateConfiguration({ theme });
        if (success) {
          console.log('[DatabaseThemeManager] Theme updated via central configuration');
          return;
        }
      }
      
      // OPTION 2: Fallback to legacy theme setting
      console.log('[DatabaseThemeManager] Using legacy theme setting as fallback');
      const success = await setDatabaseTheme(theme);
      if (!success) {
        console.error('[DatabaseThemeManager] Failed to set theme via legacy method');
      }
      
    } catch (error) {
      console.error('[DatabaseThemeManager] Error in setTheme:', error);
    }
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

  // NEW: Central Configuration Methods
  const refreshConfiguration = useCallback(async (): Promise<void> => {
    try {
      console.log('[DatabaseThemeManager] Refreshing central configuration...');
      
      if (!configurationServiceRef.current) {
        console.warn('[DatabaseThemeManager] Configuration service not available');
        return;
      }
      
      const currentThemeKey = currentDatabaseTheme?.themeKey || 'sage';
      const config = await configurationServiceRef.current.getActiveConfig(userId, currentThemeKey, navigationMode, focusMode);
      
      if (config) {
        setActiveConfig(config);
        
        // Update local state from central configuration
        if (config.theme !== currentThemeKey) {
          // Load the new theme
          await setDatabaseTheme(config.theme);
        }
        if (config.navigationMode !== navigationMode) {
          setNavigationMode(config.navigationMode);
        }
        if (config.focusMode !== focusMode) {
          setFocusMode(config.focusMode);
        }
        
        console.log('[DatabaseThemeManager] Configuration refreshed successfully:', {
          theme: config.theme,
          navigationMode: config.navigationMode,
          focusMode: config.focusMode,
          configSource: config.configurationSource
        });
      }
    } catch (error) {
      console.error('[DatabaseThemeManager] Error refreshing configuration:', error);
    }
  }, [userId, currentDatabaseTheme, navigationMode, focusMode]);

  const updateConfiguration = useCallback(async (updates: Partial<{
    theme: string;
    navigationMode: NavigationMode;
    focusMode: boolean;
    headerHeight: number;
    sidebarWidth: number;
  }>): Promise<boolean> => {
    try {
      console.log('[DatabaseThemeManager] Updating central configuration:', updates);
      
      if (!configurationServiceRef.current) {
        console.error('[DatabaseThemeManager] Configuration service not available');
        return false;
      }
      
      const success = await configurationServiceRef.current.updateActiveConfig(userId, updates);
      
      if (success) {
        // Refresh configuration to get the updated values
        await refreshConfiguration();
        console.log('[DatabaseThemeManager] Configuration updated and refreshed successfully');
      } else {
        console.error('[DatabaseThemeManager] Failed to update configuration');
      }
      
      return success;
    } catch (error) {
      console.error('[DatabaseThemeManager] Error updating configuration:', error);
      return false;
    }
  }, [userId, refreshConfiguration]);

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
    
    // NEW: Central Configuration
    activeConfig,
    navigationMode,
    focusMode,
    
    // System state
    isLoading,
    fallbackInfo,
    error,
    
    // Utility methods
    refreshThemes,
    isCustomTheme,
    getThemeByKey,
    
    // NEW: Central Configuration Methods
    refreshConfiguration,
    updateConfiguration
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