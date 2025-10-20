/**
 * FocusModeIpcService Client - Renderer Process Communication Layer
 * 
 * Provides type-safe IPC communication from renderer to main process for Focus Mode operations.
 * Follows the same pattern as NavigationIpcService and ThemeIpcService.
 * 
 * @author GitHub Copilot
 * @date 2025-10-20
 */

export type FocusVariant = 'zen' | 'mini' | 'free';

export interface FocusPreferences {
  id?: number;
  userId: string;
  focusModeActive: boolean;
  focusModeVariant: FocusVariant | null;
  autoRestore: boolean;
  lastSessionVariant: FocusVariant | null;
  sessionCount: number;
  totalFocusTime: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FocusAnalytics {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionTime: number;
  mostUsedVariant: FocusVariant;
  variantUsageStats: Record<FocusVariant, { count: number; totalTime: number }>;
  lastUsed?: string;
}

export class FocusIpcService {
  private static instance: FocusIpcService;

  static getInstance(): FocusIpcService {
    if (!FocusIpcService.instance) {
      FocusIpcService.instance = new FocusIpcService();
    }
    return FocusIpcService.instance;
  }

  /**
   * Get user's focus mode preferences
   */
  async getUserFocusPreferences(userId?: string): Promise<FocusPreferences | null> {
    try {
      if (!window.electronAPI?.focusMode) return null;
      return await window.electronAPI.focusMode.getPreferences(userId);
    } catch (error) {
      console.error('[FocusIpcService] Error getting preferences:', error);
      return null;
    }
  }

  /**
   * Set focus mode state (active/inactive with variant)
   */
  async setFocusMode(userId: string | undefined, active: boolean, variant?: FocusVariant | null): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.setFocusMode(userId, active, variant);
    } catch (error) {
      console.error('[FocusIpcService] Error setting focus mode:', error);
      return false;
    }
  }

  /**
   * Update auto-restore preference
   */
  async setAutoRestore(userId: string | undefined, autoRestore: boolean): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.setAutoRestore(userId, autoRestore);
    } catch (error) {
      console.error('[FocusIpcService] Error setting auto-restore:', error);
      return false;
    }
  }

  /**
   * Reset user preferences to defaults
   */
  async resetPreferences(userId?: string): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.resetPreferences(userId);
    } catch (error) {
      console.error('[FocusIpcService] Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Start a new focus session
   */
  async startFocusSession(
    userId: string | undefined,
    variant: FocusVariant,
    sessionId: string,
    navigationMode?: string,
    themeName?: string
  ): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.startSession(userId, variant, sessionId, navigationMode, themeName);
    } catch (error) {
      console.error('[FocusIpcService] Error starting session:', error);
      return false;
    }
  }

  /**
   * End current focus session
   */
  async endFocusSession(sessionId: string): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.endSession(sessionId);
    } catch (error) {
      console.error('[FocusIpcService] Error ending session:', error);
      return false;
    }
  }

  /**
   * Get focus mode analytics for user
   */
  async getFocusAnalytics(userId?: string): Promise<FocusAnalytics> {
    try {
      if (!window.electronAPI?.focusMode) {
        return {
          totalSessions: 0,
          totalFocusTime: 0,
          averageSessionTime: 0,
          mostUsedVariant: 'zen',
          variantUsageStats: { zen: { count: 0, totalTime: 0 }, mini: { count: 0, totalTime: 0 }, free: { count: 0, totalTime: 0 } }
        };
      }
      return await window.electronAPI.focusMode.getAnalytics(userId);
    } catch (error) {
      console.error('[FocusIpcService] Error getting analytics:', error);
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
  async validateFocusSchema(): Promise<boolean> {
    try {
      if (!window.electronAPI?.focusMode) return false;
      return await window.electronAPI.focusMode.validateSchema();
    } catch (error) {
      console.error('[FocusIpcService] Error validating schema:', error);
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId(): string {
    return `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}