/**
 * ConfigurationIpcService - Frontend IPC service for central configuration management
 * 
 * This service provides a clean interface for frontend components to access
 * the centralized configuration system through IPC communication.
 * 
 * IMPORTANT: Navigation layout is now handled separately by NavigationIpcService.
 * This service only handles global configuration (themes, colors, focus mode).
 * 
 * Key Features:
 * - Single getActiveConfig() method for global configuration
 * - Type-safe IPC communication
 * - Error handling and fallback support
 * - Caching for performance optimization
 * - Configuration update operations (theme, focus mode only)
 * 
 * Usage:
 * ```typescript
 * const config = await ConfigurationIpcService.getActiveConfig(userId, theme, focusMode);
 * const layout = await NavigationIpcService.getPerModeNavigationLayout(userId, navMode, focusMode);
 * const success = await ConfigurationIpcService.updateActiveConfig(userId, updates);
 * ```
 * 
 * @since Migration 037 - Centralized Configuration Architecture
 * @updated Per-Mode Navigation Header Isolation Fix - Schritt 2 (Navigation separation)
 */

// ANTI-CORRUPTION: Separate interface for navigation-agnostic configuration
export interface GlobalConfiguration {
  // Theme Configuration
  theme: string;
  themeId: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Focus Mode Overrides
  focusMode: boolean;
  
  // CSS Variables for Frontend (theme-only, no navigation)
  cssVariables: Record<string, string>;
  
  // Configuration Source Tracking (for debugging)
  configurationSource: {
    theme: 'user' | 'system';
  };
}

import type { NavigationMode } from '../DatabaseNavigationService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GetActiveConfigParams {
  userId: string;
  theme: string;
  focusMode: boolean;
  // REMOVED: navigationMode
  // Navigation mode is now handled separately by NavigationIpcService
}

interface UpdateActiveConfigParams {
  userId: string;
  updates: Partial<{
    theme: string;
    focusMode: boolean;
    // REMOVED: headerHeight, sidebarWidth, navigationMode
    // These are now handled by NavigationIpcService.updatePerModeNavigationLayout()
  }>;
}

interface ConfigurationValidationResult {
  isConsistent: boolean;
  issues: string[];
  recommendations: string[];
}

// ============================================================================
// IPC CHANNEL CONSTANTS
// ============================================================================

