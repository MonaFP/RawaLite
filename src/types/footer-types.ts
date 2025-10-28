/**
 * TypeScript Interfaces für Footer Content Preferences System
 * 
 * Unterstützt Enhanced Focus-Bar Approach für Footer-Integration ohne
 * Verletzung der geschützten 4-Area CSS Grid Architektur (FIX-010).
 * 
 * Basiert auf Migration 041 Schema und Field-Mapper Integration.
 * 
 * ✅ Phase 3.2: KI-Safe Mode Names Migration
 * - Legacy: 'header-statistics' | 'header-navigation' | 'full-sidebar'
 * - KI-Safe: 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus'
 * 
 * @version 1.0.59
 * @date 2025-10-24
 * @author GitHub Copilot
 */

// Import KI-safe NavigationMode type 
export type NavigationMode = 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus';

// Legacy mode mapping for Migration 041 compatibility
export const LEGACY_MODE_MAPPING = {
  'mode-dashboard-view': 'header-statistics',
  'mode-data-panel': 'header-navigation', 
  'mode-compact-focus': 'full-sidebar'
} as const;

export const REVERSE_LEGACY_MODE_MAPPING = {
  'header-statistics': 'mode-dashboard-view',
  'header-navigation': 'mode-data-panel',
  'full-sidebar': 'mode-compact-focus'
} as const;

export type LegacyNavigationMode = 'header-statistics' | 'header-navigation' | 'full-sidebar';

/**
 * Convert KI-safe mode to legacy mode for database compatibility
 */
export function convertToLegacyMode(mode: NavigationMode): LegacyNavigationMode {
  return LEGACY_MODE_MAPPING[mode];
}

/**
 * Convert legacy mode to KI-safe mode from database
 */
export function convertFromLegacyMode(legacyMode: LegacyNavigationMode): NavigationMode {
  return REVERSE_LEGACY_MODE_MAPPING[legacyMode];
}

/**
 * Footer Content Preferences für unterschiedliche Navigation Modi
 * 
 * Definiert welche Footer-Inhalte in welchem Navigation-Modus angezeigt werden.
 * Integration erfolgt über Enhanced Focus-Bar Approach.
 * 
 * ✅ Phase 3.2: Uses KI-safe NavigationMode type
 */
export interface FooterContentPreferences {
  id?: number;
  userId: string;
  navigationMode: NavigationMode;  // ✅ KI-safe mode names
  
  // Footer Content Configuration
  showStatusInfo: boolean;
  showQuickActions: boolean;
  showApplicationInfo: boolean;
  showThemeSelector: boolean;
  showFocusModeToggle: boolean;
  customContentSlots: string[]; // JSON array of slot names
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Database-Raw Typ für user_footer_content_preferences Tabelle
 * 
 * Entspricht dem snake_case Schema der SQLite-Tabelle nach Migration 041.
 * Wird automatisch via Field-Mapper zu/von FooterContentPreferences konvertiert.
 * 
 * ⚠️ Legacy compatibility: Database still stores legacy mode names
 */
export interface FooterContentPreferencesDB {
  id?: number;
  user_id: string;
  navigation_mode: LegacyNavigationMode;  // ⚠️ Database stores legacy format
  
  // Footer Content Configuration
  show_status_info: boolean;
  show_quick_actions: boolean;
  show_application_info: boolean;
  show_theme_selector: boolean;
  show_focus_mode_toggle: boolean;
  custom_content_slots: string; // JSON string
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Erweiterte Focus Mode Preferences mit Footer-spezifischen Einstellungen
 * 
 * Erweitert bestehende Focus Mode Preferences (Migration 035) um Footer-Integration.
 * Unterstützt Enhanced Focus-Bar Approach und Auto-Hide Funktionalität.
 */
export interface FocusModePreferencesWithFooter {
  id?: number;
  userId: string;
  
  // Bestehende Focus Mode Einstellungen (aus Migration 035)
  focusModeEnabled: boolean;
  autoEnterFocusMode: boolean;
  showNavigationInFocusMode: boolean;
  hideDistractionsInFocusMode: boolean;
  customFocusRules: string; // JSON array
  
  // Neue Footer-spezifische Einstellungen (aus Migration 041)
  showFooterInNormalMode: boolean;
  showFooterInFocusMode: boolean;
  footerHeightPx: number; // 40-200px
  footerPosition: 'bottom' | 'focus-bar-area';
  footerAutoHide: boolean;
  footerAutoHideDelayMs: number; // 1000-10000ms
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Database-Raw Typ für erweiterte user_focus_mode_preferences Tabelle
 * 
 * Entspricht dem snake_case Schema nach Migration 041 Erweiterungen.
 * Automatische Konvertierung via Field-Mapper.
 */
export interface FocusModePreferencesWithFooterDB {
  id?: number;
  user_id: string;
  
