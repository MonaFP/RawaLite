import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationIpcService } from '../services/ipc/NavigationIpcService';
import { ConfigurationIpcService } from '../services/ipc/ConfigurationIpcService';
import type { NavigationPreferences, NavigationLayoutConfig } from '../services/DatabaseNavigationService';
// ANTI-CORRUPTION: Import separated configurations
import type { ActiveConfiguration } from '../services/DatabaseConfigurationService';
import type { GlobalConfiguration } from '../services/ipc/ConfigurationIpcService';

// ✅ CLEAN IMPORTS: Legacy isolation complete - using navigation-safe.ts
import { 
  type NavigationMode,
  type NavigationModeInput,
  normalizeToKiSafe,
  isValidNavigationMode,
  validateNavigationMode,
  DEFAULT_NAVIGATION_MODE
} from '../types/navigation-safe';

interface NavigationContextType {
  mode: NavigationMode;
  setMode: (mode: NavigationMode) => Promise<void>;  // NOW ASYNC
  sidebarWidth: number;
  headerHeight: number;
  isCompact: boolean;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  layoutConfig: NavigationLayoutConfig | null;
  preferences: NavigationPreferences | null;
  
  // ANTI-CORRUPTION: Separated configuration state
  // Global configuration (theme, colors, focus mode) - no navigation layout
  globalConfig: GlobalConfiguration | null;
  // Navigation layout configuration (per-mode, separate) 
  navigationLayout: NavigationLayoutConfig | null;
  
  theme: string;
  focusMode: boolean;
  
  isLoading: boolean;
  updateLayoutDimensions: (headerHeight?: number, sidebarWidth?: number) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
  sessionId: string;
  
