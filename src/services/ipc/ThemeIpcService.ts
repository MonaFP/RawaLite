/**
 * ThemeIpcService - Frontend service for theme operations via IPC
 * 
 * Provides browser-safe interface to database theme operations.
 * Communicates with main process DatabaseThemeService via IPC channels.
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see docs/07-ipc/VALIDATED_GUIDE-IPC-PATTERNS_2025-10-15.md
 */

import type { ThemeWithColors } from '../DatabaseThemeService';

export class ThemeIpcService {
  private static instance: ThemeIpcService;

  public static getInstance(): ThemeIpcService {
    if (!ThemeIpcService.instance) {
      ThemeIpcService.instance = new ThemeIpcService();
    }
    return ThemeIpcService.instance;
  }

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get all available themes from database
   */
  public async getAllThemes(): Promise<ThemeWithColors[]> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available, using empty array');
        return [];
      }

      const themes = await window.rawalite.themes.getAllThemes();
      return themes || [];
    } catch (error) {
      console.error('[ThemeIpcService] Failed to get all themes:', error);
      return [];
    }
  }

  /**
   * Get theme by unique key
   */
  public async getThemeByKey(themeKey: string): Promise<ThemeWithColors | null> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return null;
      }

      const theme = await window.rawalite.themes.getThemeByKey(themeKey);
      return theme || null;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to get theme by key:', error);
      return null;
    }
  }

  /**
   * Get theme by database ID
   */
  public async getThemeById(id: number): Promise<ThemeWithColors | null> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return null;
      }

      const theme = await window.rawalite.themes.getThemeById(id);
      return theme || null;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to get theme by ID:', error);
      return null;
    }
  }

  /**
   * Get user's active theme
   */
  public async getUserActiveTheme(userId: string = 'default'): Promise<ThemeWithColors | null> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return null;
      }

      const theme = await window.rawalite.themes.getUserActiveTheme(userId);
      return theme || null;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to get user active theme:', error);
      return null;
    }
  }

  /**
   * Set user's active theme
   */
  public async setUserTheme(userId: string, themeId: number, themeKey: string): Promise<boolean> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return false;
      }

      const success = await window.rawalite.themes.setUserTheme(userId, themeId, themeKey);
      return success || false;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to set user theme:', error);
      return false;
    }
  }

  /**
   * Create new custom theme
   */
  public async createTheme(
    themeData: {
      themeKey: string;
      name: string;
      description: string;
      icon: string;
      isSystemTheme: boolean;
      isActive: boolean;
    },
    colors: Record<string, string>
  ): Promise<ThemeWithColors | null> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return null;
      }

      const theme = await window.rawalite.themes.createTheme(themeData, colors);
      return theme || null;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to create theme:', error);
      return null;
    }
  }

  /**
   * Update existing theme
   */
  public async updateTheme(
    id: number, 
    updates: Partial<{
      themeKey: string;
      name: string;
      description: string;
      icon: string;
      isSystemTheme: boolean;
      isActive: boolean;
    }>
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return false;
      }

      const success = await window.rawalite.themes.updateTheme(id, updates);
      return success || false;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to update theme:', error);
      return false;
    }
  }

  /**
   * Update theme colors
   */
  public async updateThemeColors(themeId: number, colors: Record<string, string>): Promise<boolean> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return false;
      }

      const success = await window.rawalite.themes.updateThemeColors(themeId, colors);
      return success || false;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to update theme colors:', error);
      return false;
    }
  }

  /**
   * Delete custom theme
   */
  public async deleteTheme(id: number): Promise<boolean> {
    try {
      if (!window.rawalite?.themes) {
        console.warn('[ThemeIpcService] IPC themes not available');
        return false;
      }

      const success = await window.rawalite.themes.deleteTheme(id);
      return success || false;
    } catch (error) {
      console.error('[ThemeIpcService] Failed to delete theme:', error);
      return false;
    }
  }
}