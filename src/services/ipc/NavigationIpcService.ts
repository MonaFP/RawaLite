/**
 * NavigationIpcService - Frontend service for navigation operations via IPC
 * 
 * Provides browser-safe interface to database navigation operations.
 * Communicates with main process DatabaseNavigationService via IPC channels.
 * 
 * @since v1.0.45+ (Database-Navigation-System)
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md} Navigation Integration Architecture
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} Critical Fixes Registry
 * @pattern ThemeIpcService (FIX-018: Service Layer Pattern Preservation)
 */

import type { NavigationPreferences, NavigationLayoutConfig, NavigationModeHistory } from '../DatabaseNavigationService';

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
   */
  public async setNavigationMode(
    userId: string = 'default', 
    navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar',
    sessionId?: string
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.navigation) {
        console.warn('[NavigationIpcService] IPC navigation not available');
        return false;
      }

      const success = await window.rawalite.navigation.setNavigationMode(userId, navigationMode, sessionId);
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
      navigationMode: 'header-navigation',
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
      navigationMode: 'header-navigation',
      headerHeight: 72,
      sidebarWidth: 280,
      autoCollapse: false,
      rememberFocusMode: true,
      gridTemplateColumns: '280px 1fr',
      gridTemplateRows: '72px 40px 1fr',
      gridTemplateAreas: `
        "header header"
        "focus-bar focus-bar"
        "sidebar main"`
    };
  }

  /**
   * Generate session ID for navigation tracking
   */
  public generateSessionId(): string {
    return `nav-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if navigation mode is valid
   */
  public isValidNavigationMode(mode: string): mode is 'header-statistics' | 'header-navigation' | 'full-sidebar' {
    return ['header-statistics', 'header-navigation', 'full-sidebar'].includes(mode);
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