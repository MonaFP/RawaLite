/**
 * Update Manager IPC Handlers
 * 
 * Handles creation of Update Manager windows for development and production modes.
 * 
 * @since v1.0.42.5
 */

import { ipcMain } from 'electron';
import { createUpdateManagerWindow } from '../windows/update-window';
import { createUpdateManagerDevWindow } from '../windows/updateManagerDev';

/**
 * Register Update Manager IPC handlers
 */
export function registerUpdateManagerHandlers(): void {
  console.log('🔌 [UPDATE-MGR] Registering Update Manager IPC handlers...');

  /**
   * Create development Update Manager window
   */
  ipcMain.handle('dev:createUpdateManager', async () => {
    try {
      console.log('🔧 Creating development Update Manager window...')
      createUpdateManagerDevWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to create dev update manager window:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  });

  /**
   * Create production Update Manager window
   */
  ipcMain.handle('prod:createUpdateManager', async () => {
    try {
      console.log('🚀 Creating production Update Manager window...')
      createUpdateManagerWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to create prod update manager window:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  });

  console.log('✅ [UPDATE-MGR] Update Manager IPC handlers registered successfully');
}