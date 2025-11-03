/**
 * Database Schema Detector
 * 
 * Detects at runtime whether Migration 034 (per-mode) or Migration 045 (global-mode)
 * is active by inspecting the user_navigation_mode_settings table structure.
 * 
 * PRAGMA-based detection:
 * - Migration 034: 'navigation_mode' column EXISTS → Per-mode schema
 * - Migration 045: 'default_navigation_mode' column EXISTS → Global-mode schema
 * 
 * Usage:
 *   const result = detectDatabaseSchema(db);
 *   if (result.schemaVersion === "034") { ... per-mode logic ... }
 *   else if (result.schemaVersion === "045") { ... global logic ... }
 * 
 * @author RawaLite KI-SESSION-04.11.2025
 * @phase Phase 1: Schema Detection Logic
 */

import type Database from 'better-sqlite3';

/**
 * Result of schema detection
 * 
 * schemaVersion: "034" | "045" | "unknown"
 *   - "034": Migration 034 detected (per-mode with navigation_mode column)
 *   - "045": Migration 045 detected (global-mode with default_navigation_mode)
 *   - "unknown": Could not reliably detect (corrupted or unknown schema)
 * 
 * isCorrupted: boolean - Schema has issues (missing primary key, wrong types, etc.)
 * 
 * details: Object with detection metadata
 *   - columns: All column names found in table
 *   - primaryKeyExists: Whether id column has pk=1
 *   - columnTypes: Map of column names to their types
 */
export interface SchemaDetectionResult {
  schemaVersion: "034" | "045" | "unknown";
  hasNavigationModeColumn: boolean;
  isCorrupted: boolean;
  details: {
    columns: string[];
    primaryKeyExists: boolean;
    columnTypes: Record<string, string>;
  };
}

/**
 * Caching mechanism for schema detection results
 * PRAGMA queries are read-only and results don't change during session
 */
let cachedResult: SchemaDetectionResult | null = null;

/**
 * Detects database schema by examining table structure
 * 
 * CRITICAL: PRAGMA queries are read-only and safe - they don't modify data
 * 
 * Migration 034 Expected Columns:
 *   - id (INTEGER, PK)
 *   - user_id (TEXT, NOT NULL)
 *   - navigation_mode (TEXT) ← KEY INDICATOR
 *   - header_height (INTEGER, DEFAULT 160)
 *   - settings_data (TEXT)
 *   - created_at (TEXT)
 * 
 * Migration 045 Expected Columns:
 *   - id (INTEGER, PK)
 *   - user_id (TEXT, NOT NULL)
 *   - default_navigation_mode (TEXT, DEFAULT "header-navigation") ← KEY INDICATOR
 *   - header_height (INTEGER, DEFAULT 160)
 *   - settings_data (TEXT)
 *   - created_at (TEXT)
 * 
 * Edge Cases Handled:
 *   - Table doesn't exist → Returns "unknown" + isCorrupted: true
 *   - Missing primary key → Returns "unknown" + isCorrupted: true
 *   - Wrong column types → Returns "unknown" + isCorrupted: true
 *   - Partial match → Returns "unknown" + isCorrupted: true
 * 
 * @param db - better-sqlite3 Database instance
 * @returns SchemaDetectionResult with version and metadata
 * 
 * @throws Does not throw - returns "unknown" with isCorrupted: true on error
 */
