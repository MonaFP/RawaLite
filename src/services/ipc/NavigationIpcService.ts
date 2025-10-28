/**
 * NavigationIpcService - Frontend service for navigation operations via IPC
 * 
 * Provides browser-safe interface to database navigation operations.
 * Communicates with main process DatabaseNavigationService via IPC channels.
 * 
 * ✅ LEGACY ISOLATION STRATEGY:
 * - Uses navigation-safe.ts for KI-safe type handling
 * - Legacy modes converted at IPC boundaries only
 * - UI/Service methods work EXCLUSIVELY with KI-Safe modes
 * 
 * @since v1.0.45+ (Database-Navigation-System)
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md} Navigation Integration Architecture
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} Critical Fixes Registry
 * @pattern ThemeIpcService (FIX-018: Service Layer Pattern Preservation)
 */

// ✅ CLEAN TYPE IMPORTS from navigation-safe.ts
import { 
  KiSafeNavigationMode,
  NavigationModeInput,
  NAVIGATION_MODES_SAFE,
  isValidNavigationMode,
  normalizeToKiSafe,
  validateNavigationMode,
  DEFAULT_NAVIGATION_MODE
} from '../../types/navigation-safe';

// ✅ LEGACY-ISOLATED DatabaseNavigationService types
import type { 
  NavigationPreferences, 
  NavigationLayoutConfig, 
  NavigationModeHistory 
} from '../DatabaseNavigationService';

// ✅ ALIAS für saubere Migration (alle IPC Services verwenden NavigationMode = KiSafeNavigationMode)
export type NavigationMode = KiSafeNavigationMode;

export class NavigationIpcService {
  private static instance: NavigationIpcService;

