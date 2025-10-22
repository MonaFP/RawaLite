/**
 * DatabaseNavigationService - CRUD operations for database-first navigation management
 * 
 * Manages navigation preferences and layout settings with:
 * - Field-Mapper integration for camelCase ↔ snake_case conversion
 * - TypeScript interfaces for type safety
 * - Error handling and validation
 * - Performance optimizations with prepared statements
 * - localStorage fallback compatibility
 * 
 * @since v1.0.45+ (Database-Navigation-System)
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md} Navigation Integration Architecture
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} Critical Fixes Registry
 * @pattern DatabaseThemeService (FIX-018: Service Layer Pattern Preservation)
 */

import type Database from 'better-sqlite3';
import { FieldMapper, mapToSQL, mapFromSQL } from '../lib/field-mapper';

// TypeScript types for navigation system
export type NavigationMode = 'header-statistics' | 'header-navigation' | 'full-sidebar';

// TypeScript interfaces for navigation system
export interface NavigationPreferences {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;
  headerHeight: number;
  sidebarWidth: number;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Per-Mode Settings Interface (Migration 034)
export interface NavigationModeSettings {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;
  headerHeight: number;
  sidebarWidth: number;
  autoCollapseMobile: boolean;
  autoCollapseTablet: boolean;
  rememberDimensions: boolean;
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridTemplateAreas?: string;
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Focus Mode Preferences Interface (Migration 035)
export interface FocusModePreferences {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;
  autoFocusEnabled: boolean;
  autoFocusDelaySeconds: number;
  focusOnModeSwitch: boolean;
  hideSidebarInFocus: boolean;
  hideHeaderStatsInFocus: boolean;
  dimBackgroundOpacity: number;
  transitionDurationMs: number;
  transitionEasing: string;
  blockNotifications: boolean;
  blockPopups: boolean;
  blockContextMenu: boolean;
  minimalUiMode: boolean;
  trackFocusSessions: boolean;
  showFocusTimer: boolean;
  focusBreakReminders: boolean;
  focusBreakIntervalMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavigationModeHistory {
  id?: number;
  userId: string;
  previousMode?: NavigationMode;
  newMode: NavigationMode;
  changedAt?: string;
  sessionId?: string;
}

export interface NavigationLayoutConfig {
  // Mode Configuration
  navigationMode: NavigationMode;
  
  // Layout Dimensions
  headerHeight: number;        // 60-220px range
  sidebarWidth: number;        // 180-320px range
  
  // Behavior Settings
  autoCollapse: boolean;       // Auto-collapse sidebar on mobile
  rememberFocusMode: boolean;  // Remember focus mode preferences
  
  // CSS Grid Configuration
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridTemplateAreas: string;
}

export class DatabaseNavigationService {
  private db: Database.Database;
  
