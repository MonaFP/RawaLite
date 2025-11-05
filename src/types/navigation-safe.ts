/**
 * Navigation-Safe Type Definitions
 * 
 * Type guards and utilities for safe navigation mode handling
 * Compatible with AKTUELL electron/ipc patterns
 * 
 * @since v1.0.48+ (KOPIE + navigation-safe types)
 */

/**
 * Valid navigation modes in the system
 */
export type NavigationMode = 'header-statistics' | 'header-navigation' | 'full-sidebar';

/**
 * KI-Safe navigation mode type (alias for consistency with IPC)
 */
export type KiSafeNavigationMode = NavigationMode;

/**
 * Input type that can be normalized to safe mode
 */
export type NavigationModeInput = string | NavigationMode | KiSafeNavigationMode;

/**
 * Array of safe navigation modes
 */
export const NAVIGATION_MODES_SAFE: KiSafeNavigationMode[] = [
  'header-statistics',
  'header-navigation',
  'full-sidebar'
];

/**
 * Normalize any input to a safe navigation mode with fallback
 */
export const normalizeToKiSafe = (value: NavigationModeInput, fallback: NavigationMode = 'header-navigation'): NavigationMode => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.toLowerCase().trim();
  
  // Map common aliases to safe modes
  const modeMap: Record<string, NavigationMode> = {
    'header-statistics': 'header-statistics',
    'statistics': 'header-statistics',
    'stats': 'header-statistics',
    'header-navigation': 'header-navigation',
    'navigation': 'header-navigation',
    'header': 'header-navigation',
    'full-sidebar': 'full-sidebar',
    'sidebar': 'full-sidebar',
    'fullsidebar': 'full-sidebar'
  };

  return modeMap[normalized] ?? fallback;
};

/**
 * Type guard for valid navigation modes
 */
export const isValidNavigationMode = (value: unknown): value is NavigationMode => {
  return typeof value === 'string' && ['header-statistics', 'header-navigation', 'full-sidebar'].includes(value);
};

/**
 * Safe mode conversion with fallback
 */
export const getSafeNavigationMode = (mode: unknown, fallback: NavigationMode = 'header-navigation'): NavigationMode => {
  return isValidNavigationMode(mode) ? mode : fallback;
};

/**
 * Navigation mode metadata
 */
export interface NavigationModeConfig {
  key: NavigationMode;
  label: string;
  description: string;
  defaultHeaderHeight: number;
  minHeaderHeight: number;
  maxHeaderHeight: number;
  layoutType: 'compact' | 'balanced' | 'spacious';
}

/**
 * All available navigation modes with their configurations
 */
export const NAVIGATION_MODE_CONFIGS: Record<NavigationMode, NavigationModeConfig> = {
  'header-statistics': {
    key: 'header-statistics',
    label: 'Header mit Statistiken',
    description: 'Compact header showing key statistics',
    defaultHeaderHeight: 90,
    minHeaderHeight: 60,
    maxHeaderHeight: 120,
    layoutType: 'compact'
  },
  'header-navigation': {
    key: 'header-navigation',
    label: 'Header mit Navigation',
    description: 'Full header with navigation menu',
    defaultHeaderHeight: 160,
    minHeaderHeight: 120,
    maxHeaderHeight: 220,
    layoutType: 'balanced'
  },
  'full-sidebar': {
    key: 'full-sidebar',
    label: 'Vollständige Sidebar',
    description: 'Full sidebar navigation layout',
    defaultHeaderHeight: 60,
    minHeaderHeight: 40,
    maxHeaderHeight: 100,
    layoutType: 'spacious'
  }
};

/**
 * Get default header height for a navigation mode
 */
export const getDefaultHeaderHeight = (mode: NavigationMode): number => {
  return NAVIGATION_MODE_CONFIGS[mode]?.defaultHeaderHeight ?? 160;
};

/**
 * Validate header height for a navigation mode
 */
export const isValidHeaderHeight = (mode: NavigationMode, height: number): boolean => {
  const config = NAVIGATION_MODE_CONFIGS[mode];
  return height >= config.minHeaderHeight && height <= config.maxHeaderHeight;
};

/**
 * Constrain header height to valid range for a navigation mode
 */
export const constrainHeaderHeight = (mode: NavigationMode, height: number): number => {
  const config = NAVIGATION_MODE_CONFIGS[mode];
  return Math.max(config.minHeaderHeight, Math.min(height, config.maxHeaderHeight));
};

export default {
  isValidNavigationMode,
  getSafeNavigationMode,
  normalizeToKiSafe,
  NAVIGATION_MODES_SAFE,
  NAVIGATION_MODE_CONFIGS,
  getDefaultHeaderHeight,
  isValidHeaderHeight,
  constrainHeaderHeight
};
