/**
 * DatabaseThemeService - CRUD operations for database-first theme management
 * 
 * Manages themes, theme colors, and user preferences with:
 * - Field-Mapper integration for camelCase ↔ snake_case conversion
 * - TypeScript interfaces for type safety
 * - Error handling and validation
 * - Performance optimizations with prepared statements
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-SERVICE-LAYER_2025-10-17.md} Theme Service Layer Implementation
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-DATABASE-THEME-SYSTEM_2025-10-17.md} Complete Database-Theme-System Documentation
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} FIX-018: DatabaseThemeService Pattern Preservation
 * @see {@link docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md} Theme Development Rules
 */

import type Database from 'better-sqlite3';
import { FieldMapper, mapToSQL, mapFromSQL, mapFromSQLArray } from '../lib/field-mapper';

// TypeScript interfaces for theme system
export interface Theme {
  id?: number;
  themeKey: string;
  name: string;
  description?: string;
  icon?: string;
  isSystemTheme?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeColor {
  id?: number;
  themeId: number;
  colorKey: string;
  colorValue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserThemePreference {
  id?: number;
  userId: string;
  activeThemeId?: number;
  fallbackThemeKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeWithColors extends Theme {
  colors: Record<string, string>;
}

// NEW: Theme Override Interface (Migration 036)
export interface ThemeOverride {
  id?: number;
  userId: string;
  scopeType: 'navigation-mode' | 'focus-mode' | 'combined';
  navigationMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  isFocusMode: boolean;
  baseThemeId?: string;
  cssVariables: Record<string, string>;
  colorOverrides?: Record<string, string>;
  typographyOverrides?: Record<string, string>;
  spacingOverrides?: Record<string, string>;
  animationOverrides?: Record<string, string>;
  priority: number;
  applyToDescendants: boolean;
  overrideSystemTheme: boolean;
  minScreenWidth?: number;
  maxScreenWidth?: number;
  timeBasedActivation?: Record<string, string>;
  name?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Complete Theme Configuration Interface
export interface CompleteThemeConfig {
  // Base theme data
  theme: ThemeWithColors;
  themeKey: string;
  colors: Record<string, string>;
  
  // Navigation adjustments
  navigationAdjustments: {
    headerAdjustment: number;
    sidebarAdjustment: number;
    gridTemplateAdjustment: string;
    compactModeBias: number;
    focusModeHeaderReduction: number;
    focusModeSidebarReduction: number;
  };
  
  // Extended color palette
  extendedColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headerBg: string;
    sidebarBg: string;
    borderColor: string;
    activeColor: string;
  };
  
  // User overrides
  userOverrides: ThemeOverride[];
  
  // Computed navigation values
  computedNavigation: {
    headerAdjustment: number;
    sidebarAdjustment: number;
    focusModeHeaderReduction: number;
    focusModeSidebarReduction: number;
    compactModeBias: number;
  };
  
  // CSS variables for frontend
  cssVariables: Record<string, string>;
  
  // PDF-ready colors
  pdfColors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

export interface HeaderThemeConfig {
  // Header Base Theme
  headerBgColor: string;
  headerTextColor: string;
  headerBorderColor: string;
  
  // Company Branding Theme
  companyNameColor: string;
  companyNameWeight: string;
  
  // Navigation Items Theme
  navItemBgColor: string;
  navItemTextColor: string;
  navItemBorderColor: string;
  navItemActiveBgColor: string;
  navItemActiveTextColor: string;
  
  // Statistics Cards Theme
  statCardBgColor: string;
  statCardBorderColor: string;
  statCardTextColor: string;
  statCardValueColor: string;
  statCardSuccessColor: string;
  statCardWarningColor: string;
  statCardDangerColor: string;
  
  // Custom Page Titles
  customTitles?: {
    dashboard?: string;
    customers?: string;
    offers?: string;
    packages?: string;
    invoices?: string;
    timesheets?: string;
    settings?: string;
  };
}

export class DatabaseThemeService {
  private db: Database.Database;
  
  /**
   * THEME NAVIGATION DEFAULTS - Theme-based Navigation Adjustments
   * 
   * These constants define how different themes adjust navigation layouts.
   * Each theme can have slight modifications to header heights, sidebar widths,
   * and grid templates to optimize visual harmony.
   * 
   * CRITICAL: Keep synchronized with DatabaseConfigurationService.getThemeNavigationDefaults()
   * 
   * Used by:
   * - DatabaseConfigurationService.getActiveConfig() for theme-aware layout
   * - getCompleteThemeConfiguration() for comprehensive theme data
   * - PDF generation for theme-consistent document layouts
   * 
   * @since Migration 037 - Centralized Configuration Architecture
   */
  static readonly THEME_NAVIGATION_DEFAULTS = {
    // Sage Theme - Natural, balanced spacing
    'sage': {
      headerAdjustment: 0,
      sidebarAdjustment: 0,
      gridTemplateAdjustment: 'none',
      compactModeBias: 0,
      focusModeHeaderReduction: 20,
      focusModeSidebarReduction: 40
    },
    
    // Dark Theme - Slightly more compact for professional feel
    'dark': {
      headerAdjustment: -5,
      sidebarAdjustment: 10,
      gridTemplateAdjustment: 'compact',
      compactModeBias: -10,
      focusModeHeaderReduction: 25,
      focusModeSidebarReduction: 50
    },
    
    // Sky Theme - Airy, slightly expanded for open feel
    'sky': {
      headerAdjustment: 5,
      sidebarAdjustment: -5,
      gridTemplateAdjustment: 'expanded',
      compactModeBias: 5,
      focusModeHeaderReduction: 15,
      focusModeSidebarReduction: 30
    },
    
    // Lavender Theme - Soft, balanced with slight expansion
    'lavender': {
      headerAdjustment: 0,
      sidebarAdjustment: 5,
      gridTemplateAdjustment: 'soft',
      compactModeBias: 0,
      focusModeHeaderReduction: 18,
      focusModeSidebarReduction: 35
    },
    
    // Peach Theme - Warm, comfortable spacing
    'peach': {
      headerAdjustment: 0,
      sidebarAdjustment: 0,
      gridTemplateAdjustment: 'none',
      compactModeBias: 0,
      focusModeHeaderReduction: 20,
      focusModeSidebarReduction: 40
    },
    
    // Rose Theme - Elegant, refined spacing
    'rose': {
      headerAdjustment: 0,
      sidebarAdjustment: 0,
      gridTemplateAdjustment: 'refined',
      compactModeBias: 0,
      focusModeHeaderReduction: 22,
      focusModeSidebarReduction: 45
    },
    
    // Default Theme - Standard system defaults
    'default': {
      headerAdjustment: 0,
      sidebarAdjustment: 0,
      gridTemplateAdjustment: 'none',
      compactModeBias: 0,
      focusModeHeaderReduction: 20,
      focusModeSidebarReduction: 40
    }
  } as const;
  
  /**
   * THEME COLOR MAPPINGS - Complete Theme Color Definitions
   * 
   * These define the complete color palette for each theme, including
   * navigation-specific colors that work harmoniously with layouts.
   * 
   * Used by:
   * - getCompleteThemeConfiguration() for full theme data
   * - DatabaseConfigurationService for theme-aware configuration
   * - PDF generation for consistent theme application
   */
  static readonly THEME_COLOR_MAPPINGS = {
    'sage': {
      primary: '#7ba87b',
      secondary: '#5a735a',
      accent: '#6b976b',
      background: '#fbfcfb',
      text: '#2d4a2d',
      // Navigation-specific colors
      headerBg: '#f8faf8',
      sidebarBg: '#f0f4f0',
      borderColor: '#d2ddcf',
      activeColor: '#9bc29b'
    },
    'dark': {
      primary: '#1e3a2e',
      secondary: '#2a4a35',
      accent: '#f472b6',
      background: '#f1f5f9',
      text: '#1e293b',
      // Navigation-specific colors
      headerBg: '#f8fafc',
      sidebarBg: '#f1f5f9',
      borderColor: '#e2e8f0',
      activeColor: '#f472b6'
    },
    'sky': {
      primary: '#7ba2b8',
      secondary: '#5a6573',
      accent: '#6b8ea7',
      background: '#fbfcfd',
      text: '#2d3a4a',
      // Navigation-specific colors
      headerBg: '#f8fafb',
      sidebarBg: '#f0f4f7',
      borderColor: '#d1dde6',
      activeColor: '#9bb8c8'
    },
    'lavender': {
      primary: '#b87ba8',
      secondary: '#735a73',
      accent: '#a76b97',
      background: '#fdfbfc',
      text: '#4a2d4a',
      // Navigation-specific colors
      headerBg: '#faf8fa',
      sidebarBg: '#f4f0f4',
      borderColor: '#ddd1dd',
      activeColor: '#c89bb8'
    },
    'peach': {
      primary: '#c89da8',
      secondary: '#73655a',
      accent: '#b78b97',
      background: '#fdfbfc',
      text: '#4a3a2d',
      // Navigation-specific colors
      headerBg: '#faf9f8',
      sidebarBg: '#f4f2f0',
      borderColor: '#ddd7d1',
      activeColor: '#d8b8c8'
    },
    'rose': {
      primary: '#c89da8',
      secondary: '#735a67',
      accent: '#b78b97',
      background: '#fdfbfc',
      text: '#4a2d3a',
      // Navigation-specific colors
      headerBg: '#faf8f9',
      sidebarBg: '#f4f0f2',
      borderColor: '#ddd1d7',
      activeColor: '#d8b8c8'
    },
    'default': {
      primary: '#1e3a2e',
      secondary: '#2a4a35',
      accent: '#8b9dc3',
      background: '#f1f5f9',
      text: '#1e293b',
      // Navigation-specific colors
      headerBg: '#f8fafc',
      sidebarBg: '#f1f5f9',
      borderColor: '#e2e8f0',
      activeColor: '#8b9dc3'
    }
  } as const;
  
  // Prepared statements for performance
  private statements: {
    getThemeById?: Database.Statement;
    getThemeByKey?: Database.Statement;
    getThemeColors?: Database.Statement;
    getAllThemes?: Database.Statement;
    getUserPreference?: Database.Statement;
    insertTheme?: Database.Statement;
    updateTheme?: Database.Statement;
    deleteTheme?: Database.Statement;
    insertThemeColor?: Database.Statement;
    updateThemeColor?: Database.Statement;
    deleteThemeColors?: Database.Statement;
    upsertUserPreference?: Database.Statement;
    
    // NEW: Theme Override Statements (Migration 036)
    getThemeOverride?: Database.Statement;
    getScopedOverrides?: Database.Statement;
    getAllUserOverrides?: Database.Statement;
    upsertThemeOverride?: Database.Statement;
    deleteThemeOverride?: Database.Statement;
    getApplicableOverrides?: Database.Statement;
  } = {};

  constructor(db: Database.Database) {
    this.db = db;
    this.prepareStatements();
  }

  /**
   * Prepare all SQL statements for optimal performance
   */
  private prepareStatements(): void {
    // Theme operations
    this.statements.getThemeById = this.db.prepare(`
      SELECT * FROM themes WHERE id = ?
    `);
    
    this.statements.getThemeByKey = this.db.prepare(`
      SELECT * FROM themes WHERE theme_key = ?
    `);
    
    this.statements.getAllThemes = this.db.prepare(`
      SELECT * FROM themes WHERE is_active = 1 ORDER BY is_system_theme DESC, name ASC
    `);
    
    this.statements.insertTheme = this.db.prepare(`
      INSERT INTO themes (theme_key, name, description, icon, is_system_theme, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    this.statements.updateTheme = this.db.prepare(`
      UPDATE themes 
      SET name = ?, description = ?, icon = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    this.statements.deleteTheme = this.db.prepare(`
      UPDATE themes SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    // Theme color operations
    this.statements.getThemeColors = this.db.prepare(`
      SELECT * FROM theme_colors WHERE theme_id = ? ORDER BY color_key ASC
    `);
    
    this.statements.insertThemeColor = this.db.prepare(`
      INSERT OR REPLACE INTO theme_colors (theme_id, color_key, color_value, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    this.statements.deleteThemeColors = this.db.prepare(`
      DELETE FROM theme_colors WHERE theme_id = ?
    `);
    
    // User preference operations
    this.statements.getUserPreference = this.db.prepare(`
      SELECT * FROM user_theme_preferences WHERE user_id = ?
    `);
    
    this.statements.upsertUserPreference = this.db.prepare(`
      INSERT OR REPLACE INTO user_theme_preferences (user_id, active_theme_id, fallback_theme_key, created_at, updated_at)
      VALUES (?, ?, ?, COALESCE((SELECT created_at FROM user_theme_preferences WHERE user_id = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    `);
    
    // NEW: Theme Override Prepared Statements (Migration 036)
    this.statements.getThemeOverride = this.db.prepare(`
      SELECT * FROM theme_overrides WHERE user_id = ? AND id = ?
    `);
    
    this.statements.getScopedOverrides = this.db.prepare(`
      SELECT * FROM theme_overrides 
      WHERE user_id = ? AND scope_type = ? AND navigation_mode = ? AND is_focus_mode = ? AND is_active = 1
      ORDER BY priority DESC
    `);
    
    this.statements.getAllUserOverrides = this.db.prepare(`
      SELECT * FROM theme_overrides WHERE user_id = ? AND is_active = 1 ORDER BY priority DESC
    `);
    
    this.statements.upsertThemeOverride = this.db.prepare(`
      INSERT OR REPLACE INTO theme_overrides 
      (user_id, scope_type, navigation_mode, is_focus_mode, base_theme_id, css_variables, color_overrides, 
       typography_overrides, spacing_overrides, animation_overrides, priority, apply_to_descendants, 
       override_system_theme, min_screen_width, max_screen_width, time_based_activation, name, description, 
       is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM theme_overrides WHERE user_id = ? AND scope_type = ? AND navigation_mode = ? AND is_focus_mode = ?), CURRENT_TIMESTAMP), 
        CURRENT_TIMESTAMP)
    `);
    
    this.statements.deleteThemeOverride = this.db.prepare(`
      UPDATE theme_overrides SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?
    `);
    
    this.statements.getApplicableOverrides = this.db.prepare(`
      SELECT * FROM theme_overrides 
      WHERE user_id = ? AND is_active = 1 
      AND (
        (scope_type = 'navigation-mode' AND navigation_mode = ? AND is_focus_mode = 0) OR
        (scope_type = 'focus-mode' AND is_focus_mode = 1) OR
        (scope_type = 'combined' AND navigation_mode = ? AND is_focus_mode = ?)
      )
      AND (min_screen_width IS NULL OR min_screen_width <= ?)
      AND (max_screen_width IS NULL OR max_screen_width >= ?)
      ORDER BY priority DESC
    `);
  }

  // === THEME OPERATIONS ===

  /**
   * Get theme by ID with colors
   */
  async getThemeById(id: number): Promise<ThemeWithColors | null> {
    try {
      const themeRow = this.statements.getThemeById!.get(id) as any;
      if (!themeRow) return null;

      const theme = mapFromSQL(themeRow) as Theme;
      const colorRows = this.statements.getThemeColors!.all(id) as any[];
      const colors = colorRows.reduce((acc, row) => {
        const colorData = mapFromSQL(row) as ThemeColor;
        acc[colorData.colorKey] = colorData.colorValue;
        return acc;
      }, {} as Record<string, string>);

      return { ...theme, colors };
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting theme by ID:', error);
      return null;
    }
  }

  /**
   * Get theme by key with colors
   */
  async getThemeByKey(themeKey: string): Promise<ThemeWithColors | null> {
    try {
      const themeRow = this.statements.getThemeByKey!.get(themeKey) as any;
      if (!themeRow) return null;

      const theme = mapFromSQL(themeRow) as Theme;
      const colorRows = this.statements.getThemeColors!.all(theme.id!) as any[];
      const colors = colorRows.reduce((acc, row) => {
        const colorData = mapFromSQL(row) as ThemeColor;
        acc[colorData.colorKey] = colorData.colorValue;
        return acc;
      }, {} as Record<string, string>);

      return { ...theme, colors };
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting theme by key:', error);
      return null;
    }
  }

  /**
   * Get all active themes (system themes first, then custom themes)
   */
  async getAllThemes(): Promise<ThemeWithColors[]> {
    try {
      const themeRows = this.statements.getAllThemes!.all() as any[];
      const themes: ThemeWithColors[] = [];

      for (const themeRow of themeRows) {
        const theme = mapFromSQL(themeRow) as Theme;
        const colorRows = this.statements.getThemeColors!.all(theme.id!) as any[];
        const colors = colorRows.reduce((acc, row) => {
          const colorData = mapFromSQL(row) as ThemeColor;
          acc[colorData.colorKey] = colorData.colorValue;
          return acc;
        }, {} as Record<string, string>);

        themes.push({ ...theme, colors });
      }

      return themes;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting all themes:', error);
      return [];
    }
  }

  /**
   * Create new custom theme with colors
   */
  async createTheme(theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>, colors: Record<string, string>): Promise<ThemeWithColors | null> {
    const transaction = this.db.transaction(() => {
      try {
        // Insert theme
        const themeData = mapToSQL(theme);
        const result = this.statements.insertTheme!.run(
          themeData.theme_key,
          themeData.name,
          themeData.description || null,
          themeData.icon || null,
          themeData.is_system_theme || 0,
          themeData.is_active !== undefined ? themeData.is_active : 1
        );

        const themeId = result.lastInsertRowid as number;

        // Insert colors
        for (const [colorKey, colorValue] of Object.entries(colors)) {
          this.statements.insertThemeColor!.run(themeId, colorKey, colorValue);
        }

        return themeId;
      } catch (error) {
        console.error('[DatabaseThemeService] Error creating theme:', error);
        throw error;
      }
    });

    try {
      const themeId = transaction();
      return await this.getThemeById(themeId);
    } catch (error) {
      console.error('[DatabaseThemeService] Transaction failed:', error);
      return null;
    }
  }

  /**
   * Update existing theme (name, description, icon only - colors updated separately)
   */
  async updateTheme(id: number, updates: Partial<Pick<Theme, 'name' | 'description' | 'icon' | 'isActive'>>): Promise<boolean> {
    try {
      const currentTheme = await this.getThemeById(id);
      if (!currentTheme) return false;

      const updateData = mapToSQL(updates);
      
      this.statements.updateTheme!.run(
        updateData.name || currentTheme.name,
        updateData.description !== undefined ? updateData.description : currentTheme.description,
        updateData.icon !== undefined ? updateData.icon : currentTheme.icon,
        updateData.is_active !== undefined ? updateData.is_active : currentTheme.isActive,
        id
      );

      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Error updating theme:', error);
      return false;
    }
  }

  /**
   * Update theme colors (replaces all colors for the theme)
   */
  async updateThemeColors(themeId: number, colors: Record<string, string>): Promise<boolean> {
    const transaction = this.db.transaction(() => {
      try {
        // Delete existing colors
        this.statements.deleteThemeColors!.run(themeId);

        // Insert new colors
        for (const [colorKey, colorValue] of Object.entries(colors)) {
          this.statements.insertThemeColor!.run(themeId, colorKey, colorValue);
        }

        return true;
      } catch (error) {
        console.error('[DatabaseThemeService] Error updating theme colors:', error);
        throw error;
      }
    });

    try {
      return transaction();
    } catch (error) {
      console.error('[DatabaseThemeService] Color update transaction failed:', error);
      return false;
    }
  }

  /**
   * Soft delete theme (mark as inactive)
   */
  async deleteTheme(id: number): Promise<boolean> {
    try {
      const theme = await this.getThemeById(id);
      if (!theme) return false;

      // Prevent deletion of system themes
      if (theme.isSystemTheme) {
        console.warn('[DatabaseThemeService] Cannot delete system theme:', theme.themeKey);
        return false;
      }

      this.statements.deleteTheme!.run(id);
      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Error deleting theme:', error);
      return false;
    }
  }

  // === USER PREFERENCE OPERATIONS ===

  /**
   * Get user's theme preference
   */
  async getUserThemePreference(userId: string = 'default'): Promise<UserThemePreference | null> {
    try {
      const row = this.statements.getUserPreference!.get(userId) as any;
      return row ? mapFromSQL(row) as UserThemePreference : null;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting user preference:', error);
      return null;
    }
  }

  /**
   * Set user's active theme
   */
  async setUserTheme(userId: string = 'default', themeId: number, fallbackKey?: string): Promise<boolean> {
    try {
      // Verify theme exists
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        console.error('[DatabaseThemeService] Theme not found:', themeId);
        return false;
      }

      this.statements.upsertUserPreference!.run(
        userId,
        themeId,
        fallbackKey || theme.themeKey,
        userId // for COALESCE in created_at
      );

      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Error setting user theme:', error);
      return false;
    }
  }

  /**
   * Get user's active theme with full details
   */
  async getUserActiveTheme(userId: string = 'default'): Promise<ThemeWithColors | null> {
    try {
      const preference = await this.getUserThemePreference(userId);
      if (!preference?.activeThemeId) {
        // Fall back to default theme
        return await this.getThemeByKey('default');
      }

      const theme = await this.getThemeById(preference.activeThemeId);
      if (!theme) {
        // Fall back to preference's fallback theme
        return await this.getThemeByKey(preference.fallbackThemeKey || 'default');
      }

      return theme;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting user active theme:', error);
      // Ultimate fallback to default
      return await this.getThemeByKey('default');
    }
  }

  /**
   * NEW: Get Complete Theme Configuration
   * 
   * This method provides comprehensive theme configuration including:
   * - Base theme data and colors
   * - Navigation-specific adjustments for the theme
   * - User theme overrides (if any)
   * - Theme-optimized layout recommendations
   * 
   * Used by DatabaseConfigurationService.getActiveConfig() to provide
   * theme-aware configuration data.
   * 
   * @param userId - User identifier
   * @param themeKey - Theme key ('sage', 'dark', etc.)
   * @returns Complete theme configuration with navigation data
   */
  async getCompleteThemeConfiguration(userId: string, themeKey: string): Promise<CompleteThemeConfig | null> {
    try {
      // Step 1: Get base theme data
      const theme = await this.getThemeByKey(themeKey);
      if (!theme) {
        console.error('[DatabaseThemeService] Theme not found:', themeKey);
        return null;
      }

      // Step 2: Get navigation defaults for this theme
      const navigationDefaults = (DatabaseThemeService.THEME_NAVIGATION_DEFAULTS as any)[themeKey] || 
                                  DatabaseThemeService.THEME_NAVIGATION_DEFAULTS['default'];

      // Step 3: Get color mappings for this theme
      const colorMappings = (DatabaseThemeService.THEME_COLOR_MAPPINGS as any)[themeKey] || 
                           DatabaseThemeService.THEME_COLOR_MAPPINGS['default'];

      // Step 4: Get user theme overrides (Migration 036)
      const userOverrides = await this.getAllUserThemeOverrides(userId);
      const applicableOverrides = userOverrides.filter(override => 
        override.baseThemeId === themeKey && override.isActive
      );

      // Step 5: Merge all configuration data
      const completeConfig: CompleteThemeConfig = {
        // Base theme information
        theme: theme,
        themeKey: themeKey,
        colors: theme.colors,
        
        // Navigation adjustments
        navigationAdjustments: navigationDefaults,
        
        // Extended color palette
        extendedColors: colorMappings,
        
        // User overrides
        userOverrides: applicableOverrides,
        
        // Computed navigation values
        computedNavigation: {
          headerAdjustment: navigationDefaults.headerAdjustment,
          sidebarAdjustment: navigationDefaults.sidebarAdjustment,
          focusModeHeaderReduction: navigationDefaults.focusModeHeaderReduction,
          focusModeSidebarReduction: navigationDefaults.focusModeSidebarReduction,
          compactModeBias: navigationDefaults.compactModeBias
        },
        
        // CSS variable generation
        cssVariables: this.generateThemeCSSVariables(colorMappings, navigationDefaults),
        
        // PDF-ready colors
        pdfColors: {
          primary: colorMappings.primary,
          secondary: colorMappings.secondary,
          accent: colorMappings.accent,
          text: colorMappings.text,
          background: colorMappings.background
        }
      };

      return completeConfig;

    } catch (error) {
      console.error('[DatabaseThemeService] Error getting complete theme configuration:', error);
      return null;
    }
  }

  /**
   * Generate CSS variables for theme integration
   * Private helper method for getCompleteThemeConfiguration
   */
  private generateThemeCSSVariables(
    colorMappings: any, 
    navigationDefaults: any
  ): Record<string, string> {
    return {
      // Core theme colors
      '--theme-primary': colorMappings.primary,
      '--theme-secondary': colorMappings.secondary,
      '--theme-accent': colorMappings.accent,
      '--theme-background': colorMappings.background,
      '--theme-text': colorMappings.text,
      
      // Navigation-specific colors
      '--theme-header-bg': colorMappings.headerBg,
      '--theme-sidebar-bg': colorMappings.sidebarBg,
      '--theme-border-color': colorMappings.borderColor,
      '--theme-active-color': colorMappings.activeColor,
      
      // Layout adjustments as CSS custom properties
      '--theme-header-adjustment': `${navigationDefaults.headerAdjustment}px`,
      '--theme-sidebar-adjustment': `${navigationDefaults.sidebarAdjustment}px`,
      '--theme-compact-bias': `${navigationDefaults.compactModeBias}px`,
      
      // Focus mode adjustments
      '--theme-focus-header-reduction': `${navigationDefaults.focusModeHeaderReduction}px`,
      '--theme-focus-sidebar-reduction': `${navigationDefaults.focusModeSidebarReduction}px`
    };
  }

  /**
   * Get all theme overrides for a user
   * Used by getCompleteThemeConfiguration
   */
  async getAllUserThemeOverrides(userId: string): Promise<ThemeOverride[]> {
    try {
      if (!this.statements.getAllUserOverrides) {
        console.warn('[DatabaseThemeService] getAllUserOverrides statement not prepared');
        return [];
      }

      const rows = this.statements.getAllUserOverrides.all(userId) as any[];
      // Simple mapping for now - will be enhanced when Migration 036 is fully implemented
      return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        scopeType: row.scope_type,
        navigationMode: row.navigation_mode,
        isFocusMode: row.is_focus_mode,
        baseThemeId: row.base_theme_id,
        cssVariables: JSON.parse(row.css_variables || '{}'),
        colorOverrides: JSON.parse(row.color_overrides || '{}'),
        typographyOverrides: JSON.parse(row.typography_overrides || '{}'),
        spacingOverrides: JSON.parse(row.spacing_overrides || '{}'),
        animationOverrides: JSON.parse(row.animation_overrides || '{}'),
        priority: row.priority,
        applyToDescendants: row.apply_to_descendants,
        overrideSystemTheme: row.override_system_theme,
        minScreenWidth: row.min_screen_width,
        maxScreenWidth: row.max_screen_width,
        timeBasedActivation: JSON.parse(row.time_based_activation || '{}'),
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) as ThemeOverride[];
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting user theme overrides:', error);
      return [];
    }
  }

  // === UTILITY METHODS ===

  /**
   * Check if theme key is available for new themes
   */
  async isThemeKeyAvailable(themeKey: string): Promise<boolean> {
    try {
      const existingTheme = await this.getThemeByKey(themeKey);
      return !existingTheme;
    } catch (error) {
      console.error('[DatabaseThemeService] Error checking theme key availability:', error);
      return false;
    }
  }

  /**
   * Get count of custom themes
   */
  async getCustomThemeCount(): Promise<number> {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count FROM themes WHERE is_system_theme = 0 AND is_active = 1
      `).get() as { count: number };
      
      return result.count;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting custom theme count:', error);
      return 0;
    }
  }

  // === NEW: THEME OVERRIDE OPERATIONS (Migration 036) ===

  /**
   * Get theme override by ID
   */
  async getThemeOverride(userId: string, overrideId: number): Promise<ThemeOverride | null> {
    try {
      const row = this.statements.getThemeOverride!.get(userId, overrideId) as any;
      
      if (row) {
        const override = mapFromSQL(row) as any;
        // Parse JSON fields
        override.cssVariables = JSON.parse(override.cssVariables || '{}');
        override.colorOverrides = override.colorOverrides ? JSON.parse(override.colorOverrides) : null;
        override.typographyOverrides = override.typographyOverrides ? JSON.parse(override.typographyOverrides) : null;
        override.spacingOverrides = override.spacingOverrides ? JSON.parse(override.spacingOverrides) : null;
        override.animationOverrides = override.animationOverrides ? JSON.parse(override.animationOverrides) : null;
        override.timeBasedActivation = override.timeBasedActivation ? JSON.parse(override.timeBasedActivation) : null;
        
        return override as ThemeOverride;
      }
      
      return null;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting theme override:', error);
      return null;
    }
  }

  /**
   * Get scoped theme overrides (for specific navigation mode and focus state)
   */
  async getScopedThemeOverrides(
    userId: string = 'default', 
    scopeType: 'navigation-mode' | 'focus-mode' | 'combined',
    navigationMode?: 'header-statistics' | 'header-navigation' | 'full-sidebar',
    isFocusMode: boolean = false
  ): Promise<ThemeOverride[]> {
    try {
      const rows = this.statements.getScopedOverrides!.all(
        userId, scopeType, navigationMode || null, isFocusMode ? 1 : 0
      ) as any[];
      
      return rows.map(row => {
        const override = mapFromSQL(row) as any;
        // Parse JSON fields
        override.cssVariables = JSON.parse(override.cssVariables || '{}');
        override.colorOverrides = override.colorOverrides ? JSON.parse(override.colorOverrides) : null;
        override.typographyOverrides = override.typographyOverrides ? JSON.parse(override.typographyOverrides) : null;
        override.spacingOverrides = override.spacingOverrides ? JSON.parse(override.spacingOverrides) : null;
        override.animationOverrides = override.animationOverrides ? JSON.parse(override.animationOverrides) : null;
        override.timeBasedActivation = override.timeBasedActivation ? JSON.parse(override.timeBasedActivation) : null;
        
        return override as ThemeOverride;
      });
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting scoped overrides:', error);
      return [];
    }
  }

  /**
   * Get all theme overrides for user
   */
  async getAllThemeOverrides(userId: string = 'default'): Promise<ThemeOverride[]> {
    try {
      const rows = this.statements.getAllUserOverrides!.all(userId) as any[];
      
      return rows.map(row => {
        const override = mapFromSQL(row) as any;
        // Parse JSON fields
        override.cssVariables = JSON.parse(override.cssVariables || '{}');
        override.colorOverrides = override.colorOverrides ? JSON.parse(override.colorOverrides) : null;
        override.typographyOverrides = override.typographyOverrides ? JSON.parse(override.typographyOverrides) : null;
        override.spacingOverrides = override.spacingOverrides ? JSON.parse(override.spacingOverrides) : null;
        override.animationOverrides = override.animationOverrides ? JSON.parse(override.animationOverrides) : null;
        override.timeBasedActivation = override.timeBasedActivation ? JSON.parse(override.timeBasedActivation) : null;
        
        return override as ThemeOverride;
      });
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting all overrides:', error);
      return [];
    }
  }

  /**
   * Set theme override (create or update)
   */
  async setThemeOverride(userId: string = 'default', override: Partial<ThemeOverride>): Promise<boolean> {
    try {
      // Merge with defaults
      const fullOverride: ThemeOverride = {
        userId,
        scopeType: 'navigation-mode',
        isFocusMode: false,
        cssVariables: {},
        priority: 100,
        applyToDescendants: true,
        overrideSystemTheme: false,
        isActive: true,
        ...override
      };

      // Validate scope type
      if (!['navigation-mode', 'focus-mode', 'combined'].includes(fullOverride.scopeType)) {
        console.error('[DatabaseThemeService] Invalid scope type:', fullOverride.scopeType);
        return false;
      }

      // Convert to SQL format and stringify JSON fields
      const sqlData = mapToSQL(fullOverride);
      
      this.statements.upsertThemeOverride!.run(
        userId,
        sqlData.scope_type,
        sqlData.navigation_mode || null,
        sqlData.is_focus_mode ? 1 : 0,
        sqlData.base_theme_id || null,
        JSON.stringify(fullOverride.cssVariables),
        fullOverride.colorOverrides ? JSON.stringify(fullOverride.colorOverrides) : null,
        fullOverride.typographyOverrides ? JSON.stringify(fullOverride.typographyOverrides) : null,
        fullOverride.spacingOverrides ? JSON.stringify(fullOverride.spacingOverrides) : null,
        fullOverride.animationOverrides ? JSON.stringify(fullOverride.animationOverrides) : null,
        sqlData.priority,
        sqlData.apply_to_descendants ? 1 : 0,
        sqlData.override_system_theme ? 1 : 0,
        sqlData.min_screen_width || null,
        sqlData.max_screen_width || null,
        fullOverride.timeBasedActivation ? JSON.stringify(fullOverride.timeBasedActivation) : null,
        sqlData.name || null,
        sqlData.description || null,
        sqlData.is_active ? 1 : 0,
        // COALESCE parameters
        userId,
        sqlData.scope_type,
        sqlData.navigation_mode || null,
        sqlData.is_focus_mode ? 1 : 0
      );
      
      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Error setting theme override:', error);
      return false;
    }
  }

  /**
   * Delete theme override (soft delete)
   */
  async deleteThemeOverride(userId: string, overrideId: number): Promise<boolean> {
    try {
      this.statements.deleteThemeOverride!.run(userId, overrideId);
      return true;
    } catch (error) {
      console.error('[DatabaseThemeService] Error deleting theme override:', error);
      return false;
    }
  }

  /**
   * Get applicable theme overrides for current context
   */
  async getApplicableThemeOverrides(
    userId: string = 'default',
    navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar' = 'header-navigation',
    isFocusMode: boolean = false,
    screenWidth: number = 1920
  ): Promise<ThemeOverride[]> {
    try {
      const rows = this.statements.getApplicableOverrides!.all(
        userId, navigationMode, navigationMode, isFocusMode ? 1 : 0, screenWidth, screenWidth
      ) as any[];
      
      return rows.map(row => {
        const override = mapFromSQL(row) as any;
        // Parse JSON fields
        override.cssVariables = JSON.parse(override.cssVariables || '{}');
        override.colorOverrides = override.colorOverrides ? JSON.parse(override.colorOverrides) : null;
        override.typographyOverrides = override.typographyOverrides ? JSON.parse(override.typographyOverrides) : null;
        override.spacingOverrides = override.spacingOverrides ? JSON.parse(override.spacingOverrides) : null;
        override.animationOverrides = override.animationOverrides ? JSON.parse(override.animationOverrides) : null;
        override.timeBasedActivation = override.timeBasedActivation ? JSON.parse(override.timeBasedActivation) : null;
        
        return override as ThemeOverride;
      });
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting applicable overrides:', error);
      return [];
    }
  }

  /**
   * Merge theme with applicable overrides to create final theme
   */
  async getThemeWithOverrides(
    userId: string = 'default',
    baseTheme: ThemeWithColors,
    navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar' = 'header-navigation',
    isFocusMode: boolean = false,
    screenWidth: number = 1920
  ): Promise<ThemeWithColors & { appliedOverrides: ThemeOverride[] }> {
    try {
      const overrides = await this.getApplicableThemeOverrides(userId, navigationMode, isFocusMode, screenWidth);
      
      // Start with base theme
      let mergedColors = { ...baseTheme.colors };
      let mergedCssVariables: Record<string, string> = {};
      
      // Apply overrides in priority order (highest first)
      for (const override of overrides) {
        // Merge CSS variables
        mergedCssVariables = { ...mergedCssVariables, ...override.cssVariables };
        
        // Merge color overrides
        if (override.colorOverrides) {
          mergedColors = { ...mergedColors, ...override.colorOverrides };
        }
      }
      
      return {
        ...baseTheme,
        colors: mergedColors,
        cssVariables: mergedCssVariables,
        appliedOverrides: overrides
      } as any;
    } catch (error) {
      console.error('[DatabaseThemeService] Error merging theme with overrides:', error);
      return { ...baseTheme, appliedOverrides: [] } as any;
    }
  }

  /**
   * Cleanup: Close prepared statements
   */
  dispose(): void {
    // Note: better-sqlite3 statements are automatically cleaned up when database closes
    // This method is here for future extensibility
  }

  // === HEADER THEME OPERATIONS (FIX-016/017/018 Compliant) ===

  /**
   * Get Header-specific theme configuration
   * FIX-018: DatabaseThemeService Pattern Preservation
   * 
   * @param userId User ID for personalized header themes
   * @returns Header theme configuration with fallbacks
   */
  async getHeaderThemeConfig(userId: string = 'default'): Promise<HeaderThemeConfig | null> {
    try {
      const activeTheme = await this.getUserActiveTheme(userId);
      if (!activeTheme) return null;

      // Map theme colors to header configuration
      const headerConfig: HeaderThemeConfig = {
        // Header Base Theme
        headerBgColor: activeTheme.colors['header-bg'] || activeTheme.colors['sidebar-bg'] || 'var(--sidebar-bg)',
        headerTextColor: activeTheme.colors['header-text'] || activeTheme.colors['foreground'] || 'var(--foreground)',
        headerBorderColor: activeTheme.colors['header-border'] || activeTheme.colors['border'] || 'rgba(255,255,255,.08)',
        
        // Company Branding Theme
        companyNameColor: activeTheme.colors['company-name-color'] || activeTheme.colors['primary-text'] || 'white',
        companyNameWeight: activeTheme.colors['company-name-weight'] || '600',
        
        // Navigation Items Theme
        navItemBgColor: activeTheme.colors['nav-item-bg'] || 'transparent',
        navItemTextColor: activeTheme.colors['nav-item-text'] || 'rgba(255,255,255,0.8)',
        navItemBorderColor: activeTheme.colors['nav-item-border'] || 'transparent',
        navItemActiveBgColor: activeTheme.colors['nav-item-active-bg'] || activeTheme.colors['accent-bg'] || 'rgba(255,255,255,0.2)',
        navItemActiveTextColor: activeTheme.colors['nav-item-active-text'] || activeTheme.colors['accent-text'] || 'white',
        
        // Statistics Cards Theme
        statCardBgColor: activeTheme.colors['stat-card-bg'] || 'rgba(255,255,255,0.1)',
        statCardBorderColor: activeTheme.colors['stat-card-border'] || 'rgba(255,255,255,0.2)',
        statCardTextColor: activeTheme.colors['stat-card-text'] || 'white',
        statCardValueColor: activeTheme.colors['stat-card-value'] || 'white',
        statCardSuccessColor: activeTheme.colors['stat-success'] || activeTheme.colors['success'] || '#22c55e',
        statCardWarningColor: activeTheme.colors['stat-warning'] || activeTheme.colors['warning'] || '#f59e0b',
        statCardDangerColor: activeTheme.colors['stat-danger'] || activeTheme.colors['error'] || '#ef4444',
        
        // Custom Page Titles (optional)
        customTitles: this.parseCustomTitles(activeTheme.colors)
      };

      return headerConfig;
    } catch (error) {
      console.error('[DatabaseThemeService] Error getting header theme config:', error);
      return null;
    }
  }

  /**
   * Set Header-specific theme configuration
   * FIX-016/017: Schema Protection with Field-Mapper integration
   * 
   * @param userId User ID for personalized themes
   * @param headerConfig Header theme configuration
   * @returns Success status
   */
  async setHeaderThemeConfig(userId: string = 'default', headerConfig: Partial<HeaderThemeConfig>): Promise<boolean> {
    try {
      const activeTheme = await this.getUserActiveTheme(userId);
      if (!activeTheme) {
        console.error('[DatabaseThemeService] No active theme found for user:', userId);
        return false;
      }

      // Prevent modification of system themes
      if (activeTheme.isSystemTheme) {
        console.warn('[DatabaseThemeService] Cannot modify system theme. Creating custom theme variant.');
        return await this.createHeaderThemeVariant(userId, activeTheme, headerConfig);
      }

      // Convert header config to theme colors with Field-Mapper patterns
      const colorUpdates: Record<string, string> = { ...activeTheme.colors };

      // Header Base Theme Updates
      if (headerConfig.headerBgColor) colorUpdates['header-bg'] = headerConfig.headerBgColor;
      if (headerConfig.headerTextColor) colorUpdates['header-text'] = headerConfig.headerTextColor;
      if (headerConfig.headerBorderColor) colorUpdates['header-border'] = headerConfig.headerBorderColor;

      // Company Branding Updates
      if (headerConfig.companyNameColor) colorUpdates['company-name-color'] = headerConfig.companyNameColor;
      if (headerConfig.companyNameWeight) colorUpdates['company-name-weight'] = headerConfig.companyNameWeight;

      // Navigation Items Updates
      if (headerConfig.navItemBgColor) colorUpdates['nav-item-bg'] = headerConfig.navItemBgColor;
      if (headerConfig.navItemTextColor) colorUpdates['nav-item-text'] = headerConfig.navItemTextColor;
      if (headerConfig.navItemBorderColor) colorUpdates['nav-item-border'] = headerConfig.navItemBorderColor;
      if (headerConfig.navItemActiveBgColor) colorUpdates['nav-item-active-bg'] = headerConfig.navItemActiveBgColor;
      if (headerConfig.navItemActiveTextColor) colorUpdates['nav-item-active-text'] = headerConfig.navItemActiveTextColor;

      // Statistics Cards Updates
      if (headerConfig.statCardBgColor) colorUpdates['stat-card-bg'] = headerConfig.statCardBgColor;
      if (headerConfig.statCardBorderColor) colorUpdates['stat-card-border'] = headerConfig.statCardBorderColor;
      if (headerConfig.statCardTextColor) colorUpdates['stat-card-text'] = headerConfig.statCardTextColor;
      if (headerConfig.statCardValueColor) colorUpdates['stat-card-value'] = headerConfig.statCardValueColor;
      if (headerConfig.statCardSuccessColor) colorUpdates['stat-success'] = headerConfig.statCardSuccessColor;
      if (headerConfig.statCardWarningColor) colorUpdates['stat-warning'] = headerConfig.statCardWarningColor;
      if (headerConfig.statCardDangerColor) colorUpdates['stat-danger'] = headerConfig.statCardDangerColor;

      // Custom Page Titles Updates
      if (headerConfig.customTitles) {
        this.encodeCustomTitles(colorUpdates, headerConfig.customTitles);
      }

      // Update theme colors
      return await this.updateThemeColors(activeTheme.id!, colorUpdates);
    } catch (error) {
      console.error('[DatabaseThemeService] Error setting header theme config:', error);
      return false;
    }
  }

  /**
   * Create custom theme variant for header modifications
   * Used when user tries to modify system themes
   */
  private async createHeaderThemeVariant(
    userId: string, 
    baseTheme: ThemeWithColors, 
    headerConfig: Partial<HeaderThemeConfig>
  ): Promise<boolean> {
    try {
      const variantKey = `${baseTheme.themeKey}-header-custom-${Date.now()}`;
      const variantName = `${baseTheme.name} (Header Customized)`;
      
      // Create new theme with header modifications
      const newTheme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
        themeKey: variantKey,
        name: variantName,
        description: `Custom header variant of ${baseTheme.name}`,
        icon: baseTheme.icon,
        isSystemTheme: false,
        isActive: true
      };

      // Apply header config to base colors
      const customColors = { ...baseTheme.colors };
      if (headerConfig.headerBgColor) customColors['header-bg'] = headerConfig.headerBgColor;
      if (headerConfig.headerTextColor) customColors['header-text'] = headerConfig.headerTextColor;
      // ... apply all other header config properties

      const createdTheme = await this.createTheme(newTheme, customColors);
      if (!createdTheme) return false;

      // Set as user's active theme
      return await this.setUserTheme(userId, createdTheme.id!, variantKey);
    } catch (error) {
      console.error('[DatabaseThemeService] Error creating header theme variant:', error);
      return false;
    }
  }

  /**
   * Parse custom page titles from theme colors
   * Field-Mapper compatible: camelCase ↔ snake_case conversion
   */
  private parseCustomTitles(colors: Record<string, string>): HeaderThemeConfig['customTitles'] {
    const titles: HeaderThemeConfig['customTitles'] = {};
    
    if (colors['page-title-dashboard']) titles.dashboard = colors['page-title-dashboard'];
    if (colors['page-title-customers']) titles.customers = colors['page-title-customers'];
    if (colors['page-title-offers']) titles.offers = colors['page-title-offers'];
    if (colors['page-title-packages']) titles.packages = colors['page-title-packages'];
    if (colors['page-title-invoices']) titles.invoices = colors['page-title-invoices'];
    if (colors['page-title-timesheets']) titles.timesheets = colors['page-title-timesheets'];
    if (colors['page-title-settings']) titles.settings = colors['page-title-settings'];
    
    return Object.keys(titles).length > 0 ? titles : undefined;
  }

  /**
   * Encode custom page titles into theme colors
   * Field-Mapper compatible: camelCase ↔ snake_case conversion
   */
  private encodeCustomTitles(colors: Record<string, string>, customTitles: NonNullable<HeaderThemeConfig['customTitles']>): void {
    if (customTitles.dashboard) colors['page-title-dashboard'] = customTitles.dashboard;
    if (customTitles.customers) colors['page-title-customers'] = customTitles.customers;
    if (customTitles.offers) colors['page-title-offers'] = customTitles.offers;
    if (customTitles.packages) colors['page-title-packages'] = customTitles.packages;
    if (customTitles.invoices) colors['page-title-invoices'] = customTitles.invoices;
    if (customTitles.timesheets) colors['page-title-timesheets'] = customTitles.timesheets;
    if (customTitles.settings) colors['page-title-settings'] = customTitles.settings;
  }

  /**
   * Reset header theme to system defaults
   * Removes all header-specific customizations
   */
  async resetHeaderTheme(userId: string = 'default'): Promise<boolean> {
    try {
      const systemTheme = await this.getThemeByKey('default');
      if (!systemTheme) return false;

      return await this.setUserTheme(userId, systemTheme.id!, 'default');
    } catch (error) {
      console.error('[DatabaseThemeService] Error resetting header theme:', error);
      return false;
    }
  }
}