  /**
   * SYSTEM DEFAULTS - Single Source of Truth for Navigation Constants
   * 
   * These constants replace ALL hardcoded values throughout the codebase.
   * Any code that previously used hardcoded header heights, sidebar widths,
   * or grid templates should now reference these centralized values.
   * 
   * CRITICAL: Keep synchronized with DatabaseConfigurationService.getSystemDefaults()
   * 
   * Used by:
   * - getOptimalHeaderHeight() → HEADER_HEIGHTS
   * - getDefaultLayoutConfig() → ALL values
   * - getUserNavigationPreferences() defaults → DEFAULT_PREFERENCES
   * - resetUserPreferences() → DEFAULT_PREFERENCES
   * - CSS fallbacks via DatabaseConfigurationService
   * 
   * @since Migration 037 - Centralized Constants Architecture
   */
  static readonly SYSTEM_DEFAULTS = {
    // Header heights for each navigation mode
    HEADER_HEIGHTS: {
      'header-statistics': 160,
      'header-navigation': 160,
      'full-sidebar': 36
    },
    
    // Sidebar widths for each navigation mode
    SIDEBAR_WIDTHS: {
      'header-statistics': 240,
      'header-navigation': 280,
      'full-sidebar': 240
    },
    
    // CSS Grid template rows for each mode
    GRID_TEMPLATE_ROWS: {
      'header-statistics': '160px 40px 1fr',
      'header-navigation': '160px 40px 1fr',
      'full-sidebar': '36px 40px 1fr'
    },
    
    // CSS Grid template columns for each mode
    GRID_TEMPLATE_COLUMNS: {
      'header-statistics': '240px 1fr',
      'header-navigation': '280px 1fr',
      'full-sidebar': '240px 1fr'
    },
    
    // CSS Grid template areas for each mode
    // INDIVIDUALIZED: Each mode has its own specific layout structure
    // RawaLite uses: sidebar (left, spans 3 rows), header (top right), focus-bar (middle right), main (bottom right)
    GRID_TEMPLATE_AREAS: {
      'header-statistics': '"sidebar header" "sidebar focus-bar" "sidebar main"',      // Sidebar spans full height, header only on right
      'header-navigation': '"sidebar header" "sidebar focus-bar" "sidebar main"',      // Sidebar spans full height, header only on right
      'full-sidebar': '"sidebar header" "sidebar focus-bar" "sidebar main"'           // Sidebar spans full height, minimal header on right
    },
    
    // Default user preferences (replaces hardcoded values in getUserNavigationPreferences)
    DEFAULT_PREFERENCES: {
      navigationMode: 'header-statistics' as NavigationMode,
      headerHeight: 160,
      sidebarWidth: 240,
      autoCollapse: false,
      rememberFocusMode: true
    },
    
    // Minimum heights for validation (replaces getOptimalHeaderHeight logic)
    MIN_HEADER_HEIGHTS: {
      'header-statistics': 120,
      'header-navigation': 120,
      'full-sidebar': 36
    },
    
    // Maximum dimensions for validation
    MAX_DIMENSIONS: {
      headerHeight: 300,
      sidebarWidth: 400
    },
    
    // Breakpoints for responsive behavior
    BREAKPOINTS: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    }
  } as const;
  
  // Type definitions for the constants
  static readonly NAVIGATION_MODES = ['header-statistics', 'header-navigation', 'full-sidebar'] as const;
  
  // Prepared statements for performance
  private statements: {
    getUserPreferences?: Database.Statement;
    upsertUserPreferences?: Database.Statement;
    updateNavigationMode?: Database.Statement;
    updateLayoutDimensions?: Database.Statement;
    insertModeHistory?: Database.Statement;
    getModeHistory?: Database.Statement;
    cleanupOldHistory?: Database.Statement;
    
    // NEW: Per-Mode Settings Statements (Migration 034)
    getModeSettings?: Database.Statement;
    upsertModeSettings?: Database.Statement;
    getAllModeSettings?: Database.Statement;
    
    // NEW: Focus Mode Preferences Statements (Migration 035)
    getFocusPreferences?: Database.Statement;
    upsertFocusPreferences?: Database.Statement;
    getAllFocusPreferences?: Database.Statement;
  } = {};

  constructor(db: Database.Database) {
    this.db = db;
    this.prepareStatements();
  }

