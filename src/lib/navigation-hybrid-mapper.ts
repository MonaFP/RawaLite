/**
 * Navigation Hybrid-Mapping-Layer
 * 
 * PHASE 2: Dual-path SQL routing for Migration 034 (per-mode) vs 045 (global-mode)
 * 
 * Encapsulates all conditional SQL logic based on schema version,
 * providing clean abstractions for DatabaseNavigationService.
 * 
 * Uses convertSQLQuery() for field-mapper integration (camelCase ↔ snake_case)
 * All methods are transaction-safe and have graceful error handling.
 * 
 * @see database-schema-detector.ts for schema detection
 * @see DatabaseNavigationService for consumer
 */

import type Database from 'better-sqlite3';
import { convertSQLQuery, mapFromSQL } from './field-mapper';

export interface NavigationHybridResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * PHASE 2.1: Get Navigation Settings with Dual-Path Logic
 * 
 * Routes query based on schema version:
 * - Migration 034: Per-mode query with navigationMode parameter
 * - Migration 045: Global query without navigationMode
 * 
 * @param db - Database instance
 * @param schemaVersion - Detected schema version ("034", "045", or "unknown")
 * @param userId - User identifier
 * @param navigationMode - Optional mode selector (required for 034, ignored for 045)
 * @returns Mapped settings object or null if not found
 */
export function getNavigationSettingsBySchema(
  db: Database.Database,
  schemaVersion: string,
  userId: string,
  navigationMode?: string
): any {
  try {
    if (schemaVersion === '034') {
      // MIGRATION 034: Per-mode query with navigationMode parameter
      const effectiveMode = navigationMode || 'mode-dashboard-view';
      const sql = convertSQLQuery(
        'SELECT * FROM user_navigation_mode_settings WHERE user_id = ? AND navigation_mode = ?'
      );
      const stmt = db.prepare(sql);
      const row = stmt.get(userId, effectiveMode);
      return row ? mapFromSQL(row) : null;
    } else if (schemaVersion === '045') {
      // MIGRATION 045: Global query without navigationMode filter
      const sql = convertSQLQuery(
        'SELECT * FROM user_navigation_mode_settings WHERE user_id = ?'
      );
      const stmt = db.prepare(sql);
      const row = stmt.get(userId);
      return row ? mapFromSQL(row) : null;
    }

    return null; // Unknown schema
  } catch (error) {
    console.error('[navigationHybridMapper.getNavigationSettingsBySchema]', error);
    return null;
  }
}

/**
 * PHASE 2.2: Set Navigation Settings with Dual-Path Logic
 * 
 * Routes update based on schema version:
 * - Migration 034: Updates with navigationMode parameter
 * - Migration 045: Updates without navigationMode filter
 * 
 * Wrapped in transaction for atomicity.
 * 
 * @param db - Database instance
 * @param schemaVersion - Detected schema version
 * @param userId - User identifier
 * @param settings - Settings object to persist
 * @param navigationMode - Optional mode selector (required for 034, ignored for 045)
 * @returns true if update succeeded, false otherwise
 */
export function setNavigationSettingsBySchema(
  db: Database.Database,
  schemaVersion: string,
  userId: string,
  settings: Record<string, any>,
  navigationMode?: string
): boolean {
  try {
    return db.transaction(() => {
      try {
        if (schemaVersion === '034') {
          // MIGRATION 034: Per-mode update with navigationMode parameter
          const effectiveMode = navigationMode || 'mode-dashboard-view';
          const sql = convertSQLQuery(
            `UPDATE user_navigation_mode_settings 
             SET header_height = ?, sidebar_width = ?, auto_collapse = ?, 
                 remember_focus_mode = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ? AND navigation_mode = ?`
          );
          const stmt = db.prepare(sql);
          const result = stmt.run(
            settings.headerHeight ?? 160,
            settings.sidebarWidth ?? 200,
            settings.autoCollapse ? 1 : 0,
            settings.rememberFocusMode ? 1 : 0,
            userId,
            effectiveMode
          );
          return (result.changes ?? 0) > 0;
        } else if (schemaVersion === '045') {
          // MIGRATION 045: Global update without navigationMode
          const sql = convertSQLQuery(
            `UPDATE user_navigation_mode_settings 
             SET header_height = ?, sidebar_width = ?, auto_collapse = ?, 
                 remember_focus_mode = ?, default_navigation_mode = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ?`
          );
          const stmt = db.prepare(sql);
          const result = stmt.run(
            settings.headerHeight ?? 160,
            settings.sidebarWidth ?? 200,
            settings.autoCollapse ? 1 : 0,
            settings.rememberFocusMode ? 1 : 0,
            settings.navigationMode ?? 'mode-dashboard-view',
            userId
          );
          return (result.changes ?? 0) > 0;
        }

        return false;
      } catch (innerError) {
        console.error('[navigationHybridMapper.setNavigationSettingsBySchema] Inner error:', innerError);
        throw innerError; // Trigger transaction rollback
      }
    })();
  } catch (error) {
    console.error('[navigationHybridMapper.setNavigationSettingsBySchema] Transaction failed:', error);
    return false;
  }
}

