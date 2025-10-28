/**
 * IPC handlers for database theme management
 * 
 * LEGACY ISOLATION STRATEGY:
 * - Uses navigation-safe.ts for KI-safe type system
 * - Accepts NavigationModeInput (legacy + KI-safe) at IPC entrance
 * - Normalizes to KI-safe modes immediately with normalizeToKiSafe()
 * - Theme operations use DatabaseThemeService with proper isolation
 * 
 * Provides secure bridge between renderer and main process for theme operations.
 * Implements complete CRUD operations with proper error handling.
 * 
 * @since v1.0.42.7 (Database-Theme-System)
 * @updated Legacy Isolation - KI-Safe Integration with navigation-safe.ts
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-IPC-INTEGRATION_2025-10-17.md} IPC Integration Documentation
 * @see {@link docs/04-ui/final/COMPLETED_IMPL-THEME-SERVICE-LAYER_2025-10-17.md} Service Layer Implementation
 * @see {@link docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md} Theme Development Rules
 */

import { ipcMain } from 'electron';
import { DatabaseThemeService } from '../../src/services/DatabaseThemeService';
import type { 
  KiSafeNavigationMode, 
  NavigationModeInput, 
  NAVIGATION_MODES_SAFE 
} from '../../src/types/navigation-safe';
import { 
  normalizeToKiSafe
} from '../../src/types/navigation-safe';
import { validateNavigationMode } from '../../src/services/NavigationModeNormalizationService';

// Valid navigation modes (KI-Safe Only - Legacy handled via NavigationModeInput)
const NAVIGATION_MODES_SAFE_ARRAY: KiSafeNavigationMode[] = [
  'mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'
];

/**
 * Validate navigation mode input (Legacy + KI-Safe) and normalize to KI-Safe
 * Legacy isolation: Accept any NavigationModeInput, normalize immediately
 */
function validateNavigationModeInput(navigationMode: string): boolean {
  return validateNavigationMode(navigationMode as NavigationModeInput);
}

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

  // Header-specific theme operations
  // FIX-018 Compliant: DatabaseThemeService pattern for header theme
  ipcMain.handle('themes:get-header-config', async (_, userId: string = 'default') => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getHeaderThemeConfig(userId);
    } catch (error) {
      console.error('[IPC:themes:get-header-config] Error:', error);
      throw error;
    }
  });

  ipcMain.handle('themes:set-header-config', async (_, userId: string, headerConfig: any) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.setHeaderThemeConfig(userId, headerConfig);
    } catch (error) {
      console.error('[IPC:themes:set-header-config] Error:', error);
      throw error;
    }
  });

  ipcMain.handle('themes:reset-header', async (_, userId: string = 'default') => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.resetHeaderTheme(userId);
    } catch (error) {
      console.error('[IPC:themes:reset-header] Error:', error);
      throw error;
    }
  });

  // === NEW: THEME OVERRIDE IPC HANDLERS (Migration 036) ===

  // Get theme override by ID
  ipcMain.handle('themes:get-override', async (_, userId: string, overrideId: number) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getThemeOverride(userId, overrideId);
    } catch (error) {
      console.error('[IPC:themes:get-override] Error:', error);
      throw error;
    }
  });

  // Get scoped theme overrides
  ipcMain.handle('themes:get-scoped-overrides', async (_, userId: string, scopeType: string, navigationMode?: string, isFocusMode: boolean = false) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      
      // Validate scope type
      if (!['navigation-mode', 'focus-mode', 'combined'].includes(scopeType)) {
        throw new Error(`Invalid scope type: ${scopeType}`);
      }
      
      return await themeService.getScopedThemeOverrides(userId, scopeType as any, navigationMode as any, isFocusMode);
    } catch (error) {
      console.error('[IPC:themes:get-scoped-overrides] Error:', error);
      throw error;
    }
  });

  // Get all theme overrides for user
  ipcMain.handle('themes:get-all-overrides', async (_, userId: string = 'default') => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.getAllThemeOverrides(userId);
    } catch (error) {
      console.error('[IPC:themes:get-all-overrides] Error:', error);
      throw error;
    }
  });

  // Set theme override
  ipcMain.handle('themes:set-override', async (_, userId: string, override: any) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.setThemeOverride(userId, override);
    } catch (error) {
      console.error('[IPC:themes:set-override] Error:', error);
      throw error;
    }
  });

  // Delete theme override
  ipcMain.handle('themes:delete-override', async (_, userId: string, overrideId: number) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      return await themeService.deleteThemeOverride(userId, overrideId);
    } catch (error) {
      console.error('[IPC:themes:delete-override] Error:', error);
      throw error;
    }
  });

  // Get applicable theme overrides for context
  ipcMain.handle('themes:get-applicable-overrides', async (_, userId: string = 'default', navigationMode: string = 'mode-dashboard-view', isFocusMode: boolean = false, screenWidth: number = 1920) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      
      // Legacy isolation: Validate and normalize navigation mode
      if (!validateNavigationModeInput(navigationMode)) {
        throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE_ARRAY.join(', ')}`);
      }
      
      const safeNavigationMode = normalizeToKiSafe(navigationMode as NavigationModeInput);
      
      return await themeService.getApplicableThemeOverrides(userId, safeNavigationMode, isFocusMode, screenWidth);
    } catch (error) {
      console.error('[IPC:themes:get-applicable-overrides] Error:', error);
      throw error;
    }
  });

  // Get theme with applied overrides
  ipcMain.handle('themes:get-with-overrides', async (_, userId: string = 'default', baseTheme: any, navigationMode: string = 'mode-dashboard-view', isFocusMode: boolean = false, screenWidth: number = 1920) => {
    try {
      if (!themeService) {
        throw new Error('Theme service not initialized');
      }
      
      // Legacy isolation: Validate and normalize navigation mode
      if (!validateNavigationModeInput(navigationMode)) {
        throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE_ARRAY.join(', ')}`);
      }
      
      const safeNavigationMode = normalizeToKiSafe(navigationMode as NavigationModeInput);
      
      return await themeService.getThemeWithOverrides(userId, baseTheme, safeNavigationMode, isFocusMode, screenWidth);
    } catch (error) {
      console.error('[IPC:themes:get-with-overrides] Error:', error);
      throw error;
    }
  });

  console.log('[ThemeIPC] Theme IPC handlers registered successfully (19 handlers)');
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
    'themes:delete',
    'themes:get-header-config',
    'themes:set-header-config',
    'themes:reset-header',
    // NEW: Theme Override Channels
    'themes:get-override',
    'themes:get-scoped-overrides',
    'themes:get-all-overrides',
    'themes:set-override',
    'themes:delete-override',
    'themes:get-applicable-overrides',
    'themes:get-with-overrides'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  themeService = null;
  console.log('[ThemeIPC] Theme IPC handlers cleaned up');
}