  // Bestehende Focus Mode Einstellungen
  focus_mode_enabled: boolean;
  auto_enter_focus_mode: boolean;
  show_navigation_in_focus_mode: boolean;
  hide_distractions_in_focus_mode: boolean;
  custom_focus_rules: string; // JSON string
  
  // Neue Footer-spezifische Einstellungen
  show_footer_in_normal_mode: boolean;
  show_footer_in_focus_mode: boolean;
  footer_height_px: number;
  footer_position: 'bottom' | 'focus-bar-area';
  footer_auto_hide: boolean;
  footer_auto_hide_delay_ms: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Footer Content Slot Definition
 * 
 * Definiert verfügbare Content-Slots für modulare Footer-Inhalte.
 * Unterstützt Plugin-ähnliche Erweiterbarkeit.
 */
export interface FooterContentSlot {
  id: string;
  name: string;
  component: string; // React component name
  position: 'left' | 'center' | 'right';
  priority: number; // Rendering order
  enabled: boolean;
  dependencies?: string[]; // Required other slots
}

/**
 * Footer Status Information
 * 
 * Standard-Statusinformationen die im Footer angezeigt werden können.
 * Dynamisch basierend auf aktueller Navigation und Anwendungsstatus.
 */
export interface FooterStatusInfo {
  // Database Status
  databaseConnected: boolean;
  lastSyncAt?: string;
  recordCounts: {
    customers: number;
    offers: number;
    invoices: number;
    packages: number;
  };
  
  // Application Status
  version: string;
  buildNumber: string;
  currentNavigationMode: NavigationMode;  // ✅ KI-safe mode type
  focusModeActive: boolean;
  
  // Performance Metrics (optional)
  memoryUsage?: {
    used: number;
    total: number;
    unit: 'MB' | 'GB';
  };
}

/**
 * Footer Quick Actions Definition
 * 
 * Konfigurierbare Quick Actions für Footer-Integration.
 * Ermöglicht schnellen Zugriff auf häufige Funktionen.
 */
export interface FooterQuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string; // Function name or route
  shortcut?: string; // Keyboard shortcut
  enabled: boolean;
  visible: boolean;
  category: 'navigation' | 'creation' | 'tools' | 'settings';
}

/**
 * Footer Theme Selector Configuration
 * 
 * Theme-Auswahl Integration für Footer-Bereich.
 * Vereinfachte Interface für Database-Theme-System.
 */
export interface FooterThemeConfig {
  showThemeSelector: boolean;
  compactMode: boolean; // Reduced UI for footer space
  showThemePreview: boolean;
  availableThemes: Array<{
    id: number;
    name: string;
    displayName: string;
    isSystem: boolean;
  }>;
}

/**
 * Complete Footer Configuration
 * 
 * Kombiniert alle Footer-Aspekte für einheitliche Konfiguration.
 * Zentrale Interface für Footer-Management Services.
 */
export interface FooterConfiguration {
  // Per-Mode Content Preferences
  contentPreferences: Record<string, FooterContentPreferences>;
  
  // Focus Mode Integration
  focusModeIntegration: FocusModePreferencesWithFooter;
  
  // Available Content Slots
  availableSlots: FooterContentSlot[];
  
  // Theme Integration
  themeConfig: FooterThemeConfig;
  
  // Quick Actions
  quickActions: FooterQuickAction[];
  
  // Status Information
  statusInfo: FooterStatusInfo;
}

/**
 * Footer Service API Interface
 * 
 * Definiert Service-Layer Interface für Footer-Management.
 * Abstrahiert Datenbankzugriff und Business Logic.
 * 
 * ✅ Phase 3.2: Updated to use KI-safe NavigationMode
 */
export interface FooterServiceAPI {
  // Content Preferences Management
  getFooterContentPreferences(userId: string, navigationMode: NavigationMode): Promise<FooterContentPreferences>;
  updateFooterContentPreferences(preferences: FooterContentPreferences): Promise<void>;
  
  // Focus Mode Integration
  getFocusModePreferencesWithFooter(userId: string): Promise<FocusModePreferencesWithFooter>;
  updateFocusModePreferencesWithFooter(preferences: FocusModePreferencesWithFooter): Promise<void>;
  
  // Complete Configuration
  getFooterConfiguration(userId: string): Promise<FooterConfiguration>;
  
  // Real-time Status
  getFooterStatusInfo(): Promise<FooterStatusInfo>;
  
  // Quick Actions
  executeQuickAction(actionId: string): Promise<void>;
}