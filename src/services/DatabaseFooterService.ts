/**
 * DatabaseFooterService - Footer Content Preferences Management
 * 
 * Minimal implementation following DatabaseThemeService pattern.
 * Manages per-navigation-mode footer preferences with prepared statements.
 * 
 * Enhanced Focus-Bar Approach: Footer integrates into existing focus-bar area
 * without violating protected 4-area CSS Grid architecture (FIX-010).
 * 
 * @version 1.0.59
 * @date 2025-10-24
 * @author GitHub Copilot
 */

import type Database from 'better-sqlite3';
import { FieldMapper } from '../lib/field-mapper';
import type { KiSafeNavigationMode } from '../types/navigation-safe';
import { NAVIGATION_MODES_SAFE } from '../types/navigation-safe';
import type {
  FooterContentPreferences,
  FooterContentPreferencesDB,
  FocusModePreferencesWithFooter,
  FocusModePreferencesWithFooterDB,
  FooterConfiguration,
  FooterServiceAPI,
  FooterStatusInfo,
  FooterQuickAction,
  FooterThemeConfig,
  FooterContentSlot
} from '../types/footer-types';

/**
 * DatabaseFooterService - Main Footer Management Service
 * 
 * Follows established RawaLite patterns for database services.
 */
export class DatabaseFooterService implements FooterServiceAPI {
  private db: Database.Database;
  
  // Prepared statements for optimal performance
  private statements: {
    getFooterPreferences?: Database.Statement;
    upsertFooterPreferences?: Database.Statement;
    getFocusPreferences?: Database.Statement;
    getCustomerCount?: Database.Statement;
    getOfferCount?: Database.Statement;
    getInvoiceCount?: Database.Statement;
    getPackageCount?: Database.Statement;
  } = {};

  constructor(db: Database.Database) {
    this.db = db;
    this.prepareStatements();
  }