  /**
   * Prepare all SQL statements for optimal performance
   */
  private prepareStatements(): void {
    // Navigation preferences operations
    this.statements.getUserPreferences = this.db.prepare(`
      SELECT * FROM user_navigation_preferences WHERE user_id = ?
    `);
    
    this.statements.upsertUserPreferences = this.db.prepare(`
      INSERT OR REPLACE INTO user_navigation_preferences 
      (user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM user_navigation_preferences WHERE user_id = ?), CURRENT_TIMESTAMP), 
        CURRENT_TIMESTAMP)
    `);
    
    this.statements.updateNavigationMode = this.db.prepare(`
      UPDATE user_navigation_preferences 
      SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `);
    
    this.statements.updateLayoutDimensions = this.db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = ?, sidebar_width = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `);
    
    // Navigation mode history operations
    this.statements.insertModeHistory = this.db.prepare(`
      INSERT INTO navigation_mode_history (user_id, previous_mode, new_mode, session_id, changed_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    this.statements.getModeHistory = this.db.prepare(`
      SELECT * FROM navigation_mode_history 
      WHERE user_id = ? 
      ORDER BY changed_at DESC 
      LIMIT ?
    `);
    
    this.statements.cleanupOldHistory = this.db.prepare(`
      DELETE FROM navigation_mode_history 
      WHERE user_id = ? AND changed_at < datetime('now', '-30 days')
    `);
    
    // NEW: Per-Mode Settings Prepared Statements (Migration 034)
    this.statements.getModeSettings = this.db.prepare(`
      SELECT * FROM user_navigation_mode_settings 
      WHERE user_id = ? AND navigation_mode = ?
    `);
    
    this.statements.upsertModeSettings = this.db.prepare(`
      INSERT OR REPLACE INTO user_navigation_mode_settings 
      (user_id, navigation_mode, header_height, sidebar_width, auto_collapse_mobile, auto_collapse_tablet, 
       remember_dimensions, mobile_breakpoint, tablet_breakpoint, grid_template_columns, grid_template_rows, 
       grid_template_areas, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM user_navigation_mode_settings WHERE user_id = ? AND navigation_mode = ?), CURRENT_TIMESTAMP), 
        CURRENT_TIMESTAMP)
    `);
    
    this.statements.getAllModeSettings = this.db.prepare(`
      SELECT * FROM user_navigation_mode_settings WHERE user_id = ?
    `);
    
    // NEW: Focus Mode Preferences Prepared Statements (Migration 035)
    this.statements.getFocusPreferences = this.db.prepare(`
      SELECT * FROM user_focus_mode_preferences 
      WHERE user_id = ? AND navigation_mode = ?
    `);
    
    this.statements.upsertFocusPreferences = this.db.prepare(`
      INSERT OR REPLACE INTO user_focus_mode_preferences 
      (user_id, navigation_mode, auto_focus_enabled, auto_focus_delay_seconds, focus_on_mode_switch, 
       hide_sidebar_in_focus, hide_header_stats_in_focus, dim_background_opacity, transition_duration_ms, 
       transition_easing, block_notifications, block_popups, block_context_menu, minimal_ui_mode, 
       track_focus_sessions, show_focus_timer, focus_break_reminders, focus_break_interval_minutes, 
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM user_focus_mode_preferences WHERE user_id = ? AND navigation_mode = ?), CURRENT_TIMESTAMP), 
        CURRENT_TIMESTAMP)
    `);
    
    this.statements.getAllFocusPreferences = this.db.prepare(`
      SELECT * FROM user_focus_mode_preferences WHERE user_id = ?
    `);
  }

  // === NAVIGATION PREFERENCES OPERATIONS ===

  /**
   * Get user's navigation preferences with fallback to defaults
   */
  async getUserNavigationPreferences(userId: string = 'default'): Promise<NavigationPreferences> {
    try {
      const row = this.statements.getUserPreferences!.get(userId) as any;
      
      if (row) {
        return mapFromSQL(row) as NavigationPreferences;
      }
      
      // Return default preferences if not found
      // NOW USES: SYSTEM_DEFAULTS.DEFAULT_PREFERENCES (centralized constants)
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const defaultPreferences: NavigationPreferences = {
        userId,
        navigationMode: defaults.DEFAULT_PREFERENCES.navigationMode,
        headerHeight: defaults.DEFAULT_PREFERENCES.headerHeight,
        sidebarWidth: defaults.DEFAULT_PREFERENCES.sidebarWidth,
        autoCollapse: defaults.DEFAULT_PREFERENCES.autoCollapse,
        rememberFocusMode: defaults.DEFAULT_PREFERENCES.rememberFocusMode
      };
      
      // Create default preferences in database
      await this.setUserNavigationPreferences(userId, defaultPreferences);
      return defaultPreferences;
      
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting user preferences:', error);
      
      // Return hardcoded defaults on error
      // NOW USES: SYSTEM_DEFAULTS.DEFAULT_PREFERENCES (centralized constants)
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      return {
        userId,
        navigationMode: defaults.DEFAULT_PREFERENCES.navigationMode,
        headerHeight: defaults.DEFAULT_PREFERENCES.headerHeight,
        sidebarWidth: defaults.DEFAULT_PREFERENCES.sidebarWidth,
        autoCollapse: defaults.DEFAULT_PREFERENCES.autoCollapse,
        rememberFocusMode: defaults.DEFAULT_PREFERENCES.rememberFocusMode
      };
    }
  }

  /**
   * Set user's complete navigation preferences
   */
  async setUserNavigationPreferences(userId: string = 'default', preferences: Partial<NavigationPreferences>): Promise<boolean> {
    try {
      // Get current preferences for merging
      const currentPrefs = await this.getUserNavigationPreferences(userId);
      
      // Merge with updates
      const updatedPrefs: NavigationPreferences = {
        ...currentPrefs,
        ...preferences,
        userId
      };
      
      // Validate navigation mode
      if (!DatabaseNavigationService.NAVIGATION_MODES.includes(updatedPrefs.navigationMode as any)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', updatedPrefs.navigationMode);
        return false;
      }
      
      // Validate dimensions using SYSTEM_DEFAULTS
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const minHeight = defaults.MIN_HEADER_HEIGHTS[updatedPrefs.navigationMode] || 60;
      const maxHeight = defaults.MAX_DIMENSIONS.headerHeight;
      const maxWidth = defaults.MAX_DIMENSIONS.sidebarWidth;
      
      if (updatedPrefs.headerHeight < minHeight || updatedPrefs.headerHeight > maxHeight) {
        console.error('[DatabaseNavigationService] Invalid header height:', updatedPrefs.headerHeight, `(range: ${minHeight}-${maxHeight})`);
        return false;
      }
      
      if (updatedPrefs.sidebarWidth < 180 || updatedPrefs.sidebarWidth > maxWidth) {
        console.error('[DatabaseNavigationService] Invalid sidebar width:', updatedPrefs.sidebarWidth, `(range: 180-${maxWidth})`);
        return false;
      }
      
      // Convert to SQL format with field mapper
      const sqlData = mapToSQL(updatedPrefs);
      
      this.statements.upsertUserPreferences!.run(
        userId,
        sqlData.navigation_mode,
        sqlData.header_height,
        sqlData.sidebar_width,
        sqlData.auto_collapse ? 1 : 0,
        sqlData.remember_focus_mode ? 1 : 0,
        userId // for COALESCE in created_at
      );
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error setting user preferences:', error);
      return false;
    }
  }

  /**
   * Set navigation mode only (fast operation)
   */
  async setNavigationMode(userId: string = 'default', navigationMode: NavigationMode, sessionId?: string): Promise<boolean> {
    try {
      // Validate navigation mode
      if (!DatabaseNavigationService.NAVIGATION_MODES.includes(navigationMode as any)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', navigationMode);
        return false;
      }
      
      // Get current mode for history tracking
      const currentPrefs = await this.getUserNavigationPreferences(userId);
      const previousMode = currentPrefs.navigationMode;
      
      // Update navigation mode
      this.statements.updateNavigationMode!.run(navigationMode, userId);
      
      // Auto-adjust header height based on navigation mode requirements
      const optimalHeight = this.getOptimalHeaderHeight(navigationMode, currentPrefs.headerHeight);
      if (optimalHeight !== currentPrefs.headerHeight) {
        await this.updateLayoutDimensions(userId, optimalHeight, undefined);
      }
      
      // Record mode change in history (if different)
      if (previousMode !== navigationMode) {
        await this.recordModeChange(userId, previousMode, navigationMode, sessionId);
      }
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error setting navigation mode:', error);
      return false;
    }
  }

  /**
   * Update layout dimensions (header height and sidebar width)
   */
  async updateLayoutDimensions(userId: string = 'default', headerHeight?: number, sidebarWidth?: number): Promise<boolean> {
    try {
      const currentPrefs = await this.getUserNavigationPreferences(userId);
      
      const newHeaderHeight = headerHeight !== undefined ? headerHeight : currentPrefs.headerHeight;
      const newSidebarWidth = sidebarWidth !== undefined ? sidebarWidth : currentPrefs.sidebarWidth;
      
      // Apply optimal height for current navigation mode
      const optimalHeaderHeight = this.getOptimalHeaderHeight(currentPrefs.navigationMode, newHeaderHeight);
      
      // Validate dimensions using SYSTEM_DEFAULTS
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const minHeight = defaults.MIN_HEADER_HEIGHTS[currentPrefs.navigationMode] || 60;
      const maxHeight = defaults.MAX_DIMENSIONS.headerHeight;
      const maxWidth = defaults.MAX_DIMENSIONS.sidebarWidth;
      
      if (optimalHeaderHeight < minHeight || optimalHeaderHeight > maxHeight) {
        console.error('[DatabaseNavigationService] Invalid header height:', optimalHeaderHeight, `(range: ${minHeight}-${maxHeight})`);
        return false;
      }
      
      if (newSidebarWidth < 180 || newSidebarWidth > maxWidth) {
        console.error('[DatabaseNavigationService] Invalid sidebar width:', newSidebarWidth, `(range: 180-${maxWidth})`);
        return false;
      }
      
      this.statements.updateLayoutDimensions!.run(optimalHeaderHeight, newSidebarWidth, userId);
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error updating layout dimensions:', error);
      return false;
    }
  }

  // === NAVIGATION LAYOUT CONFIGURATION ===

  /**
   * Get complete navigation layout configuration for CSS Grid
   */
  async getNavigationLayoutConfig(userId: string = 'default'): Promise<NavigationLayoutConfig> {
    try {
      const preferences = await this.getUserNavigationPreferences(userId);
      
      // Generate CSS Grid configuration based on navigation mode and per-mode settings
      const gridConfig = await this.generateGridConfiguration(preferences, userId);
      
      return {
        navigationMode: preferences.navigationMode,
        headerHeight: preferences.headerHeight,
        sidebarWidth: preferences.sidebarWidth,
        autoCollapse: preferences.autoCollapse,
        rememberFocusMode: preferences.rememberFocusMode,
        ...gridConfig
      };
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting layout config:', error);
      
      // Return default configuration
      return this.getDefaultLayoutConfig();
    }
  }

  /**
   * Get optimal header height for navigation mode
   * NOW USES: SYSTEM_DEFAULTS.HEADER_HEIGHTS (centralized constants)
   */
  private getOptimalHeaderHeight(navigationMode: string, currentHeight: number): number {
    // Use centralized SYSTEM_DEFAULTS instead of hardcoded values
    return DatabaseNavigationService.SYSTEM_DEFAULTS.HEADER_HEIGHTS[navigationMode as NavigationMode] || 
           DatabaseNavigationService.SYSTEM_DEFAULTS.HEADER_HEIGHTS['header-statistics'];
  }

  /**
   * Generate CSS Grid configuration based on navigation preferences
   * CRITICAL FIX: Use per-mode settings instead of global preferences.headerHeight
   * This ensures that mode-specific header heights from user_navigation_mode_settings are used
   */
  private async generateGridConfiguration(preferences: NavigationPreferences, userId: string = 'default'): Promise<Pick<NavigationLayoutConfig, 'gridTemplateColumns' | 'gridTemplateRows' | 'gridTemplateAreas'>> {
    const { navigationMode, sidebarWidth } = preferences;
    
    // FIXED: Get mode-specific settings instead of using global preferences.headerHeight
    const modeSettings = await this.getModeSpecificSettings(userId, navigationMode);
    const headerHeight = modeSettings?.headerHeight || preferences.headerHeight;  // Per-mode or fallback to global
    
    console.log(`[DatabaseNavigationService] generateGridConfiguration for ${navigationMode}:`);
    console.log(`  Per-mode settings found: ${!!modeSettings}`);
    console.log(`  Mode-specific headerHeight: ${modeSettings?.headerHeight}px`);
    console.log(`  Global headerHeight: ${preferences.headerHeight}px`);
    console.log(`  Using headerHeight: ${headerHeight}px`);
    
    const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
    
    return {
      gridTemplateColumns: `${sidebarWidth}px 1fr`,
      gridTemplateRows: `${headerHeight}px 40px 1fr`,  // Now uses per-mode height!
      gridTemplateAreas: defaults.GRID_TEMPLATE_AREAS[navigationMode] || defaults.GRID_TEMPLATE_AREAS['header-statistics']
    };
  }

  /**
   * Get default layout configuration
   * NOW USES: SYSTEM_DEFAULTS (centralized constants)
   */
  private getDefaultLayoutConfig(navigationMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar'): NavigationLayoutConfig {
    const mode = navigationMode || 'header-statistics';
    const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
    
    return {
      navigationMode: mode,
      headerHeight: defaults.HEADER_HEIGHTS[mode],
      sidebarWidth: defaults.SIDEBAR_WIDTHS[mode],
      autoCollapse: defaults.DEFAULT_PREFERENCES.autoCollapse,
      rememberFocusMode: defaults.DEFAULT_PREFERENCES.rememberFocusMode,
      gridTemplateColumns: defaults.GRID_TEMPLATE_COLUMNS[mode],
      gridTemplateRows: defaults.GRID_TEMPLATE_ROWS[mode],
      gridTemplateAreas: defaults.GRID_TEMPLATE_AREAS[mode]
    };
  }

  // === NAVIGATION MODE HISTORY ===

  /**
   * Record navigation mode change in history
   */
  async recordModeChange(
    userId: string, 
    previousMode: 'header-statistics' | 'header-navigation' | 'full-sidebar' | undefined, 
    newMode: 'header-statistics' | 'header-navigation' | 'full-sidebar',
    sessionId?: string
  ): Promise<boolean> {
    try {
      this.statements.insertModeHistory!.run(
        userId,
        previousMode || null,
        newMode,
        sessionId || `session-${Date.now()}`
      );
      
      // Cleanup old history (keep only last 30 days)
      await this.cleanupOldHistory(userId);
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error recording mode change:', error);
      return false;
    }
  }

  /**
   * Get navigation mode history for user
   */
  async getNavigationModeHistory(userId: string = 'default', limit: number = 10): Promise<NavigationModeHistory[]> {
    try {
      const rows = this.statements.getModeHistory!.all(userId, limit) as any[];
      return rows.map(row => mapFromSQL(row) as NavigationModeHistory);
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting mode history:', error);
      return [];
    }
  }

  /**
   * Cleanup old navigation history
   */
  async cleanupOldHistory(userId: string): Promise<boolean> {
    try {
      this.statements.cleanupOldHistory!.run(userId);
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error cleaning up history:', error);
      return false;
    }
  }

  // === UTILITY METHODS ===

  /**
   * Get navigation mode statistics
   */
  async getNavigationModeStatistics(userId: string = 'default'): Promise<Record<string, number>> {
    try {
      const result = this.db.prepare(`
        SELECT new_mode, COUNT(*) as count 
        FROM navigation_mode_history 
        WHERE user_id = ? 
        GROUP BY new_mode
      `).all(userId) as Array<{ new_mode: string; count: number }>;
      
      return result.reduce((acc, { new_mode, count }) => {
        acc[new_mode] = count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting navigation statistics:', error);
      return {};
    }
  }

  /**
   * Reset navigation preferences to defaults
   * NOW USES: SYSTEM_DEFAULTS.DEFAULT_PREFERENCES (centralized constants)
   */
  async resetNavigationPreferences(userId: string = 'default'): Promise<boolean> {
    try {
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const defaultPreferences: NavigationPreferences = {
        userId,
        navigationMode: defaults.DEFAULT_PREFERENCES.navigationMode,
        headerHeight: defaults.DEFAULT_PREFERENCES.headerHeight,
        sidebarWidth: defaults.DEFAULT_PREFERENCES.sidebarWidth,
        autoCollapse: defaults.DEFAULT_PREFERENCES.autoCollapse,
        rememberFocusMode: defaults.DEFAULT_PREFERENCES.rememberFocusMode
      };
      
      return await this.setUserNavigationPreferences(userId, defaultPreferences);
    } catch (error) {
      console.error('[DatabaseNavigationService] Error resetting navigation preferences:', error);
      return false;
    }
  }

  /**
   * Check if Migration 028 is properly applied
   */
  async validateNavigationSchema(): Promise<boolean> {
    try {
      // Check if user_navigation_preferences table exists
      const tableInfo = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='user_navigation_preferences'
      `).get();
      
      if (!tableInfo) {
        console.error('[DatabaseNavigationService] Migration 028 not applied - user_navigation_preferences table missing');
        return false;
      }
      
      // Check if navigation_mode_history table exists
      const historyTableInfo = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='navigation_mode_history'
      `).get();
      
      if (!historyTableInfo) {
        console.warn('[DatabaseNavigationService] navigation_mode_history table missing - history features disabled');
        return true; // Not critical, main functionality works
      }
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error validating navigation schema:', error);
      return false;
    }
  }

  // === NEW: PER-MODE SETTINGS OPERATIONS (Migration 034) ===

  /**
   * Get mode-specific navigation settings
   */
  async getModeSpecificSettings(userId: string = 'default', navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar'): Promise<NavigationModeSettings | null> {
    try {
      const row = this.statements.getModeSettings!.get(userId, navigationMode) as any;
      
      if (row) {
        return mapFromSQL(row) as NavigationModeSettings;
      }
      
      return null;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting mode settings:', error);
      return null;
    }
  }

  /**
   * Set mode-specific navigation settings
   */
  async setModeSpecificSettings(userId: string = 'default', settings: Partial<NavigationModeSettings>): Promise<boolean> {
    try {
      // Get current settings for merging
      const currentSettings = await this.getModeSpecificSettings(userId, settings.navigationMode!);
      
      // Merge with updates using SYSTEM_DEFAULTS for defaults
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const updatedSettings: NavigationModeSettings = {
        userId,
        navigationMode: settings.navigationMode!,
        headerHeight: defaults.HEADER_HEIGHTS[settings.navigationMode!],
        sidebarWidth: defaults.SIDEBAR_WIDTHS[settings.navigationMode!],
        autoCollapseMobile: false,
        autoCollapseTablet: false,
        rememberDimensions: true,
        mobileBreakpoint: defaults.BREAKPOINTS.mobile,
        tabletBreakpoint: defaults.BREAKPOINTS.tablet,
        ...currentSettings,
        ...settings
      };

      // Validate settings using SYSTEM_DEFAULTS
      if (!DatabaseNavigationService.NAVIGATION_MODES.includes(updatedSettings.navigationMode as any)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', updatedSettings.navigationMode);
        return false;
      }

      // Convert to SQL format
      const sqlData = mapToSQL(updatedSettings);
      
      this.statements.upsertModeSettings!.run(
        userId,
        sqlData.navigation_mode,
        sqlData.header_height,
        sqlData.sidebar_width,
        sqlData.auto_collapse_mobile ? 1 : 0,
        sqlData.auto_collapse_tablet ? 1 : 0,
        sqlData.remember_dimensions ? 1 : 0,
        sqlData.mobile_breakpoint,
        sqlData.tablet_breakpoint,
        sqlData.grid_template_columns || null,
        sqlData.grid_template_rows || null,
        sqlData.grid_template_areas || null,
        userId, // for COALESCE
        sqlData.navigation_mode // for COALESCE
      );
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error setting mode settings:', error);
      return false;
    }
  }

  /**
   * Get all mode-specific settings for user
   */
  async getAllModeSettings(userId: string = 'default'): Promise<NavigationModeSettings[]> {
    try {
      const rows = this.statements.getAllModeSettings!.all(userId) as any[];
      return rows.map(row => mapFromSQL(row) as NavigationModeSettings);
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting all mode settings:', error);
      return [];
    }
  }

  // === NEW: FOCUS MODE PREFERENCES OPERATIONS (Migration 035) ===

  /**
   * Get focus preferences for specific navigation mode
   */
  async getFocusModePreferences(userId: string = 'default', navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar'): Promise<FocusModePreferences | null> {
    try {
      const row = this.statements.getFocusPreferences!.get(userId, navigationMode) as any;
      
      if (row) {
        return mapFromSQL(row) as FocusModePreferences;
      }
      
      return null;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting focus preferences:', error);
      return null;
    }
  }

  /**
   * Set focus preferences for specific navigation mode
   */
  async setFocusModePreferences(userId: string = 'default', preferences: Partial<FocusModePreferences>): Promise<boolean> {
    try {
      // Get current preferences for merging
      const currentPrefs = await this.getFocusModePreferences(userId, preferences.navigationMode!);
      
      // Merge with updates and apply defaults using SYSTEM_DEFAULTS
      const defaults = DatabaseNavigationService.SYSTEM_DEFAULTS;
      const updatedPrefs: FocusModePreferences = {
        userId,
        navigationMode: preferences.navigationMode!,
        autoFocusEnabled: false,
        autoFocusDelaySeconds: 300,
        focusOnModeSwitch: false,
        hideSidebarInFocus: true,
        hideHeaderStatsInFocus: false,
        dimBackgroundOpacity: 0.3,
        transitionDurationMs: 300,
        transitionEasing: 'ease-in-out',
        blockNotifications: true,
        blockPopups: true,
        blockContextMenu: false,
        minimalUiMode: false,
        trackFocusSessions: true,
        showFocusTimer: true,
        focusBreakReminders: false,
        focusBreakIntervalMinutes: 25,
        ...currentPrefs,
        ...preferences
      };

      // Validate preferences using SYSTEM_DEFAULTS
      if (!DatabaseNavigationService.NAVIGATION_MODES.includes(updatedPrefs.navigationMode as any)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', updatedPrefs.navigationMode);
        return false;
      }

      // Convert to SQL format
      const sqlData = mapToSQL(updatedPrefs);
      
      this.statements.upsertFocusPreferences!.run(
        userId,
        sqlData.navigation_mode,
        sqlData.auto_focus_enabled ? 1 : 0,
        sqlData.auto_focus_delay_seconds,
        sqlData.focus_on_mode_switch ? 1 : 0,
        sqlData.hide_sidebar_in_focus ? 1 : 0,
        sqlData.hide_header_stats_in_focus ? 1 : 0,
        sqlData.dim_background_opacity,
        sqlData.transition_duration_ms,
        sqlData.transition_easing,
        sqlData.block_notifications ? 1 : 0,
        sqlData.block_popups ? 1 : 0,
        sqlData.block_context_menu ? 1 : 0,
        sqlData.minimal_ui_mode ? 1 : 0,
        sqlData.track_focus_sessions ? 1 : 0,
        sqlData.show_focus_timer ? 1 : 0,
        sqlData.focus_break_reminders ? 1 : 0,
        sqlData.focus_break_interval_minutes,
        userId, // for COALESCE
        sqlData.navigation_mode // for COALESCE
      );
      
      return true;
    } catch (error) {
      console.error('[DatabaseNavigationService] Error setting focus preferences:', error);
      return false;
    }
  }

  /**
   * Get all focus preferences for user across all navigation modes
   */
  async getAllFocusPreferences(userId: string = 'default'): Promise<FocusModePreferences[]> {
    try {
      const rows = this.statements.getAllFocusPreferences!.all(userId) as any[];
      return rows.map(row => mapFromSQL(row) as FocusModePreferences);
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting all focus preferences:', error);
      return [];
    }
  }

  /**
   * Get combined layout configuration with per-mode and focus settings
   */
  async getEnhancedLayoutConfig(userId: string = 'default', navigationMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar', inFocusMode: boolean = false): Promise<NavigationLayoutConfig & { modeSettings?: NavigationModeSettings; focusPreferences?: FocusModePreferences }> {
    try {
      // Get base navigation preferences
      const basePrefs = await this.getUserNavigationPreferences(userId);
      const activeMode = navigationMode || basePrefs.navigationMode;
      
      // Get mode-specific settings
      const modeSettings = await this.getModeSpecificSettings(userId, activeMode);
      
      // Get focus preferences for this mode
      const focusPreferences = await this.getFocusModePreferences(userId, activeMode);
      
      // Generate base layout config
      const baseConfig = await this.getNavigationLayoutConfig(userId);
      
      // Apply mode-specific overrides if available
      if (modeSettings) {
        baseConfig.headerHeight = modeSettings.headerHeight;
        baseConfig.sidebarWidth = modeSettings.sidebarWidth;
        
        // Apply custom grid templates if defined
        if (modeSettings.gridTemplateColumns) {
          baseConfig.gridTemplateColumns = modeSettings.gridTemplateColumns;
        }
        if (modeSettings.gridTemplateRows) {
          baseConfig.gridTemplateRows = modeSettings.gridTemplateRows;
        }
        if (modeSettings.gridTemplateAreas) {
          baseConfig.gridTemplateAreas = modeSettings.gridTemplateAreas;
        }
      }
      
      return {
        ...baseConfig,
        modeSettings: modeSettings || undefined,
        focusPreferences: focusPreferences || undefined
      };
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting enhanced layout config:', error);
      return this.getDefaultLayoutConfig();
    }
  }

  /**
   * Cleanup: Close prepared statements
   */
  dispose(): void {
    // Note: better-sqlite3 statements are automatically cleaned up when database closes
    // This method is here for future extensibility and pattern consistency
  }
}