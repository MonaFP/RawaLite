/**
 * DatabaseConfigurationService - Central configuration management
 * 
 * This service provides a single source of truth for all theme and navigation configurations
 * by intelligently merging user preferences, mode-specific settings, focus preferences,
 * and theme overrides from existing database tables without requiring new schema tables.
 * 
 * Key Features:
 * - Central getActiveConfig() function replaces all hardcoded constants
 * - Preserves individual configuration for themes, navigation modes, and focus modes
 * - Uses existing database structures (migrations 034-036)
 * - Provides intelligent fallback hierarchy
 * - Generates ready-to-use CSS variables for frontend
 */

import { DatabaseNavigationService, NavigationPreferences, NavigationModeSettings, FocusModePreferences, NavigationMode } from './DatabaseNavigationService';
import { DatabaseThemeService, UserThemePreference } from './DatabaseThemeService';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Complete active configuration - everything the frontend needs
 * This replaces all separate configuration calls and provides a unified interface
 */
export interface ActiveConfiguration {
  // Navigation Layout Configuration
  headerHeight: number;
  sidebarWidth: number;
  gridTemplateRows: string;
  gridTemplateColumns: string;
  gridTemplateAreas?: string;
  
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
  
  // CSS Variables for Frontend (ready-to-apply)
  cssVariables: Record<string, string>;
  
  // Additional Layout Properties
  navigationMode: NavigationMode;
  isCompactMode: boolean;
  
  // Configuration Source Tracking (for debugging)
  configurationSource: {
    headerHeight: 'focus' | 'mode' | 'user' | 'theme' | 'system';
    sidebarWidth: 'focus' | 'mode' | 'user' | 'theme' | 'system';
    theme: 'user' | 'system';
  };
}

/**
 * All configuration sources loaded from existing database tables
 * This interface coordinates data from multiple existing services
 */
interface ConfigurationSources {
  userNavPrefs: NavigationPreferences | null;
  userThemePrefs: UserThemePreference | null;
  modeSettings: NavigationModeSettings | null;
  focusSettings: FocusModePreferences | null;
  themeOverrides: any[] | null; // Will be properly typed when DatabaseThemeService is extended
  theme: string;
  navigationMode: NavigationMode;
  focusMode: boolean;
}

/**
 * System defaults for navigation modes
 * These replace all hardcoded constants throughout the codebase
 */
interface SystemDefaults {
  headerHeight: number;
  sidebarWidth: number;
  gridTemplateRows: string;
  gridTemplateColumns: string;
  isCompactMode: boolean;
}

/**
 * Theme-based adjustments to navigation defaults
 * Different themes may require slight layout adjustments
 */