const CONFIGURATION_IPC_CHANNELS = {
  GET_ACTIVE_CONFIG: 'configuration:get-active-config',
  UPDATE_ACTIVE_CONFIG: 'configuration:update-active-config',
  RESET_TO_DEFAULTS: 'configuration:reset-to-defaults',
  VALIDATE_CONSISTENCY: 'configuration:validate-consistency',
  GET_SYSTEM_DEFAULTS: 'configuration:get-system-defaults',
  GET_THEME_NAVIGATION_DEFAULTS: 'configuration:get-theme-navigation-defaults'
} as const;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class ConfigurationIpcService {
  private static instance: ConfigurationIpcService;
  private configCache = new Map<string, { config: GlobalConfiguration; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigurationIpcService {
    if (!ConfigurationIpcService.instance) {
      ConfigurationIpcService.instance = new ConfigurationIpcService();
    }
    return ConfigurationIpcService.instance;
  }

  /**
   * CENTRAL CONFIGURATION METHOD (Navigation-Agnostic)
   * 
   * This method provides global configuration values (theme, colors, focus mode)
   * WITHOUT navigation-specific layout values (headerHeight, sidebarWidth, etc.)
   * 
   * Navigation layout is now handled separately by NavigationIpcService.getPerModeNavigationLayout()
   * 
   * Replaces:
   * - ThemeIpcService.getUserTheme()
   * - Various hardcoded configuration calls
   * 
   * Does NOT replace:
   * - NavigationIpcService.getPerModeNavigationLayout() (use that for layout)
   * 
   * @param userId - User identifier
   * @param theme - Current theme key
   * @param focusMode - Whether focus mode is active
   * @returns Global configuration (no navigation layout) or null on error
   */
  async getActiveConfig(
    userId: string,
    theme: string,
    focusMode: boolean = false
  ): Promise<GlobalConfiguration | null> {
    try {
      // Generate cache key (no longer includes navigationMode)
      const cacheKey = `${userId}-${theme}-${focusMode}`;
      
      // Check cache first
      const cached = this.configCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        console.log('[ConfigurationIpcService] Returning cached configuration');
        return cached.config;
      }

      console.log('[ConfigurationIpcService] Fetching active configuration:', {
        userId,
        theme,
        focusMode
      });

      const params: GetActiveConfigParams = {
        userId,
        theme,
        focusMode
      };

      const config = await (window as any).rawalite?.configuration?.getActiveConfig?.(params) as GlobalConfiguration | null;

      if (!config) {
        console.error('[ConfigurationIpcService] Failed to get active configuration');
        return this.getEmergencyFallbackConfig(theme, focusMode);
      }

      // Cache the result
      this.configCache.set(cacheKey, {
        config,
        timestamp: Date.now()
      });

      console.log('[ConfigurationIpcService] Active configuration retrieved successfully:', {
        theme: config.theme,
        focusMode: config.focusMode,
        configSource: config.configurationSource
      });

      return config;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error getting active configuration:', error);
      return this.getEmergencyFallbackConfig(theme, focusMode);
    }
  }

  /**
   * Update active configuration (Navigation-Agnostic)
   * 
   * Updates global configuration values (theme, focus mode) and invalidates the cache.
   * Navigation layout updates are now handled by NavigationIpcService.updatePerModeNavigationLayout()
   * 
   * @param userId - User identifier
   * @param updates - Global configuration updates to apply (no navigation layout)
   * @returns Success status
   */
  async updateActiveConfig(
    userId: string,
    updates: Partial<{
      theme: string;
      focusMode: boolean;
    }>
  ): Promise<boolean> {
    try {
      console.log('[ConfigurationIpcService] Updating active configuration:', {
        userId,
        updates
      });

      const params: UpdateActiveConfigParams = {
        userId,
        updates
      };

      const success = await (window as any).rawalite?.configuration?.updateActiveConfig?.(params) as boolean;

      if (success) {
        // Invalidate cache for this user
        this.invalidateUserCache(userId);
        console.log('[ConfigurationIpcService] Configuration updated successfully');
      } else {
        console.error('[ConfigurationIpcService] Failed to update configuration');
      }

      return success;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error updating configuration:', error);
      return false;
    }
  }

  /**
   * Validate configuration consistency
   * 
   * Checks for configuration conflicts and inconsistencies across all user settings.
   * 
   * @param userId - User identifier
   * @returns Validation result with issues and recommendations
   */
  async validateConfigurationConsistency(userId: string): Promise<ConfigurationValidationResult | null> {
    try {
      console.log('[ConfigurationIpcService] Validating configuration consistency');

      const result = await (window as any).rawalite?.configuration?.validateConsistency?.({ userId }) as ConfigurationValidationResult | null;

      if (result) {
        console.log('[ConfigurationIpcService] Validation completed:', {
          isConsistent: result.isConsistent,
          issueCount: result.issues.length,
          recommendationCount: result.recommendations.length
        });
      }

      return result;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error validating consistency:', error);
      return null;
    }
  }

  /**
   * Reset configuration to defaults
   * 
   * Resets user configuration to system defaults.
   * 
   * @param userId - User identifier
   * @returns Success status
   */
  async resetToDefaults(userId: string): Promise<boolean> {
    try {
      console.log('[ConfigurationIpcService] Resetting configuration to defaults');

      const success = await (window as any).rawalite?.configuration?.resetToDefaults?.(userId) as boolean;

      if (success) {
        // Invalidate cache for this user
        this.invalidateUserCache(userId);
        console.log('[ConfigurationIpcService] Configuration reset to defaults successfully');
      } else {
        console.error('[ConfigurationIpcService] Failed to reset configuration to defaults');
      }

      return success;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error resetting to defaults:', error);
      return false;
    }
  }

  /**
   * Get system defaults for debugging/development
   * 
   * @param navigationMode - Navigation mode to get defaults for
   * @returns System defaults object
   */
  async getSystemDefaults(navigationMode: NavigationMode): Promise<any> {
    try {
      const defaults = await (window as any).rawalite?.configuration?.getSystemDefaults?.(navigationMode);

      return defaults;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error getting system defaults:', error);
      return null;
    }
  }

  /**
   * Get theme navigation defaults for debugging/development
   * 
   * @param theme - Theme to get defaults for
   * @returns Theme navigation defaults object
   */
  async getThemeNavigationDefaults(theme: string): Promise<any> {
    try {
      const defaults = await (window as any).rawalite?.configuration?.getThemeNavigationDefaults?.(theme);

      return defaults;

    } catch (error) {
      console.error('[ConfigurationIpcService] Error getting theme navigation defaults:', error);
      return null;
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Invalidate cache for a specific user
   */
  private invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.configCache) {
      if (key.startsWith(`${userId}-`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.configCache.delete(key);
    });

    console.log(`[ConfigurationIpcService] Invalidated cache for user ${userId} (${keysToDelete.length} entries)`);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.configCache.clear();
    console.log('[ConfigurationIpcService] Cache cleared completely');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.configCache.size,
      entries: Array.from(this.configCache.keys())
    };
  }

  // ============================================================================
  // FALLBACK CONFIGURATION
  // ============================================================================

  /**
   * Emergency fallback configuration (Navigation-Agnostic)
   * 
   * Provides basic global configuration when IPC communication fails.
   * Navigation layout is NOT included - use NavigationIpcService for that.
   * 
   * @param theme - Theme for fallback
   * @param focusMode - Focus mode status
   * @returns Emergency global configuration (no navigation layout)
   */
  private getEmergencyFallbackConfig(
    theme: string,
    focusMode: boolean
  ): GlobalConfiguration {
    console.warn('[ConfigurationIpcService] Using emergency fallback configuration (global only)');

    // Basic theme colors
    const themeColors = {
      'sage': { primary: '#7ba87b', secondary: '#5a735a', accent: '#6b976b' },
      'dark': { primary: '#1e3a2e', secondary: '#2a4a35', accent: '#f472b6' },
      'sky': { primary: '#7ba2b8', secondary: '#5a6573', accent: '#6b8ea7' }
    };

    const colors = (themeColors as any)[theme] || themeColors['sage'];

    return {
      // Theme Configuration
      theme: theme || 'sage',
      themeId: 4, // Default to sage
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      backgroundColor: '#fbfcfb',
      textColor: '#2d4a2d',
      
      // Focus Mode
      focusMode: false,
      
      // CSS Variables (theme-only, no navigation)
      cssVariables: {
        '--db-theme-primary': colors.primary,
        '--db-theme-secondary': colors.secondary,
        '--db-theme-accent': colors.accent,
        '--db-theme-background': '#fbfcfb',
        '--db-theme-text': '#2d4a2d'
      },
      
      // Configuration Source (emergency - theme only)
      configurationSource: {
        theme: 'system'
      }
    };
  }
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Static convenience method for getting active configuration (Navigation-Agnostic)
 * 
 * @param userId - User identifier
 * @param theme - Current theme
 * @param focusMode - Focus mode status
 * @returns Active global configuration (no navigation layout)
 */
export async function getActiveConfig(
  userId: string,
  theme: string,
  focusMode: boolean = false
): Promise<GlobalConfiguration | null> {
  return ConfigurationIpcService.getInstance().getActiveConfig(userId, theme, focusMode);
}

/**
 * Static convenience method for updating configuration (Navigation-Agnostic)
 * 
 * @param userId - User identifier
 * @param updates - Global configuration updates (no navigation layout)
 * @returns Success status
 */
export async function updateActiveConfig(
  userId: string,
  updates: Partial<{
    theme: string;
    focusMode: boolean;
  }>
): Promise<boolean> {
  return ConfigurationIpcService.getInstance().updateActiveConfig(userId, updates);
}

// ============================================================================
// EXPORT
// ============================================================================

export default ConfigurationIpcService;

/**
 * VERSION INFORMATION
 * 
 * Created: 2025-10-21
 * Purpose: Frontend IPC service for centralized configuration management
 * Dependencies: DatabaseConfigurationService (via IPC), window.electronAPI
 * 
 * MIGRATION GUIDE:
 * 
 * BEFORE (multiple service calls):
 * ```typescript
 * const layoutConfig = await NavigationIpcService.getLayoutConfig(userId);
 * const themeConfig = await ThemeIpcService.getUserTheme(userId);
 * const headerHeight = layoutConfig.headerHeight;
 * const primaryColor = themeConfig.colors.primary;
 * ```
 * 
 * AFTER (single service call):
 * ```typescript
 * const config = await ConfigurationIpcService.getActiveConfig(userId, theme, navMode, focusMode);
 * const headerHeight = config.headerHeight;
 * const primaryColor = config.primaryColor;
 * ```
 * 
 * PERFORMANCE BENEFITS:
 * - Single IPC call instead of multiple
 * - Intelligent caching (30s TTL)
 * - Emergency fallback support
 * - Type-safe interfaces
 */