/**
 * PHASE 2.3: Get All Mode Settings - MIGRATION 034 ONLY
 * 
 * Returns settings for ALL navigation modes (per-mode schema feature).
 * Only applicable for Migration 034 (per-mode schema).
 * Returns empty for Migration 045 (global-mode).
 * 
 * @param db - Database instance
 * @param schemaVersion - Detected schema version
 * @param userId - User identifier
 * @returns Map of navigation mode → settings or empty object
 */
export function getAllModeSettingsBySchema(
  db: Database.Database,
  schemaVersion: string,
  userId: string
): Record<string, any> {
  if (schemaVersion !== '034') {
    // Migration 045 doesn't support per-mode settings
    console.info('[navigationHybridMapper.getAllModeSettingsBySchema] Not applicable for schema 045 (global-mode)');
    return {};
  }

  try {
    return db.transaction(() => {
      try {
        const sql = convertSQLQuery(
          'SELECT * FROM user_navigation_mode_settings WHERE user_id = ?'
        );
        const stmt = db.prepare(sql);
        const results = stmt.all(userId) as any[];

        const modeSettings: Record<string, any> = {};
        for (const row of results) {
          const mapped = mapFromSQL(row);
          const mode = mapped.navigationMode;
          if (mode) {
            modeSettings[mode] = mapped;
          }
        }

        return modeSettings;
      } catch (innerError) {
        console.error('[navigationHybridMapper.getAllModeSettingsBySchema] Query failed:', innerError);
        throw innerError;
      }
    })();
  } catch (error) {
    console.error('[navigationHybridMapper.getAllModeSettingsBySchema] Transaction failed:', error);
    return {};
  }
}

/**
 * PHASE 2.4: Normalize Settings - Schema-Aware Data Normalization
 * 
 * Normalizes settings data to match the active schema version.
 * Removes or adds fields based on schema expectations.
 * 
 * @param schemaVersion - Detected schema version
 * @param settings - Raw settings object
 * @param defaults - Default values for fallback
 * @returns Normalized settings object
 */
export function normalizeSettingsBySchema(
  schemaVersion: string,
  settings: any,
  defaults: any
): Record<string, any> {
  try {
    const normalized = mapFromSQL(settings) || {};

    if (schemaVersion === '034') {
      // Migration 034: Requires navigationMode field
      if (!normalized.navigationMode) {
        normalized.navigationMode = 'mode-dashboard-view';
      }
    } else if (schemaVersion === '045') {
      // Migration 045: Uses defaultNavigationMode
      if (!normalized.navigationMode) {
        normalized.navigationMode = 'mode-dashboard-view';
      }
    }

    // Validate dimensions
    if (normalized.headerHeight) {
      normalized.headerHeight = Math.min(normalized.headerHeight, 300); // MAX_DIMENSIONS
    }
    if (normalized.sidebarWidth) {
      normalized.sidebarWidth = Math.min(normalized.sidebarWidth, 400); // MAX_DIMENSIONS
    }

    return normalized;
  } catch (error) {
    console.error('[navigationHybridMapper.normalizeSettingsBySchema]', error);
    return defaults || { navigationMode: 'mode-dashboard-view', headerHeight: 160, sidebarWidth: 200 };
  }
}

/**
 * PHASE 2.5: Validate Schema Version
 * 
 * Ensures schema is in valid state for hybrid operations.
 * 
 * @param schemaVersion - Detected schema version
 * @param isCorrupted - Whether schema was detected as corrupted
 * @returns true if schema is valid (034 or 045) and not corrupted
 */
export function validateSchemaVersionForOperations(
  schemaVersion: string,
  isCorrupted: boolean
): boolean {
  if (isCorrupted) {
    console.warn('[navigationHybridMapper.validateSchemaVersionForOperations] Schema is corrupted');
    return false;
  }

  if (schemaVersion === 'unknown') {
    console.warn('[navigationHybridMapper.validateSchemaVersionForOperations] Schema version is unknown');
    return false;
  }

  return schemaVersion === '034' || schemaVersion === '045';
}

/**
 * PHASE 2.6: Fallback Handler for Corrupted Schema
 * 
 * Returns safe defaults when schema is corrupted or unknown.
 * Used as graceful fallback throughout DatabaseNavigationService.
 * 
 * @param defaults - Default values object
 * @returns Safe default settings
 */
export function getFallbackSettings(defaults: any): Record<string, any> {
  return defaults || {
    navigationMode: 'mode-dashboard-view',
    headerHeight: 160,
    sidebarWidth: 200,
    autoCollapse: false,
    rememberFocusMode: true
  };
}
