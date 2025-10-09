/**
 * Auto-Update Types für RawaLite
 * 
 * TypeScript Definitionen für das Auto-Update Notification System.
 * Defines interfaces und types für SidebarUpdateWidget und related services.
 * 
 * @version 1.0.33+
 * @since Auto-Update Notifications Implementation
 */

// Import existing types from update system
import type { UpdateInfo, UpdateCheckResult } from './update.types';

/**
 * Auto-Update Widget Status
 */
export type AutoUpdateStatus = 
  | 'idle'          // Normale Anzeige mit aktueller Version
  | 'checking'      // Background Check läuft
  | 'available'     // Update verfügbar - Widget expandiert
  | 'up-to-date'    // Check abgeschlossen, keine Updates
  | 'error';        // Check fehlgeschlagen

/**
 * Widget Visual State Configuration
 */
export interface WidgetVisualState {
  icon: string;
  color: string;
  text: string;
  expandable?: boolean;
}

/**
 * Update Widget State
 */
export interface UpdateWidgetState {
  currentVersion: string;
  status: AutoUpdateStatus;
  updateInfo?: UpdateInfo;
  lastCheck?: Date;
  error?: string;
}

/**
 * Auto-Update Preferences
 */
export interface AutoUpdatePreferences {
  enabled: boolean;                       // Auto-check aktiviert
  checkFrequency: 'startup' | 'daily' | 'weekly';
  notificationStyle: 'subtle' | 'prominent';
  reminderInterval: number;               // Stunden zwischen Erinnerungen
  autoDownload: boolean;                  // Background Download erlaubt
  installPrompt: 'immediate' | 'scheduled' | 'manual';
}

/**
 * Default Auto-Update Preferences
 */
export const DEFAULT_AUTO_UPDATE_PREFERENCES: AutoUpdatePreferences = {
  enabled: true,
  checkFrequency: 'startup',
  notificationStyle: 'subtle',
  reminderInterval: 4,
  autoDownload: false,
  installPrompt: 'manual'
};

/**
 * Widget Visual State Mapping
 */
export const WIDGET_VISUAL_STATES: Record<AutoUpdateStatus, WidgetVisualState> = {
  'idle': { 
    icon: '📱', 
    color: 'var(--text-secondary)', 
    text: 'v{version}',
    expandable: false
  },
  'checking': { 
    icon: '🔄', 
    color: 'var(--accent)', 
    text: 'Suche...',
    expandable: false
  },
  'available': { 
    icon: '🎉', 
    color: 'var(--ok)', 
    text: 'Update verfügbar!',
    expandable: true
  },
  'up-to-date': { 
    icon: '✅', 
    color: 'var(--text-secondary)', 
    text: 'Aktuell v{version}',
    expandable: false
  },
  'error': { 
    icon: '⚠️', 
    color: 'var(--error)', 
    text: 'Check fehlgeschlagen',
    expandable: false
  }
};

/**
 * Sidebar Update Widget Props
 */
export interface SidebarUpdateWidgetProps {
  /** Callback when update is clicked */
  onUpdateClick?: () => void;
  /** Auto-check for updates on mount */
  checkOnMount?: boolean;
  /** Widget positioning context */
  position?: 'sidebar' | 'footer';
  /** Custom styling */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Auto-Update Service Interface
 */
export interface IAutoUpdateService {
  getStatus(): Promise<UpdateWidgetState>;
  getPreferences(): Promise<AutoUpdatePreferences>;
  setPreferences(preferences: AutoUpdatePreferences): Promise<void>;
  startBackgroundChecks(): Promise<void>;
  stopBackgroundChecks(): Promise<void>;
  performCheck(): Promise<UpdateCheckResult>;
}

/**
 * Auto-Update Hook Return Type
 */
export interface UseAutoUpdatesResult {
  status: AutoUpdateStatus;
  currentVersion: string;
  updateInfo?: UpdateInfo;
  lastCheck?: Date;
  error?: string;
  preferences?: AutoUpdatePreferences;
  
  // Actions
  checkForUpdates: () => Promise<void>;
  updatePreferences: (prefs: AutoUpdatePreferences) => Promise<void>;
  
  // State flags
  isLoading: boolean;
  hasUpdate: boolean;
}

/**
 * Utility functions for widget state
 */
export const AutoUpdateUtils = {
  /**
   * Get visual state for current status
   */
  getVisualState(status: AutoUpdateStatus, version?: string): WidgetVisualState {
    const state = WIDGET_VISUAL_STATES[status];
    return {
      ...state,
      text: state.text.replace('{version}', version || '1.0.33')
    };
  },
  
  /**
   * Format last check time
   */
  formatLastCheck(date?: Date): string {
    if (!date) return 'Nie';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes} Min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  },
  
  /**
   * Check if widget should be expanded
   */
  shouldExpand(status: AutoUpdateStatus): boolean {
    return WIDGET_VISUAL_STATES[status].expandable === true;
  },
  
  /**
   * Validate preferences
   */
  validatePreferences(prefs: Partial<AutoUpdatePreferences>): AutoUpdatePreferences {
    return {
      ...DEFAULT_AUTO_UPDATE_PREFERENCES,
      ...prefs
    };
  }
};