  public static getInstance(): NavigationIpcService {
    if (!NavigationIpcService.instance) {
      NavigationIpcService.instance = new NavigationIpcService();
    }
    return NavigationIpcService.instance;
  }

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get user's navigation preferences from database
   */
  public async getUserNavigationPreferences(userId: string = 'default'): Promise<NavigationPreferences> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available, using defaults');
        return this.getDefaultPreferences(userId);
      }

      const preferences = await window.rawalite.navigation.getUserPreferences(userId);
      return preferences || this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('[NavigationIpcService] Failed to get navigation preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Set user's complete navigation preferences
   */
  public async setUserNavigationPreferences(userId: string = 'default', preferences: Partial<NavigationPreferences>): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      const success = await window.rawalite.navigation.setUserPreferences(userId, preferences);
      return success || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to set navigation preferences:', error);
      return false;
    }
  }

  /**
   * Set navigation mode only (fast operation)
   * ✅ LEGACY ISOLATION: Accepts legacy modes via NavigationModeInput but normalizes immediately
   */
  public async setNavigationMode(
    userId: string = 'default', 
    navigationMode: NavigationModeInput,  // ✅ Accept both, normalize immediately
    sessionId?: string
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      // ✅ NORMALIZATION: Convert input to KI-safe, then to Legacy for IPC
      const kiSafeMode = normalizeToKiSafe(navigationMode);
      const success = await window.rawalite.navigation.setNavigationMode(userId, kiSafeMode, sessionId);
      return success || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to set navigation mode:', error);
      return false;
    }
  }

  /**
   * Update layout dimensions (header height and sidebar width)
   */
  public async updateLayoutDimensions(
    userId: string = 'default',
    headerHeight?: number,
    sidebarWidth?: number
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      const success = await window.rawalite.navigation.updateLayoutDimensions(userId, headerHeight, sidebarWidth);
      return success || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to update layout dimensions:', error);
      return false;
    }
  }

  /**
   * Get complete navigation layout configuration for CSS Grid
   */
  public async getNavigationLayoutConfig(userId: string = 'default'): Promise<NavigationLayoutConfig> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available, using defaults');
        return this.getDefaultLayoutConfig();
      }

      const config = await window.rawalite.navigation.getLayoutConfig(userId);
      return config || this.getDefaultLayoutConfig();
    } catch (error) {
      console.error('[NavigationIpcService] Failed to get layout config:', error);
      return this.getDefaultLayoutConfig();
    }
  }

  /**
   * ANTI-CORRUPTION: Get per-mode navigation layout configuration
   * 
   * This method provides navigation layout specific to a navigation mode,
   * preventing mode-specific values from polluting global configuration.
   * 
   * ✅ LEGACY ISOLATION: Accepts legacy modes via NavigationModeInput but normalizes immediately
   * 
   * @param userId - User identifier
   * @param navigationMode - Specific navigation mode to get layout for (accepts legacy + KI-safe)
   * @param focusMode - Whether focus mode is active
   * @returns Per-mode navigation layout configuration
   */
  public async getPerModeNavigationLayout(
    userId: string = 'default',
    navigationMode: NavigationModeInput,  // ✅ Accept both, normalize immediately
    focusMode: boolean = false
  ): Promise<NavigationLayoutConfig> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available, using per-mode defaults');
        return this.getPerModeDefaultLayoutConfig(navigationMode, focusMode);
      }

      console.log('[NavigationIpcService] Getting per-mode navigation layout:', {
        userId,
        navigationMode,
        focusMode
      });

      const config = await window.rawalite.navigation.getLayoutConfig?.(userId);
      
      if (!config) {
        console.warn('[NavigationIpcService] Layout config not available, using defaults');
        return this.getPerModeDefaultLayoutConfig(navigationMode, focusMode);
      }

      // Return complete NavigationLayoutConfig with all required fields
      const defaultConfig = this.getPerModeDefaultLayoutConfig(navigationMode, focusMode);
      
      // ✅ NORMALIZATION: Input → KI-safe for interface compatibility
      const safeNavigationMode = normalizeToKiSafe(navigationMode);
      
      return {
        navigationMode: safeNavigationMode,
        headerHeight: config.headerHeight || defaultConfig.headerHeight,
        sidebarWidth: config.sidebarWidth || defaultConfig.sidebarWidth,
        autoCollapse: config.autoCollapse || defaultConfig.autoCollapse,
        rememberFocusMode: config.rememberFocusMode || defaultConfig.rememberFocusMode,
        gridTemplateRows: config.gridTemplateRows || defaultConfig.gridTemplateRows,
        gridTemplateColumns: config.gridTemplateColumns || defaultConfig.gridTemplateColumns,
        gridTemplateAreas: config.gridTemplateAreas || defaultConfig.gridTemplateAreas
      };
    } catch (error) {
      console.error('[NavigationIpcService] Failed to get per-mode layout config:', error);
      return this.getPerModeDefaultLayoutConfig(navigationMode, focusMode);
    }
  }

  /**
   * ANTI-CORRUPTION: Update per-mode navigation layout configuration
   * 
   * Updates navigation layout for a specific mode without affecting other modes.
   * 
   * ✅ LEGACY ISOLATION: Accepts legacy modes via NavigationModeInput but normalizes immediately
   * 
   * @param userId - User identifier
   * @param navigationMode - Specific navigation mode to update (accepts legacy + KI-safe)
   * @param updates - Layout updates to apply
   * @returns Success status
   */
  public async updatePerModeNavigationLayout(
    userId: string = 'default',
    navigationMode: NavigationModeInput,  // ✅ Accept both, normalize immediately
    updates: Partial<{ headerHeight: number; sidebarWidth: number }>
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      // ✅ NORMALIZATION: Convert input to KI-safe for logging/tracking
      const kiSafeMode = normalizeToKiSafe(navigationMode);

      console.log('[NavigationIpcService] Updating per-mode navigation layout:', {
        userId,
        navigationMode: kiSafeMode,  // ✅ Log KI-safe mode
        updates
      });

      const success = await window.rawalite.navigation.updateLayoutDimensions?.(userId, updates.headerHeight, updates.sidebarWidth);
      return success || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to update per-mode layout config:', error);
      return false;
    }
  }

  /**
   * Get navigation mode history for user
   */
  public async getNavigationModeHistory(userId: string = 'default', limit: number = 10): Promise<NavigationModeHistory[]> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return [];
      }

      const history = await window.rawalite.navigation.getModeHistory(userId, limit);
      return history || [];
    } catch (error) {
      console.error('[NavigationIpcService] Failed to get navigation history:', error);
      return [];
    }
  }

  /**
   * Get navigation mode statistics
   */
  public async getNavigationModeStatistics(userId: string = 'default'): Promise<Record<string, number>> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return {};
      }

      const stats = await window.rawalite.navigation.getStatistics(userId);
      return stats || {};
    } catch (error) {
      console.error('[NavigationIpcService] Failed to get navigation statistics:', error);
      return {};
    }
  }

  /**
   * Reset navigation preferences to defaults
   */
  public async resetNavigationPreferences(userId: string = 'default'): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      const success = await window.rawalite.navigation.resetPreferences(userId);
      return success || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to reset navigation preferences:', error);
      return false;
    }
  }

  /**
   * Validate that Migration 028 is properly applied
   */
  public async validateNavigationSchema(): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      const isValid = await window.rawalite.navigation.validateSchema();
      return isValid || false;
    } catch (error) {
      console.error('[NavigationIpcService] Failed to validate navigation schema:', error);
      return false;
    }
  }

  // === UTILITY METHODS ===

  /**
   * Get default navigation preferences
   */
  private getDefaultPreferences(userId: string): NavigationPreferences {
    return {
      userId,
      navigationMode: 'mode-data-panel',  // was: header-navigation
      headerHeight: 72,
      sidebarWidth: 280,
      autoCollapse: false,
      rememberFocusMode: true
    };
  }

  /**
   * Get default layout configuration
   */
  private getDefaultLayoutConfig(): NavigationLayoutConfig {
    return {
      navigationMode: 'mode-data-panel',  // was: header-navigation
      headerHeight: 72,
      sidebarWidth: 280,
      autoCollapse: false,
      rememberFocusMode: true,
      gridTemplateColumns: '280px 1fr',
      gridTemplateRows: '72px 1fr 60px',
      gridTemplateAreas: `
        "sidebar header"
        "sidebar main"
        "sidebar footer"`
    };
  }

  /**
   * Get per-mode default layout configuration
   * 
   * Provides system defaults specific to each navigation mode for fallback scenarios.
   * 
   * ✅ LEGACY ISOLATION: Accepts legacy modes via NavigationModeInput but normalizes immediately
   * 
   * @param navigationMode - Navigation mode to get defaults for (accepts legacy + KI-safe)
   * @param focusMode - Whether focus mode is active
   * @returns Per-mode default layout configuration
   */
  private getPerModeDefaultLayoutConfig(
    navigationMode: NavigationModeInput,  // ✅ Accept both, normalize immediately
    focusMode: boolean = false
  ): NavigationLayoutConfig {
    // ✅ NORMALIZATION: Convert input to KI-safe first
    const kiSafeMode = normalizeToKiSafe(navigationMode);
    
    // ✅ SYSTEM DEFAULTS: Use KI-safe mode names ONLY (legacy compatibility via conversion functions)
    const systemDefaults = {
      // KI-safe defaults (primary)
      'mode-dashboard-view': { headerHeight: 160, sidebarWidth: 240 },
      'mode-data-panel': { headerHeight: 160, sidebarWidth: 280 },
      'mode-compact-focus': { headerHeight: 72, sidebarWidth: 240 }
    };

    // Try KI-safe first, then default fallback
    const defaults = systemDefaults[kiSafeMode] || systemDefaults['mode-dashboard-view'];

    return {
      navigationMode: kiSafeMode,  // ✅ Always return KI-safe mode
      headerHeight: defaults.headerHeight,
      sidebarWidth: defaults.sidebarWidth,
      autoCollapse: false,
      rememberFocusMode: true,
      gridTemplateColumns: `${defaults.sidebarWidth}px 1fr`,
      gridTemplateRows: `${defaults.headerHeight}px 1fr 60px`,
      gridTemplateAreas: '"sidebar header" "sidebar main" "sidebar footer"'
    };
  }

  /**
   * Generate session ID for navigation tracking
   */
  public generateSessionId(): string {
    return `nav-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if navigation mode is valid (uses navigation-safe.ts validation)
   */
  public isValidNavigationMode(mode: string): mode is NavigationModeInput {
    return isValidNavigationMode(mode);
  }

  /**
   * Validate layout dimensions
   */
  public validateLayoutDimensions(headerHeight?: number, sidebarWidth?: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (headerHeight !== undefined) {
      if (headerHeight < 60 || headerHeight > 120) {
        errors.push('Header height must be between 60px and 120px');
      }
    }

    if (sidebarWidth !== undefined) {
      if (sidebarWidth < 180 || sidebarWidth > 320) {
        errors.push('Sidebar width must be between 180px and 320px');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}