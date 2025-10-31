/**
 * IPC handlers for database navigation management
 * 
 * Provides secure bridge between renderer and main process for navigation operations.
 * Implements complete CRUD operations with proper error handling.
 * 
 * ✅ LEGACY ISOLATION STRATEGY:
 * - Uses navigation-safe.ts for KI-safe type handling
 * - Legacy modes converted at IPC boundaries only
 * - IPC methods work EXCLUSIVELY with KI-Safe modes internally
 * 
 * @since v1.0.45+ (Database-Navigation-System)
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md} Navigation Integration Architecture
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} Critical Fixes Registry
 * @pattern themes.ts (FIX-018: Service Layer Pattern Preservation)
 */

import { ipcMain } from 'electron';

// ✅ CLEAN TYPE IMPORTS from navigation-safe.ts
import { 
  KiSafeNavigationMode,
  NavigationModeInput,
  NAVIGATION_MODES_SAFE,
  isValidNavigationMode,
  normalizeToKiSafe,
  DEFAULT_NAVIGATION_MODE
} from '../../src/types/navigation-safe';

// ✅ LEGACY-ISOLATED DatabaseNavigationService
import { DatabaseNavigationService } from '../../src/services/DatabaseNavigationService';

// ✅ ALIAS für saubere Migration (alle IPC handlers verwenden NavigationMode = KiSafeNavigationMode)
export type NavigationMode = KiSafeNavigationMode;

let navigationService: DatabaseNavigationService | null = null;

/**
 * ✅ CLEAN VALIDATION: KI-Safe + NavigationModeInput support
 * Accepts legacy modes via input but normalizes immediately to KI-safe
 */
function validateNavigationModeInput(navigationMode: string): boolean {
  return isValidNavigationMode(navigationMode as NavigationModeInput);
}

/**
 * Initialize navigation service with database connection
 */
export function initializeNavigationIpc(db: any) {
  navigationService = new DatabaseNavigationService(db);
  
  // Service is initialized through constructor - no separate initialize() method needed
  console.log('[NavigationIPC] DatabaseNavigationService initialized successfully');
  
  registerNavigationHandlers();
}

/**
 * Register all navigation-related IPC handlers
 */
