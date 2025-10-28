/**
 * IPC handlers for database footer management
 * 
 * Provides secure bridge between renderer and main process for footer operations.
 * Implements complete Footer Content Preferences System with proper error handling.
 * Enhanced Focus-Bar Approach: Footer integrates into focus-bar area.
 * 
 * @since v1.0.59 (Footer Content Preferences System)
 * @see {@link docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md} Footer Development Rules
 * @see {@link src/services/DatabaseFooterService.ts} Service Layer Implementation
 * @pattern themes.ts - Established RawaLite IPC pattern
 */

import { ipcMain } from 'electron';
import { DatabaseFooterService } from '../../src/services/DatabaseFooterService';

let footerService: DatabaseFooterService | null = null;

/**
 * Initialize footer service with database connection
 */
export function initializeFooterIpc(db: any) {
  footerService = new DatabaseFooterService(db);
  registerFooterHandlers();
}

/**
 * Register all footer-related IPC handlers
 */
function registerFooterHandlers() {
  // Get footer content preferences
  ipcMain.handle('footer:get-content-preferences', async (_, userId: string = 'default', navigationMode: string) => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      return await footerService.getFooterContentPreferences(userId, navigationMode);
    } catch (error) {
      console.error('[IPC:footer:get-content-preferences] Error:', error);
      throw error;
    }
  });

  // Update footer content preferences
  ipcMain.handle('footer:update-content-preferences', async (_, preferences: any) => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      await footerService.updateFooterContentPreferences(preferences);
      return true;
    } catch (error) {
      console.error('[IPC:footer:update-content-preferences] Error:', error);
      throw error;
    }
  });

  // Get focus mode preferences with footer integration
  ipcMain.handle('footer:get-focus-mode-preferences', async (_, userId: string = 'default') => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      return await footerService.getFocusModePreferencesWithFooter(userId);
    } catch (error) {
      console.error('[IPC:footer:get-focus-mode-preferences] Error:', error);
      throw error;
    }
  });

  // Update focus mode preferences with footer integration
  ipcMain.handle('footer:update-focus-mode-preferences', async (_, preferences: any) => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      await footerService.updateFocusModePreferencesWithFooter(preferences);
      return true;
    } catch (error) {
      console.error('[IPC:footer:update-focus-mode-preferences] Error:', error);
      throw error;
    }
  });

  // Get complete footer configuration
  ipcMain.handle('footer:get-configuration', async (_, userId: string = 'default') => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      return await footerService.getFooterConfiguration(userId);
    } catch (error) {
      console.error('[IPC:footer:get-configuration] Error:', error);
      throw error;
    }
  });

  // Get footer status information
  ipcMain.handle('footer:get-status-info', async () => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      return await footerService.getFooterStatusInfo();
    } catch (error) {
      console.error('[IPC:footer:get-status-info] Error:', error);
      throw error;
    }
  });

  // Execute footer quick action
  ipcMain.handle('footer:execute-quick-action', async (_, actionId: string) => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      await footerService.executeQuickAction(actionId);
      return true;
    } catch (error) {
      console.error('[IPC:footer:execute-quick-action] Error:', error);
      throw error;
    }
  });

  // Get footer quick actions
  ipcMain.handle('footer:get-quick-actions', async () => {
    try {
      if (!footerService) {
        throw new Error('Footer service not initialized');
      }
      const configuration = await footerService.getFooterConfiguration('default');
      return configuration?.quickActions || [];
    } catch (error) {
      console.error('[IPC:footer:get-quick-actions] Error:', error);
      throw error;
    }
  });

  // Validate footer system
  ipcMain.handle('footer:validate-system', async () => {
    try {
      if (!footerService) {
        console.warn('[IPC:footer:validate-system] Footer service not initialized');
        return false;
      }

      // Basic validation: check if service is properly initialized
      const statusInfo = await footerService.getFooterStatusInfo();
      return statusInfo ? statusInfo.databaseConnected : false;
    } catch (error) {
      console.error('[IPC:footer:validate-system] Error:', error);
      return false;
    }
  });

  console.log('[FooterIPC] Footer IPC handlers registered successfully (8 handlers)');
}

/**
 * Cleanup footer IPC handlers
 */
export function cleanupFooterIpc() {
  const channels = [
    'footer:get-content-preferences',
    'footer:update-content-preferences', 
    'footer:get-focus-mode-preferences',
    'footer:update-focus-mode-preferences',
    'footer:get-configuration',
    'footer:get-status-info',
    'footer:execute-quick-action',
    'footer:get-quick-actions',
    'footer:validate-system'
  ];

  channels.forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  footerService = null;
  console.log('[FooterIPC] Footer IPC handlers cleaned up');
}