  /**
   * Prepare all SQL statements for optimal performance
   */
  private prepareStatements(): void {
    // Footer content preferences operations
    this.statements.getFooterPreferences = this.db.prepare(`
      SELECT * FROM user_footer_content_preferences 
      WHERE user_id = ? AND navigation_mode = ?
    `);
    
    this.statements.upsertFooterPreferences = this.db.prepare(`
      INSERT OR REPLACE INTO user_footer_content_preferences (
        user_id, navigation_mode, show_status_info, show_quick_actions,
        show_application_info, show_theme_selector, show_focus_mode_toggle,
        custom_content_slots, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // Focus mode preferences operations
    this.statements.getFocusPreferences = this.db.prepare(`
      SELECT * FROM user_focus_mode_preferences WHERE user_id = ?
    `);

    // Status information queries
    this.statements.getCustomerCount = this.db.prepare(`SELECT COUNT(*) as count FROM customers`);
    this.statements.getOfferCount = this.db.prepare(`SELECT COUNT(*) as count FROM offers`);
    this.statements.getInvoiceCount = this.db.prepare(`SELECT COUNT(*) as count FROM invoices`);
    this.statements.getPackageCount = this.db.prepare(`SELECT COUNT(*) as count FROM packages`);
  }

  /**
   * Get footer content preferences for specific user and navigation mode
   */
  public async getFooterContentPreferences(
    userId: string = 'default',
    navigationMode: string
  ): Promise<FooterContentPreferences> {
    try {
      const result = this.statements.getFooterPreferences!.get(userId, navigationMode) as FooterContentPreferencesDB | undefined;

      if (result) {
        const preferences = FieldMapper.fromSQL(result) as FooterContentPreferences;
        preferences.customContentSlots = JSON.parse(result.custom_content_slots || '[]');
        return preferences;
      }

      // Return default preferences if none found
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

    } catch (error) {
      console.error('[DatabaseFooterService] Error getting footer content preferences:', error);
      
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
  public async updateFooterContentPreferences(preferences: FooterContentPreferences): Promise<void> {
    try {
      const dbData = FieldMapper.toSQL(preferences) as FooterContentPreferencesDB;
      const customContentSlotsJson = JSON.stringify(preferences.customContentSlots || []);

      this.statements.upsertFooterPreferences!.run(
        dbData.user_id,
        dbData.navigation_mode,
        dbData.show_status_info ? 1 : 0,
        dbData.show_quick_actions ? 1 : 0,
        dbData.show_application_info ? 1 : 0,
        dbData.show_theme_selector ? 1 : 0,
        dbData.show_focus_mode_toggle ? 1 : 0,
        customContentSlotsJson
      );
      
      console.log('[DatabaseFooterService] Footer content preferences updated successfully');

    } catch (error) {
      console.error('[DatabaseFooterService] Error updating footer content preferences:', error);
      throw new Error(`Failed to update footer content preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get focus mode preferences with footer integration
   */
  public async getFocusModePreferencesWithFooter(
    userId: string = 'default'
  ): Promise<FocusModePreferencesWithFooter> {
    try {
      const result = this.statements.getFocusPreferences!.get(userId) as FocusModePreferencesWithFooterDB | undefined;

      if (result) {
        const preferences = FieldMapper.fromSQL(result) as FocusModePreferencesWithFooter;
        preferences.customFocusRules = JSON.parse(result.custom_focus_rules || '[]') as string;
        return preferences;
      }

      // Return default preferences if none found
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

    } catch (error) {
      console.error('[DatabaseFooterService] Error getting focus mode preferences:', error);
      
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
  ): Promise<void> {
    try {
      // For now, log that this feature is implemented but not yet fully functional
      console.log('[DatabaseFooterService] Update focus mode preferences called:', preferences);
      console.warn('[DatabaseFooterService] Focus mode preferences update not yet implemented - requires prepared statement');

    } catch (error) {
      console.error('[DatabaseFooterService] Error updating focus mode preferences:', error);
      throw new Error(`Failed to update focus mode preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get complete footer configuration for user
   */
  public async getFooterConfiguration(userId: string = 'default'): Promise<FooterConfiguration> {
    try {
      // Legacy isolation: Get preferences for all KI-safe navigation modes
      const modes = NAVIGATION_MODES_SAFE;
      const contentPreferences: Record<string, FooterContentPreferences> = {};
      
      for (const mode of modes) {
        contentPreferences[mode] = await this.getFooterContentPreferences(userId, mode);
      }

      // Get focus mode integration
      const focusModeIntegration = await this.getFocusModePreferencesWithFooter(userId);

      // Get status information
      const statusInfo = await this.getFooterStatusInfo();

      const configuration: FooterConfiguration = {
        contentPreferences,
        focusModeIntegration,
        availableSlots: this.getAvailableContentSlots(),
        themeConfig: this.getFooterThemeConfig(),
        quickActions: this.getFooterQuickActions(),
        statusInfo
      };

      return configuration;

    } catch (error) {
      console.error('[DatabaseFooterService] Error getting footer configuration:', error);
      throw new Error(`Failed to get footer configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time footer status information
   */
  public async getFooterStatusInfo(): Promise<FooterStatusInfo> {
    try {
      // Get database record counts
      const customerCount = this.statements.getCustomerCount!.get() as { count: number };
      const offerCount = this.statements.getOfferCount!.get() as { count: number };
      const invoiceCount = this.statements.getInvoiceCount!.get() as { count: number };
      const packageCount = this.statements.getPackageCount!.get() as { count: number };

      return {
        databaseConnected: true,
        lastSyncAt: new Date().toISOString(),
        recordCounts: {
          customers: customerCount.count,
          offers: offerCount.count,
          invoices: invoiceCount.count,
          packages: packageCount.count
        },
        version: '1.0.59',
        buildNumber: 'dev',
        currentNavigationMode: 'mode-dashboard-view',  // was: header-statistics
        focusModeActive: false
      };

    } catch (error) {
      console.error('[DatabaseFooterService] Error getting status info:', error);
      
      return {
        databaseConnected: false,
        recordCounts: { customers: 0, offers: 0, invoices: 0, packages: 0 },
        version: '1.0.59',
        buildNumber: 'unknown',
        currentNavigationMode: 'mode-dashboard-view',  // was: header-statistics
        focusModeActive: false
      };
    }
  }

  /**
   * Execute footer quick action
   */
  public async executeQuickAction(actionId: string): Promise<void> {
    try {
      console.log('[DatabaseFooterService] Executing quick action:', actionId);

      // Dispatch custom events for UI handling
      window.dispatchEvent(new CustomEvent('footer-action', { 
        detail: { action: actionId }
      }));

    } catch (error) {
      console.error('[DatabaseFooterService] Error executing quick action:', error);
      throw new Error(`Failed to execute quick action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available footer content slots
   */
  private getAvailableContentSlots(): FooterContentSlot[] {
    return [
      {
        id: 'status-info',
        name: 'Status Information',
        component: 'FooterStatusInfo',
        position: 'left',
        priority: 1,
        enabled: true
      },
      {
        id: 'quick-actions',
        name: 'Quick Actions',
        component: 'FooterQuickActions',
        position: 'center',
        priority: 2,
        enabled: true
      },
      {
        id: 'focus-mode-toggle',
        name: 'Focus Mode Toggle',
        component: 'FooterFocusModeToggle',
        position: 'right',
        priority: 4,
        enabled: true
      }
    ];
  }

  /**
   * Get footer theme configuration
   */
  private getFooterThemeConfig(): FooterThemeConfig {
    return {
      showThemeSelector: false,
      compactMode: true,
      showThemePreview: false,
      availableThemes: []
    };
  }

  /**
   * Get footer quick actions configuration
   */
  private getFooterQuickActions(): FooterQuickAction[] {
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
}

// Export the service class
export default DatabaseFooterService;