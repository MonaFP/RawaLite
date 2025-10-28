/**
 * Saubere Navigation Types - Legacy ISOLATION
 * 
 * ✅ STRATEGIE: Legacy darf NICHT "mitlaufen"
 * - Legacy existiert NUR im Kompatibilitäts-/Migrationsrand
 * - UI/Services arbeiten AUSSCHLIESSLICH mit KI-Safe Modes
 * - Normalisierung erfolgt an DB-Read/IPC-Eingang
 * 
 * @version 1.0.59
 * @date 2025-10-24
 * @author GitHub Copilot (KI-SESSION-BRIEFING compliant)
 */

// ✅ PRIMÄRE KI-SAFE TYPES (öffentlich verwendet)
export type KiSafeNavigationMode =
  | 'mode-dashboard-view'
  | 'mode-data-panel'
  | 'mode-compact-focus';

// ✅ LEGACY TYPES (NUR für Kompatibilität - NICHT re-exportieren in UI/Services)
type LegacyNavigationMode =
  | 'header-statistics'
  | 'header-navigation'
  | 'full-sidebar';

// ✅ IPC-EINGANG (optional): akzeptiert beides, aber normalisiert sofort
export type NavigationModeInput = KiSafeNavigationMode | LegacyNavigationMode;

// ✅ KI-SAFE MODES LIST (einzige öffentlich genutzte Liste)
export const NAVIGATION_MODES_SAFE: readonly KiSafeNavigationMode[] = [
  'mode-dashboard-view',
  'mode-data-panel', 
  'mode-compact-focus'
] as const;

// ✅ EINZIGER ÖFFENTLICH GENUTZTER GUARD
export function isValidNavigationMode(x: unknown): x is KiSafeNavigationMode {
  return typeof x === 'string' && (NAVIGATION_MODES_SAFE as readonly string[]).includes(x);
}

// ✅ LEGACY GUARD (für interne Kompatibilität)
export function isLegacyNavigationMode(x: unknown): x is LegacyNavigationMode {
  return typeof x === 'string' && ['header-statistics', 'header-navigation', 'full-sidebar'].includes(x);
}

// ✅ KOMPATIBILITÄTS-SCHICHT (schmale Schicht am DB-Read/IPC-Eingang)

/**
 * Normalisiert Legacy → KI-Safe (EINGANG zur App)
 * Wird nur an DB-Read und IPC-Eingang verwendet
 */
export function normalizeToKiSafe(input: NavigationModeInput): KiSafeNavigationMode {
  // Bereits KI-Safe → pass through
  if (isValidNavigationMode(input)) {
    return input;
  }
  
  // Legacy → KI-Safe normalisieren
  if (isLegacyNavigationMode(input)) {
    const legacyMapping: Record<LegacyNavigationMode, KiSafeNavigationMode> = {
      'header-statistics': 'mode-dashboard-view',
      'header-navigation': 'mode-data-panel',
      'full-sidebar': 'mode-compact-focus'
    };
    return legacyMapping[input];
  }
  
  // Fallback für unbekannte Werte
  console.warn(`[Navigation] Unknown navigation mode: ${input}, falling back to mode-dashboard-view`);
  return 'mode-dashboard-view';
}

// ✅ TYPE ALIASES (für saubere Migration)
export type NavigationMode = KiSafeNavigationMode;  // Primary type für alle UI/Services
export const NAVIGATION_MODES = NAVIGATION_MODES_SAFE;  // Primary list für alle UI/Services

// ✅ VALIDATION HELPERS für Service Layer
export function validateNavigationMode(mode: unknown): KiSafeNavigationMode {
  if (isValidNavigationMode(mode)) {
    return mode;
  }
  
  // Versuche Legacy-Normalisierung
  if (typeof mode === 'string') {
    return normalizeToKiSafe(mode as NavigationModeInput);
  }
  
  // Ultimate fallback
  return 'mode-dashboard-view';
}

/**
 * Type guard für NavigationModeInput (IPC usage)
 */
export function isNavigationModeInput(x: unknown): x is NavigationModeInput {
  return isValidNavigationMode(x) || isLegacyNavigationMode(x);
}

// ✅ DEFAULT WERTE
export const DEFAULT_NAVIGATION_MODE: KiSafeNavigationMode = 'mode-dashboard-view';

// ✅ MODE DESCRIPTIONS (für UI)
export const NAVIGATION_MODE_DESCRIPTIONS: Record<KiSafeNavigationMode, string> = {
  'mode-dashboard-view': 'Dashboard View - Übersichtliche Darstellung mit Statistiken',
  'mode-data-panel': 'Data Panel - Erweiterte Datenansicht mit Navigation',
  'mode-compact-focus': 'Compact Focus - Minimale Oberfläche für konzentriertes Arbeiten'
};

// ✅ MODE ICONS (für UI)
export const NAVIGATION_MODE_ICONS: Record<KiSafeNavigationMode, string> = {
  'mode-dashboard-view': '📊',
  'mode-data-panel': '📋', 
  'mode-compact-focus': '🎯'
};

/**
 * ✅ EXPORT SUMMARY für clean imports:
 * 
 * PRIMARY TYPES:
 * - KiSafeNavigationMode (main type)
 * - NavigationMode (alias für KiSafeNavigationMode)
 * - NavigationModeInput (IPC usage)
 * 
 * PRIMARY FUNCTIONS:
 * - isValidNavigationMode()
 * - normalizeToKiSafe()
 * - validateNavigationMode()
 * 
 * PRIMARY CONSTANTS:
 * - NAVIGATION_MODES_SAFE
 * - NAVIGATION_MODES (alias)
 * - DEFAULT_NAVIGATION_MODE
 * 
 * UI HELPERS:
 * - NAVIGATION_MODE_DESCRIPTIONS
 * - NAVIGATION_MODE_ICONS
 */