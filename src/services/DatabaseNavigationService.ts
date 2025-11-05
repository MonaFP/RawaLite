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

// TypeScript interfaces for navigation system
export interface NavigationPreferences {
  id?: number;
  userId: string;
  navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  headerHeight: number;
  sidebarWidth: number;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavigationModeHistory {
  id?: number;
  userId: string;
  previousMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  newMode: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  changedAt?: string;
  sessionId?: string;
}

export interface NavigationLayoutConfig {
  // Mode Configuration
  navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  
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
  
  // Prepared statements for performance
  private statements: {
    getUserPreferences?: Database.Statement;
    upsertUserPreferences?: Database.Statement;
    updateNavigationMode?: Database.Statement;
    updateLayoutDimensions?: Database.Statement;
    insertModeHistory?: Database.Statement;
    getModeHistory?: Database.Statement;
    cleanupOldHistory?: Database.Statement;
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
      const defaultPreferences: NavigationPreferences = {
        userId,
        navigationMode: 'header-navigation',
        headerHeight: 90, // Modus-spezifische Höhe für header-navigation
        sidebarWidth: 280,
        autoCollapse: false,
        rememberFocusMode: true
      };
      
      // Create default preferences in database
      await this.setUserNavigationPreferences(userId, defaultPreferences);
      return defaultPreferences;
      
    } catch (error) {
      console.error('[DatabaseNavigationService] Error getting user preferences:', error);
      
      // Return hardcoded defaults on error
      return {
        userId,
        navigationMode: 'header-navigation',
        headerHeight: 90, // Modus-spezifische Höhe für header-navigation
        sidebarWidth: 280,
        autoCollapse: false,
        rememberFocusMode: true
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
      if (!['header-statistics', 'header-navigation', 'full-sidebar'].includes(updatedPrefs.navigationMode)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', updatedPrefs.navigationMode);
        return false;
      }
      
      // Validate dimensions
      if (updatedPrefs.headerHeight < 60 || updatedPrefs.headerHeight > 220) {
        console.error('[DatabaseNavigationService] Invalid header height:', updatedPrefs.headerHeight);
        return false;
      }
      
      if (updatedPrefs.sidebarWidth < 180 || updatedPrefs.sidebarWidth > 320) {
        console.error('[DatabaseNavigationService] Invalid sidebar width:', updatedPrefs.sidebarWidth);
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
  async setNavigationMode(userId: string = 'default', navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar', sessionId?: string): Promise<boolean> {
    try {
      // Validate navigation mode
      if (!['header-statistics', 'header-navigation', 'full-sidebar'].includes(navigationMode)) {
        console.error('[DatabaseNavigationService] Invalid navigation mode:', navigationMode);
        return false;
      }
      
      // Get current mode for history tracking
      const currentPrefs = await this.getUserNavigationPreferences(userId);
      const previousMode = currentPrefs.navigationMode;
      
      // Update navigation mode
      this.statements.updateNavigationMode!.run(navigationMode, userId);
      
      // Auto-adjust header height if switching to header-statistics and current height is too low
      const optimalHeight = this.getOptimalHeaderHeight(navigationMode, currentPrefs.headerHeight);
      if (optimalHeight > currentPrefs.headerHeight) {
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
      
      // Validate dimensions
      if (optimalHeaderHeight < 60 || optimalHeaderHeight > 220) {
        console.error('[DatabaseNavigationService] Invalid header height:', optimalHeaderHeight);
        return false;
      }
      
      if (newSidebarWidth < 180 || newSidebarWidth > 320) {
        console.error('[DatabaseNavigationService] Invalid sidebar width:', newSidebarWidth);
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
      
      // Generate CSS Grid configuration based on navigation mode
      const gridConfig = this.generateGridConfiguration(preferences);
      
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
   */
  private getOptimalHeaderHeight(navigationMode: string, currentHeight: number): number {
    const minHeights = {
      'header-statistics': 160,  // Statistics Cards brauchen mehr Platz
      'header-navigation': 90,   // Navigation kompakter möglich
      'full-sidebar': 60         // Minimal header
    };
    
    return Math.max(currentHeight, minHeights[navigationMode as keyof typeof minHeights] || 90);
  }

  /**
   * Generate CSS Grid configuration based on navigation preferences
   */
  private generateGridConfiguration(preferences: NavigationPreferences): Pick<NavigationLayoutConfig, 'gridTemplateColumns' | 'gridTemplateRows' | 'gridTemplateAreas'> {
    const { navigationMode, headerHeight, sidebarWidth } = preferences;
    const optimalHeight = this.getOptimalHeaderHeight(navigationMode, headerHeight);
    
    switch (navigationMode) {
      case 'header-statistics':
        return {
          gridTemplateColumns: `${sidebarWidth}px 1fr`,
          gridTemplateRows: `${optimalHeight}px 40px 1fr`,
          gridTemplateAreas: `
            "sidebar header"
            "sidebar focus-bar"
            "sidebar main"`
        };
        
      case 'header-navigation':
        return {
          gridTemplateColumns: `${sidebarWidth}px 1fr`,
          gridTemplateRows: `${optimalHeight}px 40px 1fr`,
          gridTemplateAreas: `
            "sidebar header"
            "sidebar focus-bar"
            "sidebar main"`
        };
        
      case 'full-sidebar':
        return {
          gridTemplateColumns: `${sidebarWidth}px 1fr`,
          gridTemplateRows: `${optimalHeight}px 40px 1fr`,
          gridTemplateAreas: `
            "sidebar header"
            "sidebar focus-bar"
            "sidebar main"`
        };
        
      default:
        return this.getDefaultLayoutConfig();
    }
  }

  /**
   * Get default layout configuration
   */
  private getDefaultLayoutConfig(navigationMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar'): NavigationLayoutConfig {
    const mode = navigationMode || 'header-navigation';
    
    // Modus-spezifische Konfigurationen
    const configs = {
      'header-statistics': {
        navigationMode: 'header-statistics' as const,
        headerHeight: 160,
        sidebarWidth: 240,
        autoCollapse: false,
        rememberFocusMode: true,
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '160px 40px 1fr',
        gridTemplateAreas: `
          "sidebar header"
          "sidebar focus-bar"
          "sidebar main"`
      },
      'header-navigation': {
        navigationMode: 'header-navigation' as const,
        headerHeight: 90,
        sidebarWidth: 280,
        autoCollapse: false,
        rememberFocusMode: true,
        gridTemplateColumns: '280px 1fr',
        gridTemplateRows: '90px 40px 1fr',
        gridTemplateAreas: `
          "sidebar header"
          "sidebar focus-bar"
          "sidebar main"`
      },
      'full-sidebar': {
        navigationMode: 'full-sidebar' as const,
        headerHeight: 60,
        sidebarWidth: 240,
        autoCollapse: false,
        rememberFocusMode: true,
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '60px 40px 1fr',
        gridTemplateAreas: `
          "sidebar header"
          "sidebar focus-bar"
          "sidebar main"`
      }
    };
    
    return configs[mode];
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
   */
  async resetNavigationPreferences(userId: string = 'default'): Promise<boolean> {
    try {
      const defaultPreferences: NavigationPreferences = {
        userId,
        navigationMode: 'header-navigation',
        headerHeight: 160, // Angleichung: einheitliche Header-Höhe
        sidebarWidth: 280,
        autoCollapse: false,
        rememberFocusMode: true
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

  /**
   * Cleanup: Close prepared statements
   */
  dispose(): void {
    // Note: better-sqlite3 statements are automatically cleaned up when database closes
    // This method is here for future extensibility and pattern consistency
  }
}