export function detectDatabaseSchema(db: Database.Database): SchemaDetectionResult {
  // Return cached result if available
  if (cachedResult !== null) {
    console.log('[SchemaDetector] Using cached schema version:', cachedResult.schemaVersion);
    return cachedResult;
  }

  try {
    // PRAGMA table_info returns array of column info objects
    // Each object: { cid, name, type, notnull, dflt_value, pk }
    const tableInfo = db.pragma('table_info(user_navigation_mode_settings)', {
      simple: false
    }) as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    }>;

    // Extract column information
    const columnNames = tableInfo.map((col) => col.name);
    const hasNavigationModeColumn = columnNames.includes('navigation_mode');
    const hasDefaultNavigationModeColumn = columnNames.includes('default_navigation_mode');
    const primaryKeyExists = tableInfo.some((col) => col.pk === 1);

    // Build column type map for validation
    const columnTypes = Object.fromEntries(
      tableInfo.map((col) => [col.name, col.type])
    );

    console.log('[SchemaDetector] Detected columns:', columnNames);
    console.log('[SchemaDetector] Has navigation_mode:', hasNavigationModeColumn);
    console.log('[SchemaDetector] Has default_navigation_mode:', hasDefaultNavigationModeColumn);
    console.log('[SchemaDetector] Primary key exists:', primaryKeyExists);

    // Determine schema version
    let schemaVersion: "034" | "045" | "unknown" = "unknown";
    let isCorrupted = false;

    // Migration 034: Has navigation_mode column
    if (hasNavigationModeColumn && !hasDefaultNavigationModeColumn) {
      schemaVersion = "034";
      console.log('[SchemaDetector] Schema Version 034 detected (per-mode)');
    }
    // Migration 045: Has default_navigation_mode column (not navigation_mode)
    else if (!hasNavigationModeColumn && hasDefaultNavigationModeColumn) {
      schemaVersion = "045";
      console.log('[SchemaDetector] Schema Version 045 detected (global-mode)');
    }
    // Partial match or unknown combination
    else if (hasNavigationModeColumn && hasDefaultNavigationModeColumn) {
      console.warn('[SchemaDetector] Both navigation_mode AND default_navigation_mode present - partial match');
      schemaVersion = "unknown";
    } else {
      console.warn('[SchemaDetector] Neither navigation_mode nor default_navigation_mode found');
      schemaVersion = "unknown";
    }

    // Check for corruption indicators
    // Schema is corrupted if:
    // 1. Primary key missing
    // 2. Schema is unknown
    // 3. Expected column types are wrong
    if (!primaryKeyExists) {
      console.error('[SchemaDetector] PRIMARY KEY MISSING - Schema corrupted!');
      isCorrupted = true;
    }
    if (schemaVersion === "unknown") {
      isCorrupted = true;
    }
    // For known schema, verify column types
    if (schemaVersion === "034" && hasNavigationModeColumn) {
      const navModeType = columnTypes['navigation_mode'];
      if (navModeType && navModeType.toUpperCase() !== 'TEXT') {
        console.warn('[SchemaDetector] Wrong type for navigation_mode:', navModeType);
        isCorrupted = true;
      }
    }
    if (schemaVersion === "045" && hasDefaultNavigationModeColumn) {
      const navModeType = columnTypes['default_navigation_mode'];
      if (navModeType && navModeType.toUpperCase() !== 'TEXT') {
        console.warn('[SchemaDetector] Wrong type for default_navigation_mode:', navModeType);
        isCorrupted = true;
      }
    }

    // Build result
    cachedResult = {
      schemaVersion,
      hasNavigationModeColumn,
      isCorrupted,
      details: {
        columns: columnNames,
        primaryKeyExists,
        columnTypes
      }
    };

    console.log('[SchemaDetector] Detection complete:', {
      version: schemaVersion,
      corrupted: isCorrupted
    });

    return cachedResult;
  } catch (error) {
    console.error('[SchemaDetector] Error during detection:', error);

    // If PRAGMA query fails, schema is unknown/corrupted
    // Don't throw - return safe "unknown" result
    cachedResult = {
      schemaVersion: "unknown",
      hasNavigationModeColumn: false,
      isCorrupted: true,
      details: {
        columns: [],
        primaryKeyExists: false,
        columnTypes: {}
      }
    };

    return cachedResult;
  }
}

/**
 * Clear the cached schema detection result
 * 
 * Useful for testing or if database is known to have changed
 * 
 * @internal - Should only be called in tests or special scenarios
 */
export function clearSchemaCache(): void {
  console.log('[SchemaDetector] Cache cleared');
  cachedResult = null;
}

/**
 * Get the cached schema version without re-running detection
 * 
 * @returns Cached result or undefined if not yet detected
 */
export function getCachedSchema(): SchemaDetectionResult | undefined {
  return cachedResult || undefined;
}
