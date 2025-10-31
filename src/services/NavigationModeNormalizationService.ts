/**
 * NavigationModeNormalizationService.ts
 * 
 * ✅ LEGACY CLEANUP COMPLETE: Simplified to essential display functionality only
 * ✅ CORE RULES COMPLIANT: Uses navigation-safe.ts as single source of truth
 * 
 * Purpose: User-friendly navigation mode display names
 * Architecture: Single responsibility - display only
 * 
 * @since v1.0.67 (Legacy cleanup completed)
 * @date 2025-10-29
 */

import { NavigationMode, NAVIGATION_MODE_DESCRIPTIONS } from '../types/navigation-safe';

/**
 * Get user-friendly display name for navigation mode
 * ✅ CORE RULES COMPLIANT: Uses navigation-safe.ts types and descriptions
 */
export function getNavigationModeDisplayName(mode: NavigationMode): string {
  return NAVIGATION_MODE_DESCRIPTIONS[mode] || mode;
}

// ✅ LEGACY DEBT REMOVED: All complex conversion logic eliminated
// ✅ LEGACY DEBT REMOVED: No more NAVIGATION_MODE_MAPPING pollution  
// ✅ LEGACY DEBT REMOVED: No more duplicate type definitions
// ✅ LEGACY DEBT REMOVED: No more migration helper functions
// ✅ ARCHITECTURE: Use navigation-safe.ts for any normalization needs