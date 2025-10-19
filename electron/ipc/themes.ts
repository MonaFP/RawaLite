/**
 * IPC handlers for database theme management
 * 
 * Provides secure bridge between renderer and main process for theme operations.
 * Implements complete CRUD operations with proper error handling.
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-IPC-INTEGRATION_2025-10-17.md} IPC Integration Documentation
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-SERVICE-LAYER_2025-10-17.md} Service Layer Implementation
 * @see {@link docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md} Theme Development Rules
 */

import { ipcMain } from 'electron';
import { DatabaseThemeService } from '../../src/services/DatabaseThemeService';

let themeService: DatabaseThemeService | null = null;

/**
 * Initialize theme service with database connection
 */
export function initializeThemeIpc(db: any) {
  themeService = new DatabaseThemeService(db);
  registerThemeHandlers();
}

/**
 * Register all theme-related IPC handlers
 */
function registerThemeHandlers() {
  // Get all themes
  ipcMain.handle('themes:get-all', async () => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getAllThemes();
    } catch (error) {
      console.error('[IPC:themes:get-all] Error:', error);
      throw error;
    }
  });

  // Get theme by key
  ipcMain.handle('themes:get-by-key', async (_, themeKey: string) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getThemeByKey(themeKey);
    } catch (error) {
      console.error('[IPC:themes:get-by-key] Error:', error);
      throw error;
    }
  });

  // Get theme by ID
  ipcMain.handle('themes:get-by-id', async (_, id: number) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getThemeById(id);
    } catch (error) {
      console.error('[IPC:themes:get-by-id] Error:', error);
      throw error;
    }
  });

  // Get user's active theme
  ipcMain.handle('themes:get-user-active', async (_, userId: string = 'default') => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getUserActiveTheme(userId);
    } catch (error) {
      console.error('[IPC:themes:get-user-active] Error:', error);
      throw error;
    }
  });

  // Set user theme
  ipcMain.handle('themes:set-user-theme', async (_, userId: string, themeId: number, themeKey: string) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.setUserTheme(userId, themeId, themeKey);
    } catch (error) {
      console.error('[IPC:themes:set-user-theme] Error:', error);
      throw error;
    }
  });

  // Create new theme
  ipcMain.handle('themes:create', async (_, themeData: any, colors: Record<string, string>) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.createTheme(themeData, colors);
    } catch (error) {
      console.error('[IPC:themes:create] Error:', error);
      throw error;
    }
  });

  // Update theme
  ipcMain.handle('themes:update', async (_, id: number, updates: any) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.updateTheme(id, updates);
    } catch (error) {
      console.error('[IPC:themes:update] Error:', error);
      throw error;
    }
  });

  // Update theme colors
  ipcMain.handle('themes:update-colors', async (_, themeId: number, colors: Record<string, string>) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.updateThemeColors(themeId, colors);
    } catch (error) {
      console.error('[IPC:themes:update-colors] Error:', error);
      throw error;
    }
  });

  // Delete theme
  ipcMain.handle('themes:delete', async (_, id: number) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.deleteTheme(id);
    } catch (error) {
      console.error('[IPC:themes:delete] Error:', error);
      throw error;
    }
  });

  console.log('[ThemeIPC] Theme IPC handlers registered successfully');
}

/**
 * Cleanup theme IPC handlers
 */
export function cleanupThemeIpc() {
  const channels = [
    'themes:get-all',
    'themes:get-by-key', 
    'themes:get-by-id',
    'themes:get-user-active',
    'themes:set-user-theme',
    'themes:create',
    'themes:update',
    'themes:update-colors',
    'themes:delete'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  themeService = null;
  console.log('[ThemeIPC] Theme IPC handlers cleaned up');
}