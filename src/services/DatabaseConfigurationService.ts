/**
 * DatabaseConfigurationService - Stub for KOPIE v1.0.48 Compatibility
 * 
 * Provides central configuration access for AKTUELL electron/ipc patterns
 * while maintaining KOPIE database schema compatibility.
 * 
 * @since v1.0.48+ (KOPIE stable base)
 * @compatibility AKTUELL electron/ipc layer
 */

import type Database from 'better-sqlite3';
import { DatabaseNavigationService } from './DatabaseNavigationService';
import { DatabaseThemeService } from './DatabaseThemeService';

export interface ActiveConfig {
  navigationMode: 'header-statistics' | 'header-navigation' | 'full-sidebar';
  headerHeight: number;
  sidebarWidth: number;
  currentTheme: string;
  autoCollapse: boolean;
  rememberFocusMode: boolean;
}

export class DatabaseConfigurationService {
  private static instance: DatabaseConfigurationService;
  private db: Database.Database;
  private navigationService: DatabaseNavigationService;
  private themeService: DatabaseThemeService;

  constructor(db: Database.Database) {
    this.db = db;
    this.navigationService = new DatabaseNavigationService(db);
    this.themeService = new DatabaseThemeService(db);
  }

  static getInstance(db: Database.Database): DatabaseConfigurationService {
    if (!DatabaseConfigurationService.instance) {
      DatabaseConfigurationService.instance = new DatabaseConfigurationService(db);
    }
    return DatabaseConfigurationService.instance;
  }

  /**
   * Get active configuration (central access point for all config)
   */
  async getActiveConfig(userId: string = 'default'): Promise<ActiveConfig> {
    try {
      const navPrefs = await this.navigationService.getUserNavigationPreferences(userId);
      const allThemes = await this.themeService.getAllThemes();
      const userThemePref = await this.themeService.getUserThemePreference(userId);
      
      let currentTheme = 'default';
      if (userThemePref?.activeThemeId && allThemes.length > 0) {
        const activeTheme = allThemes.find(t => t.id === userThemePref.activeThemeId);
        currentTheme = activeTheme?.name ?? 'default';
      }

      return {
        navigationMode: navPrefs?.navigationMode ?? 'header-navigation',
        headerHeight: navPrefs?.headerHeight ?? 160,
        sidebarWidth: navPrefs?.sidebarWidth ?? 240,
        currentTheme,
        autoCollapse: navPrefs?.autoCollapse ?? true,
        rememberFocusMode: navPrefs?.rememberFocusMode ?? false
      };
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error getting active config:', error);
      return {
        navigationMode: 'header-navigation',
        headerHeight: 160,
        sidebarWidth: 240,
        currentTheme: 'default',
        autoCollapse: true,
        rememberFocusMode: false
      };
    }
  }

  /**
   * Update navigation mode (with history tracking)
   */
  async updateNavigationMode(
    userId: string,
    mode: 'header-statistics' | 'header-navigation' | 'full-sidebar'
  ): Promise<void> {
    try {
      await this.navigationService.setNavigationMode(userId, mode);
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error updating navigation mode:', error);
    }
  }

  /**
   * Update header height
   */
  async updateHeaderHeight(userId: string, height: number): Promise<void> {
    try {
      const prefs = await this.navigationService.getUserNavigationPreferences(userId);
      if (prefs) {
        await this.navigationService.updateLayoutDimensions(userId, height, prefs.sidebarWidth);
      }
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error updating header height:', error);
    }
  }

  /**
   * Update theme
   */
  async updateTheme(userId: string, themeId: number): Promise<void> {
    try {
      await this.themeService.setUserTheme(userId, themeId);
    } catch (error) {
      console.error('[DatabaseConfigurationService] Error updating theme:', error);
    }
  }
}

export default DatabaseConfigurationService;