interface ThemeNavigationDefaults {
  headerAdjustment: number;
  sidebarAdjustment: number;
  gridTemplateAdjustment?: string;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class DatabaseConfigurationService {
  private navigationService: DatabaseNavigationService;
  private themeService: DatabaseThemeService;

  /**
   * Initialize configuration service with database instances
   */
  constructor(db: any) {
    this.navigationService = new DatabaseNavigationService(db);
    this.themeService = new DatabaseThemeService(db);
  }
  
  /**
   * CENTRAL CONFIGURATION FUNCTION
   * 
   * This function replaces all hardcoded constants and provides a single source
   * of truth for all configuration values. It intelligently merges configuration
   * from multiple sources with a clear priority hierarchy.
   * 
   * Priority Order:
   * 1. Focus Mode Settings (if focus mode active)
   * 2. Mode-Specific Settings (Migration 034)
   * 3. User Navigation Preferences (existing)
   * 4. Theme-based Defaults (calculated)
   * 5. System Defaults (hardcoded fallback)
   * 
   * @param userId - User identifier
   * @param theme - Current theme key ('sage', 'dark', etc.)
   * @param navigationMode - Current navigation mode
   * @param focusMode - Whether focus mode is active
   * @returns Complete configuration ready for use
   */
  async getActiveConfig(
    userId: string, 
    theme: string, 
    navigationMode: NavigationMode, 
    focusMode: boolean = false
  ): Promise<ActiveConfiguration> {
    
    try {
      // Step 1: Load all configuration sources from existing database tables
      const sources = await this.loadConfigurationSources(
        userId, 
        theme, 
        navigationMode, 
        focusMode
      );
      
      // Step 2: Get system defaults for this navigation mode
      const systemDefaults = this.getSystemDefaults(navigationMode);
      
      // Step 3: Get theme-based adjustments
      const themeDefaults = this.getThemeNavigationDefaults(theme);
      
      // Step 4: Merge all configurations with priority hierarchy
      const mergedConfig = this.mergeConfigurations(sources, systemDefaults, themeDefaults);
      
      // Step 5: Generate CSS variables for frontend
      const cssVariables = this.generateCSSVariables(mergedConfig, sources);
      
      // Step 6: Build final active configuration
      return {
        // Navigation Layout
        headerHeight: mergedConfig.headerHeight,
        sidebarWidth: mergedConfig.sidebarWidth,
        gridTemplateRows: mergedConfig.gridTemplateRows,
        gridTemplateColumns: mergedConfig.gridTemplateColumns,
        gridTemplateAreas: mergedConfig.gridTemplateAreas,
        
        // Theme Configuration
        theme: sources.theme,
        themeId: sources.userThemePrefs?.activeThemeId || 4, // Correct property name
        primaryColor: mergedConfig.primaryColor,
        secondaryColor: mergedConfig.secondaryColor,
        accentColor: mergedConfig.accentColor,
        backgroundColor: mergedConfig.backgroundColor,
        textColor: mergedConfig.textColor,
        
        // Focus Mode (controlled by focusMode boolean)
        focusMode: sources.focusMode,
        
        // CSS Variables (ready for frontend)
        cssVariables,
        
        // Additional Properties
        navigationMode: sources.navigationMode,
        isCompactMode: mergedConfig.isCompactMode,
        
        // Configuration Source Tracking (for debugging)
        configurationSource: mergedConfig.configurationSource
      };
      
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error in getActiveConfig:', error);
      
      // Return emergency fallback configuration with service pattern consistency
      return this.getEmergencyFallbackConfig(navigationMode, theme, focusMode);
    }
  }
  
  /**
   * Load all configuration sources from existing database tables
   * This function coordinates calls to existing services without duplicating logic
   */
  private async loadConfigurationSources(
    userId: string, 
    theme: string, 
    navigationMode: NavigationMode, 
    focusMode: boolean
  ): Promise<ConfigurationSources> {
    
    // Load from existing services in parallel for performance
    const [
      userNavPrefs,
      userThemePrefs,
      modeSettings,
      focusSettings
    ] = await Promise.all([
      this.navigationService.getUserNavigationPreferences(userId),
      this.themeService.getUserThemePreference(userId),
      this.navigationService.getModeSpecificSettings(userId, navigationMode),
      focusMode ? this.navigationService.getFocusModePreferences(userId, navigationMode) : null
    ]);
    
    // Theme overrides - placeholder for future enhancement
    // TODO: Implement when DatabaseThemeService.getThemeOverrides() is available
    const themeOverrides = null;
    
    return {
      userNavPrefs,
      userThemePrefs,
      modeSettings,
      focusSettings,
      themeOverrides,
      theme,
      navigationMode,
      focusMode
    };
  }
  
  /**
   * System defaults for each navigation mode
   * Uses SYSTEM_DEFAULTS from DatabaseNavigationService for consistency
   */
  private getSystemDefaults(navigationMode: NavigationMode): SystemDefaults {
    const systemDefaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
    
    return {
      headerHeight: systemDefaults.MIN_HEADER_HEIGHTS[navigationMode] || systemDefaults.MIN_HEADER_HEIGHTS['mode-dashboard-view'],
      sidebarWidth: systemDefaults.SIDEBAR_WIDTHS[navigationMode] || systemDefaults.SIDEBAR_WIDTHS['mode-dashboard-view'],
      gridTemplateRows: systemDefaults.GRID_TEMPLATE_ROWS[navigationMode] || systemDefaults.GRID_TEMPLATE_ROWS['mode-dashboard-view'],
      gridTemplateColumns: systemDefaults.GRID_TEMPLATE_COLUMNS[navigationMode] || systemDefaults.GRID_TEMPLATE_COLUMNS['mode-dashboard-view'],
      isCompactMode: navigationMode === 'mode-compact-focus'
    };
  }
  
  /**
   * Theme-based navigation adjustments
   * Different themes may require slight layout modifications
   * 
   * TODO: Phase 2 Enhancement - Expand when DatabaseThemeService provides getThemeNavigationOverrides()
   */
  private getThemeNavigationDefaults(theme: string): ThemeNavigationDefaults {
    const themeDefaults = {
      'sage': { headerAdjustment: 0, sidebarAdjustment: 0 },
      'dark': { headerAdjustment: -5, sidebarAdjustment: 10 },
      'sky': { headerAdjustment: 5, sidebarAdjustment: -5 },
      'lavender': { headerAdjustment: 0, sidebarAdjustment: 5 },
      'peach': { headerAdjustment: 0, sidebarAdjustment: 0 },
      'rose': { headerAdjustment: 0, sidebarAdjustment: 0 },
      'default': { headerAdjustment: 0, sidebarAdjustment: 0 }
    };
    
    return (themeDefaults as any)[theme] || (themeDefaults as any)['default'];
  }
  
  /**
   * Intelligent configuration merging with priority hierarchy
   * This is the core logic that eliminates all hardcoded constants
   */
  private mergeConfigurations(
    sources: ConfigurationSources,
    systemDefaults: SystemDefaults,
    themeDefaults: ThemeNavigationDefaults
  ): any {
    
    // Priority 1: Focus Mode Settings (highest priority when active)
    let headerHeight = systemDefaults.headerHeight;
    let sidebarWidth = systemDefaults.sidebarWidth;
    let configSource: {
      headerHeight: 'focus' | 'mode' | 'user' | 'theme' | 'system';
      sidebarWidth: 'focus' | 'mode' | 'user' | 'theme' | 'system';
      theme: 'user' | 'system';
    } = {
      headerHeight: 'system',
      sidebarWidth: 'system',
      theme: 'system'
    };
    
    // Apply theme adjustments to system defaults
    if (themeDefaults.headerAdjustment !== 0) {
      headerHeight += themeDefaults.headerAdjustment;
      configSource.headerHeight = 'theme';
    }
    if (themeDefaults.sidebarAdjustment !== 0) {
      sidebarWidth += themeDefaults.sidebarAdjustment;
      configSource.sidebarWidth = 'theme';
    }
    
    // Priority 2: Mode-Specific Settings (Migration 034) - HIGHER PRIORITY than global user prefs
    if (sources.modeSettings?.headerHeight) {
      headerHeight = sources.modeSettings.headerHeight;
      configSource.headerHeight = 'mode';
    }
    if (sources.modeSettings?.sidebarWidth) {
      sidebarWidth = sources.modeSettings.sidebarWidth;
      configSource.sidebarWidth = 'mode';
    }
    
    // Priority 3: Global User Navigation Preferences (FALLBACK when no mode-specific setting exists)
    // Only apply if mode-specific settings are not available
    if (!sources.modeSettings?.headerHeight && sources.userNavPrefs?.headerHeight) {
      headerHeight = sources.userNavPrefs.headerHeight;
      configSource.headerHeight = 'user';
    }
    if (!sources.modeSettings?.sidebarWidth && sources.userNavPrefs?.sidebarWidth) {
      sidebarWidth = sources.userNavPrefs.sidebarWidth;
      configSource.sidebarWidth = 'user';
    }
    
    // Priority 4: Focus Mode Settings (highest priority when active)
    // Note: FocusModePreferences do not have layout dimension overrides in current schema
    if (sources.focusMode && sources.focusSettings) {
      // Focus mode affects behavior but not layout dimensions in current implementation
      // Future enhancement: Add layout override properties to FocusModePreferences schema
    }
    
    // User theme preference
    if (sources.userThemePrefs) {
      configSource.theme = 'user';
    }
    
    // Generate derived values
    const gridTemplateRows = `${headerHeight}px 40px 1fr`;
    const gridTemplateColumns = `${sidebarWidth}px 1fr`;
    
    // Basic theme colors (will be enhanced when DatabaseThemeService is extended)
    const themeColors = this.getBasicThemeColors(sources.theme);
    
    return {
      headerHeight,
      sidebarWidth,
      gridTemplateRows,
      gridTemplateColumns,
      gridTemplateAreas: systemDefaults.isCompactMode ? 
        '"sidebar" "content" "footer"' : 
        '"header header" "sidebar content" "footer footer"',
      isCompactMode: systemDefaults.isCompactMode,
      configurationSource: configSource,
      ...themeColors
    };
  }
  
  /**
   * Generate CSS variables for frontend application
   * These replace manual CSS variable setting throughout the frontend
   */
  private generateCSSVariables(mergedConfig: any, sources: ConfigurationSources): Record<string, string> {
    return {
      // Layout Variables
      '--db-header-height': `${mergedConfig.headerHeight}px`,
      '--db-sidebar-width': `${mergedConfig.sidebarWidth}px`,
      '--db-grid-template-rows': mergedConfig.gridTemplateRows,
      '--db-grid-template-columns': mergedConfig.gridTemplateColumns,
      '--db-grid-template-areas': mergedConfig.gridTemplateAreas || 'none',
      
      // Theme Variables
      '--db-theme-primary': mergedConfig.primaryColor,
      '--db-theme-secondary': mergedConfig.secondaryColor,
      '--db-theme-accent': mergedConfig.accentColor,
      '--db-theme-background': mergedConfig.backgroundColor,
      '--db-theme-text': mergedConfig.textColor,
      
      // Focus Mode Variables (controlled by focusMode boolean)
      '--db-focus-mode': sources.focusMode ? '1' : '0',
      
      // Navigation Mode Variables
      '--db-navigation-mode': sources.navigationMode,
      '--db-compact-mode': mergedConfig.isCompactMode ? '1' : '0'
    };
  }
  
  /**
   * Basic theme colors - Phase 1 implementation
   * TODO: Phase 2 - Replace with DatabaseThemeService.getThemeColors() when available
   */
  private getBasicThemeColors(theme: string): any {
    const colors = {
      'sage': {
        primaryColor: '#7ba87b',
        secondaryColor: '#5a735a',
        accentColor: '#6b976b',
        backgroundColor: '#fbfcfb',
        textColor: '#2d4a2d'
      },
      'dark': {
        primaryColor: '#1e3a2e',
        secondaryColor: '#2a4a35',
        accentColor: '#f472b6',
        backgroundColor: '#f1f5f9',
        textColor: '#1e293b'
      },
      'sky': {
        primaryColor: '#7ba2b8',
        secondaryColor: '#5a6573',
        accentColor: '#6b8ea7',
        backgroundColor: '#fbfcfd',
        textColor: '#2d3a4a'
      }
    };
    
    return (colors as any)[theme] || (colors as any)['sage'];
  }
  
  /**
   * Emergency fallback configuration
   * Used when database operations fail - ensures app remains functional
   */
  private getEmergencyFallbackConfig(
    navigationMode: NavigationMode, 
    theme: string, 
    focusMode: boolean
  ): ActiveConfiguration {
    const defaults = this.getSystemDefaults(navigationMode);
    const themeColors = this.getBasicThemeColors(theme);
    
    return {
      // Layout fallbacks
      headerHeight: defaults.headerHeight,
      sidebarWidth: defaults.sidebarWidth,
      gridTemplateRows: defaults.gridTemplateRows,
      gridTemplateColumns: defaults.gridTemplateColumns,
      
      // Theme fallbacks
      theme: theme || 'sage',
      themeId: 4, // Sage theme fallback
      primaryColor: themeColors.primaryColor,
      secondaryColor: themeColors.secondaryColor,
      accentColor: themeColors.accentColor,
      backgroundColor: themeColors.backgroundColor,
      textColor: themeColors.textColor,
      
      // Focus mode fallbacks (controlled by boolean)
      focusMode: false,
      
      // CSS variables (emergency)
      cssVariables: {
        '--db-header-height': `${defaults.headerHeight}px`,
        '--db-sidebar-width': `${defaults.sidebarWidth}px`,
        '--db-grid-template-rows': defaults.gridTemplateRows,
        '--db-grid-template-columns': defaults.gridTemplateColumns
      },
      
      // Additional properties
      navigationMode,
      isCompactMode: defaults.isCompactMode,
      
      // Source tracking (emergency)
      configurationSource: {
        headerHeight: 'system',
        sidebarWidth: 'system',
        theme: 'system'
      }
    };
  }
  
  /**
   * Utility method to update active configuration
   * This will be used by frontend components to update specific configuration aspects
   */
  async updateActiveConfig(
    userId: string,
    updates: Partial<{
      headerHeight: number;
      sidebarWidth: number;
      navigationMode: NavigationMode;
      theme: string;
      focusMode: boolean;
    }>
  ): Promise<boolean> {
    try {
      // Delegate to appropriate existing services
      let success = true;
      
      if (updates.headerHeight !== undefined || updates.sidebarWidth !== undefined) {
        const dimensionUpdates: any = {};
        if (updates.headerHeight !== undefined) dimensionUpdates.headerHeight = updates.headerHeight;
        if (updates.sidebarWidth !== undefined) dimensionUpdates.sidebarWidth = updates.sidebarWidth;
        
        success = success && await this.navigationService.updateLayoutDimensions(userId, dimensionUpdates.headerHeight, dimensionUpdates.sidebarWidth);
      }
      
      if (updates.navigationMode !== undefined) {
        success = success && await this.navigationService.setNavigationMode(userId, updates.navigationMode);
      }
      
      if (updates.theme !== undefined) {
        // Theme update implementation
        // TODO: Implement when DatabaseThemeService.setUserTheme() method is enhanced
        // Example: success = success && await this.themeService.setUserTheme(userId, updates.theme);
        console.log('[DatabaseConfigurationService] Theme update will be implemented in Phase 2:', updates.theme);
      }
      
      return success;
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error updating active config:', error);
      return false;
    }
  }
  
  /**
   * Validate configuration consistency across all sources
   * This method helps identify configuration conflicts and inconsistencies
   */
  async validateConfigurationConsistency(userId: string): Promise<{
    isConsistent: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Load all user configurations
      const userNavPrefs = await this.navigationService.getUserNavigationPreferences(userId);
      // Note: getAllModeSettings and getAllFocusPreferences may not exist in current implementation
      // This is a placeholder for future enhancement when those methods are added
      
      // Check for basic navigation preferences consistency
      if (!userNavPrefs) {
        issues.push('No user navigation preferences found');
        recommendations.push('Initialize navigation preferences for user');
      } else {
        // Validate header height is within reasonable bounds
        const mode = userNavPrefs.navigationMode || 'header-statistics';
        const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
        const expectedHeight = defaults.MIN_HEADER_HEIGHTS[mode as NavigationMode];
        
        if (userNavPrefs.headerHeight && Math.abs(userNavPrefs.headerHeight - expectedHeight) > 50) {
          issues.push(`Header height ${userNavPrefs.headerHeight}px significantly differs from expected ${expectedHeight}px for mode ${mode}`);
          recommendations.push('Consider resetting navigation preferences to defaults');
        }
      }
      
      return {
        isConsistent: issues.length === 0,
        issues,
        recommendations
      };
      
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error validating configuration consistency:', error);
      return {
        isConsistent: false,
        issues: ['Failed to validate configuration consistency'],
        recommendations: ['Check database connectivity and service health']
      };
    }
  }
}

/**
 * Export types for use in other modules
 */
export type { ConfigurationSources, SystemDefaults, ThemeNavigationDefaults };

/**
 * VERSION INFORMATION
 * 
 * Created: 2025-10-21
 * Purpose: Central configuration management to replace hardcoded constants
 * Dependencies: DatabaseNavigationService, DatabaseThemeService (existing)
 * Migration Required: Migration 037 (to fix inconsistent header heights)
 * 
 * IMPLEMENTATION PHASES:
 * Phase 1: ✅ This service created with core getActiveConfig() functionality
 * Phase 2: 🔄 Extend DatabaseNavigationService and DatabaseThemeService with SYSTEM_DEFAULTS
 * Phase 3: 🔄 Create IPC integration for frontend access
 * Phase 4: 🔄 Replace hardcoded constants throughout codebase
 * Phase 5: 🔄 Migration 037 for database consistency
 * Phase 6: 🔄 Frontend component integration
 * Phase 7: 🔄 Testing and validation
 */