/**
 * Navigation Mode Normalization Service
 * 
 * Provides seamless conversion between Legacy navigation modes and KI-safe modes.
 * This service ensures backward compatibility while migrating to the new mode system.
 * 
 * Key Features:
 * - Legacy → KI-safe mode conversion
 * - KI-safe → Legacy mode conversion (for database compatibility)
 * - Validation and error handling
 * - User preference migration support
 * 
 * MIGRATION STATUS:
 * - Database schema already converted to KI-safe modes (Migration 044) ✅
 * - User data automatically migrated during app updates ✅
 * - This service provides transitional compatibility for mixed environments
 * 
 * DEPRECATION TIMELINE:
 * - v1.0.62-v1.0.66: Full legacy support (current)
 * - v1.0.67+: Deprecation warnings for legacy modes
 * - v1.1.0+: Legacy support removal
 * 
 * @since v1.0.59
 * @date 2025-10-25
 */

export type LegacyNavigationMode = 'header-statistics' | 'header-navigation' | 'full-sidebar';
export type KiSafeNavigationMode = 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus';
export type NavigationModeInput = LegacyNavigationMode | KiSafeNavigationMode;

/**
 * Mapping between Legacy and KI-safe navigation modes
 */
export const NAVIGATION_MODE_MAPPING = {
  // Legacy → KI-safe
  'header-statistics': 'mode-dashboard-view',
  'header-navigation': 'mode-data-panel', 
  'full-sidebar': 'mode-compact-focus',
  
  // KI-safe → Legacy (for database compatibility)
  'mode-dashboard-view': 'header-statistics',
  'mode-data-panel': 'header-navigation',
  'mode-compact-focus': 'full-sidebar'
} as const;

/**
 * Valid navigation modes
 */
export const LEGACY_MODES: LegacyNavigationMode[] = ['header-statistics', 'header-navigation', 'full-sidebar'];
export const KI_SAFE_MODES: KiSafeNavigationMode[] = ['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'];
export const ALL_MODES: NavigationModeInput[] = [...LEGACY_MODES, ...KI_SAFE_MODES];

/**
 * Check if a mode is a legacy mode
 */
export function isLegacyMode(mode: string): mode is LegacyNavigationMode {
  return LEGACY_MODES.includes(mode as LegacyNavigationMode);
}

/**
 * Check if a mode is a KI-safe mode
 */
export function isKiSafeMode(mode: string): mode is KiSafeNavigationMode {
  return KI_SAFE_MODES.includes(mode as KiSafeNavigationMode);
}

/**
 * Validate any navigation mode input
 */
export function validateNavigationMode(mode: string): mode is NavigationModeInput {
  return ALL_MODES.includes(mode as NavigationModeInput);
}

/**
 * Convert Legacy mode to KI-safe mode
 */
export function normalizeToKiSafe(mode: NavigationModeInput): KiSafeNavigationMode {
  if (isKiSafeMode(mode)) {
    return mode;
  }
  
  if (isLegacyMode(mode)) {
    return NAVIGATION_MODE_MAPPING[mode] as KiSafeNavigationMode;
  }
  
  console.warn(`[NavigationModeNormalization] Unknown mode: ${mode}, defaulting to mode-dashboard-view`);
  return 'mode-dashboard-view';
}

/**
 * Get user-friendly display name for navigation mode
 */
export function getNavigationModeDisplayName(mode: NavigationModeInput): string {
  const kiSafeMode = normalizeToKiSafe(mode);
  
  switch (kiSafeMode) {
    case 'mode-dashboard-view':
      return 'Dashboard View';
    case 'mode-data-panel':
      return 'Data Panel';
    case 'mode-compact-focus':
      return 'Compact Focus';
    default:
      return 'Unknown Mode';
  }
}

/**
 * Migration helper: Update user preferences from Legacy to KI-safe
 */
export interface UserNavigationPreference {
  userId: string;
  currentMode: NavigationModeInput;
  preferences?: Record<string, any>;
}

export function migrateUserPreferences(userPrefs: UserNavigationPreference[]): UserNavigationPreference[] {
  return userPrefs.map(userPref => ({
    ...userPref,
    currentMode: normalizeToKiSafe(userPref.currentMode)
  }));
}

/**
 * Database query helper: Get CSS Grid values for navigation mode
 */
export function getGridConfigForMode(mode: NavigationModeInput): {
  templateAreas: string;
  templateColumns: string;
  templateRows: string;
} {
  const kiSafeMode = normalizeToKiSafe(mode);
  
  const configs = {
    'mode-dashboard-view': {
      templateAreas: '"sidebar header" "sidebar main" "sidebar footer"',
      templateColumns: '240px 1fr',
      templateRows: '160px 1fr 60px' // Statistics header larger
    },
    'mode-data-panel': {
      templateAreas: '"sidebar header" "sidebar main" "sidebar footer"',
      templateColumns: '280px 1fr', // Wider sidebar for navigation
      templateRows: '160px 1fr 60px'
    },
    'mode-compact-focus': {
      templateAreas: '"sidebar header" "sidebar main" "sidebar footer"',
      templateColumns: '240px 1fr',
      templateRows: '36px 1fr 60px' // Minimal header
    }
  };
  
  return configs[kiSafeMode];
}

/**
 * CSS Variables helper: Generate CSS custom properties for navigation mode
 */
export function generateCssVariablesForMode(mode: NavigationModeInput): Record<string, string> {
  const kiSafeMode = normalizeToKiSafe(mode);
  const config = getGridConfigForMode(kiSafeMode);
  
  return {
    [`--db-${kiSafeMode}-grid-template-areas`]: config.templateAreas,
    [`--db-${kiSafeMode}-grid-template-columns`]: config.templateColumns,
    [`--db-${kiSafeMode}-grid-template-rows`]: config.templateRows
  };
}