function registerNavigationHandlers() {
  // Get user navigation preferences
  ipcMain.handle('navigation:get-user-preferences', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getUserNavigationPreferences(userId);
    } catch (error) {
      console.error('[IPC:navigation:get-user-preferences] Error:', error);
      throw error;
    }
  });

  // Set user navigation preferences
  ipcMain.handle('navigation:set-user-preferences', async (_, userId: string, preferences: any) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.setUserNavigationPreferences(userId, preferences);
    } catch (error) {
      console.error('[IPC:navigation:set-user-preferences] Error:', error);
      throw error;
    }
  });

  // Set navigation mode
  ipcMain.handle('navigation:set-navigation-mode', async (_, userId: string, navigationMode: string, sessionId?: string) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      
      // ✅ LEGACY ISOLATION: Validate and normalize input
      if (!validateNavigationModeInput(navigationMode)) {
        throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE.join(', ')}`);
      }
      
      const kiSafeMode = normalizeToKiSafe(navigationMode as NavigationModeInput);

      return await navigationService.setNavigationMode(userId, kiSafeMode, sessionId);
    } catch (error) {
      console.error('[IPC:navigation:set-navigation-mode] Error:', error);
      throw error;
    }
  });

  // Update layout dimensions
  ipcMain.handle('navigation:update-layout-dimensions', async (_, userId: string, headerHeight?: number, sidebarWidth?: number) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.updateLayoutDimensions(userId, headerHeight, sidebarWidth);
    } catch (error) {
      console.error('[IPC:navigation:update-layout-dimensions] Error:', error);
      throw error;
    }
  });

  // Get navigation layout configuration
  ipcMain.handle('navigation:get-layout-config', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getNavigationLayoutConfig(userId);
    } catch (error) {
      console.error('[IPC:navigation:get-layout-config] Error:', error);
      throw error;
    }
  });

  // Get navigation mode history
  ipcMain.handle('navigation:get-mode-history', async (_, userId: string = 'default', limit: number = 10) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getNavigationModeHistory(userId, limit);
    } catch (error) {
      console.error('[IPC:navigation:get-mode-history] Error:', error);
      throw error;
    }
  });

  // Get navigation mode statistics
  ipcMain.handle('navigation:get-statistics', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getNavigationModeStatistics(userId);
    } catch (error) {
      console.error('[IPC:navigation:get-statistics] Error:', error);
      throw error;
    }
  });

  // Reset navigation preferences
  ipcMain.handle('navigation:reset-preferences', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.resetNavigationPreferences(userId);
    } catch (error) {
      console.error('[IPC:navigation:reset-preferences] Error:', error);
      throw error;
    }
  });

  // Validate navigation schema
  ipcMain.handle('navigation:validate-schema', async () => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.validateNavigationSchema();
    } catch (error) {
      console.error('[IPC:navigation:validate-schema] Error:', error);
      throw error;
    }
  });

  // === NEW: PER-MODE SETTINGS IPC HANDLERS (Migration 034) ===

  // Get mode-specific settings
  ipcMain.handle('navigation:get-mode-settings', async (_, userId: string = 'default', navigationMode: string) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      
      // ✅ LEGACY ISOLATION: Validate and normalize input
      if (!validateNavigationModeInput(navigationMode)) {
        throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE.join(', ')}`);
      }
      
      // ✅ NORMALIZATION: Convert input to KI-safe for internal operations
      const kiSafeMode = normalizeToKiSafe(navigationMode as NavigationModeInput);
      
      return await navigationService.getModeSpecificSettings(userId, kiSafeMode as any);
    } catch (error) {
      console.error('[IPC:navigation:get-mode-settings] Error:', error);
      throw error;
    }
  });

  // Set mode-specific settings
  ipcMain.handle('navigation:set-mode-settings', async (_, userId: string = 'default', settings: any) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.setModeSpecificSettings(userId, settings);
    } catch (error) {
      console.error('[IPC:navigation:set-mode-settings] Error:', error);
      throw error;
    }
  });

  // Get all mode settings for user
  ipcMain.handle('navigation:get-all-mode-settings', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getAllModeSettings(userId);
    } catch (error) {
      console.error('[IPC:navigation:get-all-mode-settings] Error:', error);
      throw error;
    }
  });

  // === NEW: FOCUS MODE PREFERENCES IPC HANDLERS (Migration 035) ===

  // Get focus preferences for navigation mode
  ipcMain.handle('navigation:get-focus-preferences', async (_, userId: string = 'default', navigationMode: string) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      
      // ✅ LEGACY ISOLATION: Validate and normalize input
      if (!validateNavigationModeInput(navigationMode)) {
        throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE.join(', ')}`);
      }
      
      // ✅ NORMALIZATION: Convert input to KI-safe for internal operations
      const kiSafeMode = normalizeToKiSafe(navigationMode as NavigationModeInput);
      
      return await navigationService.getFocusModePreferences(userId, kiSafeMode as any);
    } catch (error) {
      console.error('[IPC:navigation:get-focus-preferences] Error:', error);
      throw error;
    }
  });

  // Set focus preferences for navigation mode
  ipcMain.handle('navigation:set-focus-preferences', async (_, userId: string = 'default', preferences: any) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.setFocusModePreferences(userId, preferences);
    } catch (error) {
      console.error('[IPC:navigation:set-focus-preferences] Error:', error);
      throw error;
    }
  });

  // Get all focus preferences for user
  ipcMain.handle('navigation:get-all-focus-preferences', async (_, userId: string = 'default') => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      return await navigationService.getAllFocusPreferences(userId);
    } catch (error) {
      console.error('[IPC:navigation:get-all-focus-preferences] Error:', error);
      throw error;
    }
  });

  // Get enhanced layout configuration with per-mode and focus settings
  ipcMain.handle('navigation:get-enhanced-layout-config', async (_, userId: string = 'default', navigationMode?: string, inFocusMode: boolean = false) => {
    try {
      if (!navigationService) {
        throw new Error('Navigation service not initialized');
      }
      
      // Legacy isolation: Validate navigation mode if provided
      if (navigationMode) {
        if (!validateNavigationModeInput(navigationMode)) {
          throw new Error(`Invalid navigation mode: ${navigationMode}. Valid modes: ${NAVIGATION_MODES_SAFE.join(', ')} (+ legacy)`);
        }
        // Normalize to KI-safe immediately
        navigationMode = normalizeToKiSafe(navigationMode as NavigationModeInput);
      }
      
      return await navigationService.getEnhancedLayoutConfig(userId, navigationMode as any, inFocusMode);
    } catch (error) {
      console.error('[IPC:navigation:get-enhanced-layout-config] Error:', error);
      throw error;
    }
  });

  console.log('[NavigationIPC] Navigation IPC handlers registered successfully (15 handlers - Footer via dedicated Footer IPC)');
}

/**
 * Cleanup navigation IPC handlers
 */
export function cleanupNavigationIpc() {
  const channels = [
    'navigation:get-user-preferences',
    'navigation:set-user-preferences',
    'navigation:set-navigation-mode',
    'navigation:update-layout-dimensions',
    'navigation:get-layout-config',
    'navigation:get-mode-history',
    'navigation:get-statistics',
    'navigation:reset-preferences',
    'navigation:validate-schema',
    // NEW: Per-Mode Settings Channels
    'navigation:get-mode-settings',
    'navigation:set-mode-settings',
    'navigation:get-all-mode-settings',
    // NEW: Focus Mode Preferences Channels
    'navigation:get-focus-preferences',
    'navigation:set-focus-preferences',
    'navigation:get-all-focus-preferences',
    'navigation:get-enhanced-layout-config'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  navigationService = null;
  console.log('[NavigationIPC] Navigation IPC handlers cleaned up');
}