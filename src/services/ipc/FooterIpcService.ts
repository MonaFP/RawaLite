/**
 * FooterIpcService - Frontend service for footer operations via IPC
 * 
 * Provides browser-safe interface to database footer operations.
 * Communicates with main process DatabaseFooterService via IPC channels.
 * Follows established ThemeIpcService pattern for consistency.
 * 
 * @since v1.0.59 (Footer Content Preferences System)
 * @see docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
 * @pattern ThemeIpcService - Established RawaLite IPC pattern
 */

import type {
  FooterContentPreferences,
  FocusModePreferencesWithFooter,
  FooterConfiguration,
  FooterStatusInfo,
  FooterQuickAction
} from '../../types/footer-types';

export class FooterIpcService {
  private static instance: FooterIpcService;

  public static getInstance(): FooterIpcService {
    if (!FooterIpcService.instance) {
      FooterIpcService.instance = new FooterIpcService();
    }
    return FooterIpcService.instance;
  }

  private constructor() {
    // Singleton pattern following ThemeIpcService
  }

  /**
   * Get footer content preferences for specific user and navigation mode
   */
  public async getFooterContentPreferences(
    userId: string = 'default',
    navigationMode: string
  ): Promise<FooterContentPreferences> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available, using default preferences');
        return {
          userId,
          navigationMode: navigationMode as any,
          showStatusInfo: true,
          showQuickActions: true,
          showApplicationInfo: false,
          showThemeSelector: false,
          showFocusModeToggle: true,
          customContentSlots: []
        };
      }

      const preferences = await window.rawalite.footer.getContentPreferences(userId, navigationMode);
      return preferences || {
        userId,
        navigationMode: navigationMode as any,
        showStatusInfo: true,
        showQuickActions: false,
        showApplicationInfo: false,
        showThemeSelector: false,
        showFocusModeToggle: false,
        customContentSlots: []
      };
    } catch (error) {
      console.error('[FooterIpcService] Failed to get footer content preferences:', error);
      return {
        userId,
        navigationMode: navigationMode as any,
        showStatusInfo: true,
        showQuickActions: false,
        showApplicationInfo: false,
        showThemeSelector: false,
        showFocusModeToggle: false,
        customContentSlots: []
      };
    }
  }

  /**
   * Update footer content preferences for specific user and navigation mode
   */
  public async updateFooterContentPreferences(preferences: FooterContentPreferences): Promise<boolean> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available');
        return false;
      }

      const success = await window.rawalite.footer.updateContentPreferences(preferences);
      return success || false;
    } catch (error) {
      console.error('[FooterIpcService] Failed to update footer content preferences:', error);
      return false;
    }
  }

  /**
   * Get focus mode preferences with footer integration
   */
  public async getFocusModePreferencesWithFooter(
    userId: string = 'default'
  ): Promise<FocusModePreferencesWithFooter> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available, using default focus preferences');
        return {
          userId,
          focusModeEnabled: false,
          autoEnterFocusMode: false,
          showNavigationInFocusMode: true,
          hideDistractionsInFocusMode: true,
          customFocusRules: '',
          showFooterInNormalMode: true,
          showFooterInFocusMode: false,
          footerHeightPx: 80,
          footerPosition: 'focus-bar-area',
          footerAutoHide: false,
          footerAutoHideDelayMs: 3000
        };
      }

      const preferences = await window.rawalite.footer.getFocusModePreferences(userId);
      return preferences || {
        userId,
        focusModeEnabled: false,
        autoEnterFocusMode: false,
        showNavigationInFocusMode: true,
        hideDistractionsInFocusMode: false,
        customFocusRules: '',
        showFooterInNormalMode: true,
        showFooterInFocusMode: false,
        footerHeightPx: 80,
        footerPosition: 'focus-bar-area',
        footerAutoHide: false,
        footerAutoHideDelayMs: 3000
      };
    } catch (error) {
      console.error('[FooterIpcService] Failed to get focus mode preferences:', error);
      return {
        userId,
        focusModeEnabled: false,
        autoEnterFocusMode: false,
        showNavigationInFocusMode: true,
        hideDistractionsInFocusMode: false,
        customFocusRules: '',
        showFooterInNormalMode: true,
        showFooterInFocusMode: false,
        footerHeightPx: 80,
        footerPosition: 'focus-bar-area',
        footerAutoHide: false,
        footerAutoHideDelayMs: 3000
      };
    }
  }

  /**
   * Update focus mode preferences with footer integration
   */
  public async updateFocusModePreferencesWithFooter(
    preferences: FocusModePreferencesWithFooter
  ): Promise<boolean> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available');
        return false;
      }

      const success = await window.rawalite.footer.updateFocusModePreferences(preferences);
      return success || false;
    } catch (error) {
      console.error('[FooterIpcService] Failed to update focus mode preferences:', error);
      return false;
    }
  }

  /**
   * Get complete footer configuration for user
   */
  public async getFooterConfiguration(userId: string = 'default'): Promise<FooterConfiguration | null> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available');
        return null;
      }

      const configuration = await window.rawalite.footer.getConfiguration(userId);
      return configuration || null;
    } catch (error) {
      console.error('[FooterIpcService] Failed to get footer configuration:', error);
      return null;
    }
  }

  /**
   * Get real-time footer status information
   */
  public async getFooterStatusInfo(): Promise<FooterStatusInfo | null> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available');
        return null;
      }

      const statusInfo = await window.rawalite.footer.getStatusInfo();
      return statusInfo || null;
    } catch (error) {
      console.error('[FooterIpcService] Failed to get footer status info:', error);
      return null;
    }
  }

  /**
   * Execute footer quick action
   */
  public async executeQuickAction(actionId: string): Promise<boolean> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available');
        return false;
      }

      const success = await window.rawalite.footer.executeQuickAction(actionId);
      return success || false;
    } catch (error) {
      console.error('[FooterIpcService] Failed to execute quick action:', error);
      return false;
    }
  }

  /**
   * Get available footer quick actions
   */
  public async getFooterQuickActions(): Promise<FooterQuickAction[]> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available, using default actions');
        return [
          {
            id: 'create-customer',
            label: 'Neuer Kunde',
            icon: 'user-plus',
            action: 'create-customer',
            shortcut: 'Ctrl+N',
            enabled: true,
            visible: true,
            category: 'creation'
          },
          {
            id: 'toggle-focus-mode',
            label: 'Focus Mode',
            icon: 'focus',
            action: 'toggle-focus-mode',
            shortcut: 'F11',
            enabled: true,
            visible: true,
            category: 'tools'
          }
        ];
      }

      const actions = await window.rawalite.footer.getQuickActions();
      return actions || [];
    } catch (error) {
      console.error('[FooterIpcService] Failed to get footer quick actions:', error);
      return [];
    }
  }

  /**
   * Subscribe to footer status updates
   */
  public async subscribeToStatusUpdates(callback: (statusInfo: FooterStatusInfo) => void): Promise<() => void> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available for status updates');
        return () => {}; // Return empty cleanup function
      }

      // Set up periodic status polling (fallback approach)
      const interval = setInterval(async () => {
        try {
          const statusInfo = await this.getFooterStatusInfo();
          if (statusInfo) {
            callback(statusInfo);
          }
        } catch (error) {
          console.error('[FooterIpcService] Error in status update polling:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Return cleanup function
      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error('[FooterIpcService] Failed to subscribe to status updates:', error);
      return () => {};
    }
  }

  /**
   * Validate footer system integrity
   */
  public async validateFooterSystem(): Promise<boolean> {
    try {
      if (!window.rawalite?.footer) {
        console.warn('[FooterIpcService] IPC footer not available for validation');
        return false;
      }

      const isValid = await window.rawalite.footer.validateSystem();
      return isValid || false;
    } catch (error) {
      console.error('[FooterIpcService] Failed to validate footer system:', error);
      return false;
    }
  }
}

// Export singleton instance for convenience
export const footerIpcService = FooterIpcService.getInstance();