  // ANTI-CORRUPTION: Separated configuration methods
  refreshGlobalConfiguration: () => Promise<void>;
  refreshNavigationLayout: () => Promise<void>;
  updateGlobalConfiguration: (updates: Partial<{
    theme: string;
    focusMode: boolean;
  }>) => Promise<boolean>;
  updateNavigationLayout: (updates: Partial<{
    headerHeight: number;
    sidebarWidth: number;
  }>) => Promise<boolean>;
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
  initialTheme?: string;  // NEW: Allow theme injection
  initialFocusMode?: boolean;  // NEW: Allow focus mode injection
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  userId = 'default',
  initialTheme = 'sage',
  initialFocusMode = false
}) => {
  console.log('[NavigationContext] NavigationProvider INITIALIZED with userId:', userId);
  // Helper function to get mode-specific defaults
  const getModeDefaults = (navigationMode: NavigationMode) => {
    switch (navigationMode) {
      case 'mode-dashboard-view':  // was: header-statistics
        return { sidebarWidth: 240, headerHeight: 160 };  // Fixed: 85 → 160
      case 'mode-data-panel':      // was: header-navigation
        return { sidebarWidth: 280, headerHeight: 160 };  // Fixed: 72 → 160
      case 'mode-compact-focus':   // was: full-sidebar
        return { sidebarWidth: 240, headerHeight: 36 };   // Fixed: 72 → 36 (50% reduction)
      default:
        return { sidebarWidth: 280, headerHeight: 160 };  // Fixed: 72 → 160
    }
  };

  const [mode, setMode] = useState<NavigationMode>(DEFAULT_NAVIGATION_MODE);
  
  // CRITICAL FIX: Set data-navigation-mode attribute immediately when mode changes
  useEffect(() => {
    console.log('[NavigationContext] Setting data-navigation-mode attribute:', mode);
    document.body.setAttribute('data-navigation-mode', mode);
  }, [mode]);
  
  // FIXED: Simplified setMode function without circular dependency
  const enhancedSetMode = async (newMode: NavigationMode) => {
    try {
      console.log('[NavigationContext] Setting navigation mode:', newMode);
      
      // Apply defaults immediately for instant UI response
      const defaults = getModeDefaults(newMode);
      setMode(newMode);
      setSidebarWidth(defaults.sidebarWidth);
      setHeaderHeight(defaults.headerHeight);
      
      // Save to central configuration in background (non-blocking)
      try {
        await configurationService.updateActiveConfig(userId, { 
          // navigationMode: newMode, // TEMPORARILY DISABLED: not in interface
          theme: theme,
          focusMode: focusMode
          // headerHeight: defaults.headerHeight, // TEMPORARILY DISABLED: not in interface
          // sidebarWidth: defaults.sidebarWidth // TEMPORARILY DISABLED: not in interface
        });
        console.log('[NavigationContext] Navigation mode saved to central configuration (partial)');
      } catch (error) {
        console.warn('[NavigationContext] Central config save failed, trying legacy:', error);
        
        // Fallback to legacy system
        try {
          // ✅ CLEAN: Convert to legacy mode for NavigationService compatibility
          await navigationService.setNavigationMode(userId, newMode, sessionId);
          console.log('[NavigationContext] Navigation mode saved via legacy system');
        } catch (legacyError) {
          console.warn('[NavigationContext] Legacy save also failed:', legacyError);
        }
      }
      
    } catch (error) {
      console.error('[NavigationContext] Error in setMode:', error);
      
      // Emergency fallback - at least update UI
      const defaults = getModeDefaults(newMode);
      setMode(newMode);
      setSidebarWidth(defaults.sidebarWidth);
      setHeaderHeight(defaults.headerHeight);
    }
  };
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => getModeDefaults(DEFAULT_NAVIGATION_MODE).sidebarWidth);
  const [headerHeight, setHeaderHeight] = useState<number>(() => getModeDefaults(DEFAULT_NAVIGATION_MODE).headerHeight);
  const [autoCollapse, setAutoCollapse] = useState<boolean>(false);
  const [rememberFocusMode, setRememberFocusMode] = useState<boolean>(true);
  const [layoutConfig, setLayoutConfig] = useState<NavigationLayoutConfig | null>(null);
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // NEW: Central Configuration State
  const [activeConfig, setActiveConfig] = useState<ActiveConfiguration | null>(null);
  const [theme, setTheme] = useState<string>(initialTheme);
  const [focusMode, setFocusMode] = useState<boolean>(initialFocusMode);
  
  const [sessionId] = useState<string>(() => 
    NavigationIpcService.getInstance().generateSessionId()
  );

  const navigationService = NavigationIpcService.getInstance();
  const configurationService = ConfigurationIpcService.getInstance();

  // Load navigation preferences from database with localStorage fallback
  // NOW ENHANCED: Uses central configuration system for unified state management
  useEffect(() => {
    console.log('[NavigationContext] useEffect STARTED for loadNavigationPreferences');
    
    const loadNavigationPreferences = async () => {
      try {
        console.log('[NavigationContext] loadNavigationPreferences() STARTED');
        setIsLoading(true);

        // STEP 1: Validate schema first
        console.log('[NavigationContext] Validating schema...');
        const schemaValid = await navigationService.validateNavigationSchema();
        if (!schemaValid) {
          console.warn('[NavigationContext] Schema validation failed, using localStorage fallback');
          loadFromLocalStorage();
          return;
        }

        // STEP 2: Load from central configuration system
        console.log('[NavigationContext] Loading central configuration...');
        // TEMPORARILY DISABLED: API signature mismatch - using legacy system directly
        console.warn('[NavigationContext] Using legacy navigation system');
        
        // DIRECT: Use legacy database loading
        const dbPreferences = await navigationService.getUserNavigationPreferences(userId);
        const dbLayoutConfig = await navigationService.getNavigationLayoutConfig(userId);

        if (dbPreferences && dbPreferences.navigationMode) {
          setPreferences(dbPreferences);
          // ✅ CLEAN: Convert legacy mode from database to KI-safe mode
          // CRITICAL FIX: Only convert if navigationMode exists and is valid
          try {
            const safeMode = normalizeToKiSafe(dbPreferences.navigationMode as NavigationModeInput);
            if (safeMode) {
              setMode(safeMode);
            } else {
              console.warn('[NavigationContext] Invalid legacy mode conversion, using default:', dbPreferences.navigationMode);
              setMode(DEFAULT_NAVIGATION_MODE); // Safe fallback
            }
          } catch (error) {
            console.warn('[NavigationContext] Error converting legacy mode, using default:', error);
            setMode(DEFAULT_NAVIGATION_MODE); // Safe fallback
          }
          setSidebarWidth(dbPreferences.sidebarWidth);
          setHeaderHeight(dbPreferences.headerHeight);
          setAutoCollapse(dbPreferences.autoCollapse);
          setRememberFocusMode(dbPreferences.rememberFocusMode);
          setLayoutConfig(dbLayoutConfig);
          
          console.log('[NavigationContext] Legacy preferences loaded, mode set to:', dbPreferences.navigationMode);
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
      console.log('[NavigationContext] Loading from localStorage fallback');
      
      // localStorage fallback with legacy conversion
      const savedModeRaw = localStorage.getItem('rawalite-navigation-mode') as string;
      // ✅ CLEAN: Handle both legacy and KI-safe modes from localStorage
      if (savedModeRaw) {
        // Use normalizeToKiSafe for all conversions
        try {
          const convertedMode = normalizeToKiSafe(savedModeRaw as NavigationModeInput);
          setMode(convertedMode);
          console.log('[NavigationContext] localStorage mode converted:', savedModeRaw, '→', convertedMode);
        } catch (error) {
          const defaultMode = DEFAULT_NAVIGATION_MODE;
          setMode(defaultMode);
          localStorage.setItem('rawalite-navigation-mode', defaultMode);
          console.log('[NavigationContext] Invalid localStorage mode, using default:', defaultMode);
        }
      } else {
        const defaultMode = DEFAULT_NAVIGATION_MODE;
        setMode(defaultMode);
        // CRITICAL FIX: Also save default mode to localStorage immediately
        localStorage.setItem('rawalite-navigation-mode', defaultMode);
        console.log('[NavigationContext] Using and saving default mode:', defaultMode);
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
    console.log('[NavigationContext] Mode changed, applying CSS and saving:', mode);
    
    const updateNavigationMode = async () => {
      // CRITICAL FIX: Apply CSS class to root element IMMEDIATELY for layout changes
      const root = document.documentElement;
      root.setAttribute('data-navigation-mode', mode);
      console.log('[NavigationContext] data-navigation-mode attribute set to:', mode);
      
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
          // ✅ CLEAN: Convert to legacy mode for NavigationService compatibility
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

  // SIMPLIFIED: Apply layout dimensions without database calls during initialization
  useEffect(() => {
    const updateLayoutDimensions = () => {
      // Apply CSS custom properties for dynamic dimensions
      const root = document.documentElement;
      
      console.log('[NavigationContext] useEffect triggered! sidebarWidth:', sidebarWidth, 'headerHeight:', headerHeight, 'activeConfig:', activeConfig, 'layoutConfig:', layoutConfig);
      console.log('[NavigationContext] Applying CSS variables from central configuration');
      
      // Always apply basic layout variables
      root.style.setProperty('--theme-sidebar-width', `${sidebarWidth}px`);
      root.style.setProperty('--theme-header-height', `${headerHeight}px`);
      
      // Apply central configuration CSS variables if available
      if (activeConfig && activeConfig.cssVariables) {
        Object.entries(activeConfig.cssVariables).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });
        
        // Apply database-generated grid configuration
        console.log('[NavigationContext] activeConfig contents:', JSON.stringify(activeConfig, null, 2));
        console.log('[NavigationContext] ✅ APPLYING activeConfig grid values - Database grid templates now corrected!');
        // FIXED: Database grid template areas now match CSS layout architecture
        // Database liefert jetzt: "sidebar header" "sidebar main" "sidebar footer"
        // CSS erwartet: "sidebar header" "sidebar main" "sidebar footer"
        
        // Apply mode-specific CSS variables based on current mode
        const modePrefix = `--db-${mode}-`;
        console.log('[NavigationContext] Using modePrefix:', modePrefix, 'for mode:', mode);
        
        if (activeConfig.gridTemplateColumns) {
          console.log(`[NavigationContext] Setting ${modePrefix}grid-template-columns:`, activeConfig.gridTemplateColumns);
          root.style.setProperty(`${modePrefix}grid-template-columns`, activeConfig.gridTemplateColumns);
        } else {
          console.warn('[NavigationContext] activeConfig.gridTemplateColumns is missing!');
        }
        if (activeConfig.gridTemplateRows) {
          console.log(`[NavigationContext] Setting ${modePrefix}grid-template-rows:`, activeConfig.gridTemplateRows);
          root.style.setProperty(`${modePrefix}grid-template-rows`, activeConfig.gridTemplateRows);
        } else {
          console.warn('[NavigationContext] activeConfig.gridTemplateRows is missing!');
        }
        if (activeConfig.gridTemplateAreas) {
          console.log(`[NavigationContext] Setting ${modePrefix}grid-template-areas:`, activeConfig.gridTemplateAreas);
          root.style.setProperty(`${modePrefix}grid-template-areas`, activeConfig.gridTemplateAreas);
        } else {
          console.warn('[NavigationContext] activeConfig.gridTemplateAreas is missing!');
        }
      }
      
      // Apply database-generated grid configuration if available (legacy fallback)
      if (layoutConfig) {
        console.log('[NavigationContext] layoutConfig contents:', JSON.stringify(layoutConfig, null, 2));
        console.log('[NavigationContext] ✅ APPLYING layoutConfig grid values - Database grid templates now corrected!');
        // FIXED: layoutConfig now has compatible grid template areas
        // Database liefert jetzt: "sidebar header" "sidebar main" "sidebar footer"
        // CSS erwartet: "sidebar header" "sidebar main" "sidebar footer"
        console.log('[NavigationContext] Setting layoutConfig CSS variables...');
        
        // Apply mode-specific CSS variables for layoutConfig as well
        const modePrefix = `--db-${mode}-`;
        console.log('[NavigationContext] Using layoutConfig modePrefix:', modePrefix);
        root.style.setProperty(`${modePrefix}grid-template-columns`, layoutConfig.gridTemplateColumns);
        root.style.setProperty(`${modePrefix}grid-template-rows`, layoutConfig.gridTemplateRows);
        root.style.setProperty(`${modePrefix}grid-template-areas`, layoutConfig.gridTemplateAreas);
      } else {
        console.warn('[NavigationContext] layoutConfig is null - no legacy grid config available');
      }
      
      // Save to localStorage as fallback (non-blocking)
      localStorage.setItem('rawalite-sidebar-width', sidebarWidth.toString());
      localStorage.setItem('rawalite-header-height', headerHeight.toString());
    };

    updateLayoutDimensions();
  }, [sidebarWidth, headerHeight, activeConfig, layoutConfig]);

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
          // ✅ CLEAN: Convert legacy mode from database to KI-safe mode
          setMode(normalizeToKiSafe(newPreferences.navigationMode as NavigationModeInput));
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

  // DISABLED: Central Configuration Methods (API signature issues)
  const refreshConfiguration = async (): Promise<void> => {
    console.warn('[NavigationContext] refreshConfiguration temporarily disabled due to API issues');
    // TEMPORARILY DISABLED: API signature mismatch
    // Will be re-enabled when central configuration API is stabilized
  };

  const updateConfiguration = async (updates: Partial<{
    headerHeight: number;
    sidebarWidth: number;
    navigationMode: NavigationMode;
    theme: string;
    focusMode: boolean;
  }>): Promise<boolean> => {
    try {
      console.log('[NavigationContext] Updating central configuration:', updates);
      
      const success = await configurationService.updateActiveConfig(userId, updates);
      
      if (success) {
        console.log('[NavigationContext] Configuration updated successfully');
        // Don't call refreshConfiguration here - let the individual state updates handle it
      } else {
        console.error('[NavigationContext] Failed to update configuration');
      }
      
      return success;
    } catch (error) {
      console.error('[NavigationContext] Error updating configuration:', error);
      return false;
    }
  };

  const isCompact = mode === 'mode-dashboard-view';

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
      
      // ANTI-CORRUPTION: Separated configuration state (TEMPORARILY NULL)
      globalConfig: null, // DISABLED due to API issues
      navigationLayout: layoutConfig, // Use existing layout config
      
      theme,
      focusMode,
      
      isLoading,
      updateLayoutDimensions: updateLayoutDimensionsHandler,
      resetPreferences: resetPreferencesHandler,
      sessionId,
      
      // ANTI-CORRUPTION: Separated configuration methods (DISABLED)
      refreshGlobalConfiguration: refreshConfiguration,
      updateGlobalConfiguration: updateConfiguration,
      refreshNavigationLayout: async () => { 
        console.warn('[NavigationContext] refreshNavigationLayout disabled'); 
      },
      updateNavigationLayout: async () => { 
        console.warn('[NavigationContext] updateNavigationLayout disabled'); 
        return false; 
      }
    }}>
      {children}
    </NavigationContext.Provider>
  );
};