/**
 * FocusModeIpcService - IPC Communication Layer for Focus Mode System
 * 
 * Provides secure IPC communication between renderer and main process for Focus Mode operations.
 * Follows the same architecture pattern as ThemeIpcService and NavigationIpcService.
 * 
 * Features:
 * - Type-safe IPC handlers
 * - Database-first operations with localStorage fallback
 * - Session management and analytics
 * - Error handling and validation
 * - Cross-process state synchronization
 * 
 * @author GitHub Copilot
 * @date 2025-10-20
 * @migration 029
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { DatabaseFocusModeService, FocusPreferences, FocusAnalytics, FocusVariant } from '../services/DatabaseFocusModeService';
import Database from 'better-sqlite3';

export class FocusModeIpcService {
  private focusModeService: DatabaseFocusModeService;

  constructor(database: Database.Database) {
    this.focusModeService = new DatabaseFocusModeService(database);
    this.registerHandlers();
  }

  /**
   * Register all Focus Mode IPC handlers
   */
  private registerHandlers(): void {
    // Focus preferences operations
    ipcMain.handle('focus-mode:get-preferences', this.handleGetPreferences.bind(this));
    ipcMain.handle('focus-mode:set-focus-mode', this.handleSetFocusMode.bind(this));
    ipcMain.handle('focus-mode:set-auto-restore', this.handleSetAutoRestore.bind(this));
    ipcMain.handle('focus-mode:reset-preferences', this.handleResetPreferences.bind(this));
    
    // Session management
    ipcMain.handle('focus-mode:start-session', this.handleStartSession.bind(this));
    ipcMain.handle('focus-mode:end-session', this.handleEndSession.bind(this));
    
    // Analytics and history
    ipcMain.handle('focus-mode:get-analytics', this.handleGetAnalytics.bind(this));
    
    // System validation
    ipcMain.handle('focus-mode:validate-schema', this.handleValidateSchema.bind(this));
    
    console.log('🎯 [FocusModeIpcService] IPC handlers registered');
  }

  /**
   * Get user's focus mode preferences
   */
  private async handleGetPreferences(
    _event: IpcMainInvokeEvent,
    userId?: string
  ): Promise<FocusPreferences | null> {
    try {
      const preferences = await this.focusModeService.getUserFocusPreferences(userId);
      console.log('🎯 [FocusModeIpcService] Get preferences:', { userId, found: !!preferences });
      return preferences;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Set focus mode state (active/inactive with variant)
   */
  private async handleSetFocusMode(
    _event: IpcMainInvokeEvent,
    userId: string | undefined,
    active: boolean,
    variant?: FocusVariant | null
  ): Promise<boolean> {
    try {
      const success = await this.focusModeService.setFocusMode(userId, active, variant);
      console.log('🎯 [FocusModeIpcService] Set focus mode:', { userId, active, variant, success });
      return success;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error setting focus mode:', error);
      return false;
    }
  }

  /**
   * Update auto-restore preference
   */
  private async handleSetAutoRestore(
    _event: IpcMainInvokeEvent,
    userId: string | undefined,
    autoRestore: boolean
  ): Promise<boolean> {
    try {
      const success = await this.focusModeService.setAutoRestore(userId, autoRestore);
      console.log('🎯 [FocusModeIpcService] Set auto-restore:', { userId, autoRestore, success });
      return success;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error setting auto-restore:', error);
      return false;
    }
  }

  /**
   * Reset user preferences to defaults
   */
  private async handleResetPreferences(
    _event: IpcMainInvokeEvent,
    userId?: string
  ): Promise<boolean> {
    try {
      const success = await this.focusModeService.resetFocusPreferences(userId);
      console.log('🎯 [FocusModeIpcService] Reset preferences:', { userId, success });
      return success;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Start a new focus session
   */
  private async handleStartSession(
    _event: IpcMainInvokeEvent,
    userId: string | undefined,
    variant: FocusVariant,
    sessionId: string,
    navigationMode?: string,
    themeName?: string
  ): Promise<boolean> {
    try {
      const success = await this.focusModeService.startFocusSession(
        userId, 
        variant, 
        sessionId, 
        navigationMode, 
        themeName
      );
      console.log('🎯 [FocusModeIpcService] Start session:', { 
        userId, variant, sessionId, navigationMode, themeName, success 
      });
      return success;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error starting session:', error);
      return false;
    }
  }

  /**
   * End current focus session
   */
  private async handleEndSession(
    _event: IpcMainInvokeEvent,
    sessionId: string
  ): Promise<boolean> {
    try {
      const success = await this.focusModeService.endFocusSession(sessionId);
      console.log('🎯 [FocusModeIpcService] End session:', { sessionId, success });
      return success;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error ending session:', error);
      return false;
    }
  }

  /**
   * Get focus mode analytics for user
   */
  private async handleGetAnalytics(
    _event: IpcMainInvokeEvent,
    userId?: string
  ): Promise<FocusAnalytics> {
    try {
      const analytics = await this.focusModeService.getFocusAnalytics(userId);
      console.log('🎯 [FocusModeIpcService] Get analytics:', { userId, analytics });
      return analytics;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error getting analytics:', error);
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        averageSessionTime: 0,
        mostUsedVariant: 'zen',
        variantUsageStats: { zen: { count: 0, totalTime: 0 }, mini: { count: 0, totalTime: 0 }, free: { count: 0, totalTime: 0 } }
      };
    }
  }

  /**
   * Validate focus mode schema exists
   */
  private async handleValidateSchema(
    _event: IpcMainInvokeEvent
  ): Promise<boolean> {
    try {
      const isValid = await this.focusModeService.validateFocusSchema();
      console.log('🎯 [FocusModeIpcService] Validate schema:', { isValid });
      return isValid;
    } catch (error: unknown) {
      console.error('[FocusModeIpcService] Error validating schema:', error);
      return false;
    }
  }

  /**
   * Cleanup IPC handlers
   */
  cleanup(): void {
    ipcMain.removeAllListeners('focus-mode:get-preferences');
    ipcMain.removeAllListeners('focus-mode:set-focus-mode');
    ipcMain.removeAllListeners('focus-mode:set-auto-restore');
    ipcMain.removeAllListeners('focus-mode:reset-preferences');
    ipcMain.removeAllListeners('focus-mode:start-session');
    ipcMain.removeAllListeners('focus-mode:end-session');
    ipcMain.removeAllListeners('focus-mode:get-analytics');
    ipcMain.removeAllListeners('focus-mode:validate-schema');
    
    console.log('🎯 [FocusModeIpcService] IPC handlers cleaned up');
  }
}