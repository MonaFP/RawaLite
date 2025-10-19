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

export class DatabaseThemeService {
  private db: Database.Database;
  
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

  /**
   * Cleanup: Close prepared statements
   */
  dispose(): void {
    // Note: better-sqlite3 statements are automatically cleaned up when database closes
    // This method is here for future extensibility
  }
}