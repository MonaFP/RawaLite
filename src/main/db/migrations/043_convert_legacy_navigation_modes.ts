/**
 * Migration 043: Convert Legacy Navigation Modes to KI-Safe Modes
 * 
 * PROBLEM: After Phase 3.3 service-layer migration, database still contains
 * legacy mode values: 'header-statistics', 'header-navigation', 'full-sidebar'
 * 
 * SOLUTION: Convert all legacy values in navigation tables to KI-safe modes:
 * - 'header-statistics' → 'mode-dashboard-view'
 * - 'header-navigation' → 'mode-data-panel'  
 * - 'full-sidebar' → 'mode-compact-focus'
 * 
 * CRITICAL: This migration ensures consistency between service-layer (Phase 3.3)
 * and database values to prevent runtime errors.
 * 
 * @since v1.0.58 (Phase 3.5: Database Migration Consistency)
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('[Migration 043] Converting legacy navigation modes to KI-safe modes...');
  
  // Legacy to KI-safe mode mapping
  const MODE_CONVERSION: Record<string, string> = {
    'header-statistics': 'mode-dashboard-view',
    'header-navigation': 'mode-data-panel',
    'full-sidebar': 'mode-compact-focus'
  };
  
  // Note: Transaction is already managed by MigrationService
  // DO NOT use BEGIN TRANSACTION here - it causes nested transaction error
  
  // CRITICAL FIX: user_navigation_preferences has CHECK constraint with OLD modes
  // We must recreate the table with NEW check constraint BEFORE updating values
  
  console.log('[Migration 043] Step 1: Recreating user_navigation_preferences with new CHECK constraint...');
  
  // 1. Create new table with KI-safe CHECK constraint
  // CRITICAL: Schema 43 has no 'users' table, so we must NOT include FOREIGN KEY
  db.exec(`
    CREATE TABLE user_navigation_preferences_new (
      user_id TEXT NOT NULL PRIMARY KEY,
      navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')) DEFAULT 'mode-data-panel',
      header_height TEXT DEFAULT '160px',
      sidebar_width INTEGER DEFAULT 280,
      auto_collapse BOOLEAN DEFAULT FALSE,
      remember_focus_mode BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 2. Copy data with mode conversion - CRITICAL: Must convert VALUES when copying
  // This happens DURING the table copy, so the new table gets the converted values immediately
  console.log('[Migration 043] Step 2: Migrating data with mode conversion...');
  db.exec(`
    INSERT INTO user_navigation_preferences_new (user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
    SELECT 
      user_id,
      CASE navigation_mode
        WHEN 'header-statistics' THEN 'mode-dashboard-view'
        WHEN 'header-navigation' THEN 'mode-data-panel'
        WHEN 'full-sidebar' THEN 'mode-compact-focus'
        ELSE navigation_mode
      END as navigation_mode,
      COALESCE(header_height, '160px') as header_height,
      COALESCE(sidebar_width, 280) as sidebar_width,
      COALESCE(auto_collapse, FALSE) as auto_collapse,
      COALESCE(remember_focus_mode, TRUE) as remember_focus_mode,
      created_at,
      CURRENT_TIMESTAMP
    FROM user_navigation_preferences
  `);
  
  // 3. Replace old table
  db.exec('DROP TABLE user_navigation_preferences');
  db.exec('ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences');
  
  console.log('[Migration 043] ✅ user_navigation_preferences recreated with new CHECK constraint and values converted');
  
  // 4. Convert user_navigation_mode_settings.navigation_mode
  // CRITICAL: This table ALSO has the old CHECK constraint - must recreate it too
  console.log('[Migration 043] Step 3: Recreating user_navigation_mode_settings with new CHECK constraint...');
  
  const modeSettingsExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user_navigation_mode_settings'
  `).get();
  
  if (modeSettingsExists) {
    // Recreate with new constraint
    db.exec(`
      CREATE TABLE user_navigation_mode_settings_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
        header_height INTEGER NOT NULL DEFAULT 160 CHECK (header_height >= 36 AND header_height <= 220),
        sidebar_width INTEGER NOT NULL DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
        auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
        remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
        mobile_breakpoint INTEGER NOT NULL DEFAULT 768 CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
        tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
        grid_template_columns TEXT NULL,
        grid_template_rows TEXT NULL,
        grid_template_areas TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, navigation_mode)
      )
    `);
    
    // Copy data with conversion
    db.exec(`
      INSERT INTO user_navigation_mode_settings_new 
      SELECT 
        id,
        user_id,
        CASE navigation_mode
          WHEN 'header-statistics' THEN 'mode-dashboard-view'
          WHEN 'header-navigation' THEN 'mode-data-panel'
          WHEN 'full-sidebar' THEN 'mode-compact-focus'
          ELSE navigation_mode
        END as navigation_mode,
        header_height,
        sidebar_width,
        auto_collapse_mobile,
        auto_collapse_tablet,
        remember_dimensions,
        mobile_breakpoint,
        tablet_breakpoint,
        grid_template_columns,
        grid_template_rows,
        grid_template_areas,
        created_at,
        updated_at
      FROM user_navigation_mode_settings
    `);
    
    db.exec('DROP TABLE user_navigation_mode_settings');
    db.exec('ALTER TABLE user_navigation_mode_settings_new RENAME TO user_navigation_mode_settings');
    
    console.log('[Migration 043] ✅ user_navigation_mode_settings recreated with new CHECK constraint and values converted');
  }
  
  // 5. Convert navigation_mode_history (both previous_mode and new_mode)
  console.log('[Migration 043] Step 4: Converting navigation_mode_history...');
  const historyExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='navigation_mode_history'
  `).get();
  
  if (historyExists) {
    Object.entries(MODE_CONVERSION).forEach(([legacy, kiSafe]) => {
      // Convert previous_mode
      const prevResult = db.prepare(`
        UPDATE navigation_mode_history 
        SET previous_mode = ?
        WHERE previous_mode = ?
      `).run(kiSafe, legacy);
      
      // Convert new_mode
      const newResult = db.prepare(`
        UPDATE navigation_mode_history 
        SET new_mode = ?
        WHERE new_mode = ?
      `).run(kiSafe, legacy);
      
      if (prevResult.changes > 0 || newResult.changes > 0) {
        console.log(`[Migration 043] ✅ Converted history: ${legacy} → ${kiSafe} (prev: ${prevResult.changes}, new: ${newResult.changes})`);
      }
    });
  }
  
  // 6. Convert user_footer_content_preferences.navigation_mode
  console.log('[Migration 043] Step 5: Converting user_footer_content_preferences...');
  const footerExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user_footer_content_preferences'
  `).get();
  
  if (footerExists) {
    Object.entries(MODE_CONVERSION).forEach(([legacy, kiSafe]) => {
      const result = db.prepare(`
        UPDATE user_footer_content_preferences 
        SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = ?
      `).run(kiSafe, legacy);
      
      if (result.changes > 0) {
        console.log(`[Migration 043] ✅ Converted ${result.changes} footer preferences: ${legacy} → ${kiSafe}`);
      }
    });
  }
  
  // 7. Verify conversion completed
  console.log('[Migration 043] Step 6: Verifying conversion...');
  const remainingLegacy = db.prepare(`
    SELECT 
      'user_navigation_preferences' as table_name, navigation_mode as mode FROM user_navigation_preferences 
      WHERE navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')
    UNION ALL
    SELECT 
      'user_navigation_mode_settings' as table_name, navigation_mode as mode FROM user_navigation_mode_settings 
      WHERE navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')  
    UNION ALL
    SELECT 
      'navigation_mode_history_prev' as table_name, previous_mode as mode FROM navigation_mode_history 
      WHERE previous_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')
    UNION ALL
    SELECT 
      'navigation_mode_history_new' as table_name, new_mode as mode FROM navigation_mode_history 
      WHERE new_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')
    UNION ALL
    SELECT 
      'user_footer_content_preferences' as table_name, navigation_mode as mode FROM user_footer_content_preferences 
      WHERE navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')
  `).all();
  
  if (remainingLegacy.length > 0) {
    console.error('[Migration 043] ❌ Legacy modes still found after conversion:');
    remainingLegacy.forEach((row: any) => {
      console.error(`  - ${row.table_name}: ${row.mode}`);
    });
    throw new Error('Legacy mode conversion incomplete');
  }
  
  console.log('[Migration 043] ✅ Legacy navigation mode conversion completed successfully');
}

export function down(db: Database): void {
  console.log('[Migration 043] Rolling back KI-safe modes to legacy modes...');
  
  // KI-safe to legacy mode mapping (reverse)
  const REVERSE_CONVERSION = {
    'mode-dashboard-view': 'header-statistics',
    'mode-data-panel': 'header-navigation',
    'mode-compact-focus': 'full-sidebar'
  };
  
  // Note: Transaction is already managed by MigrationService
  
  // Reverse all conversions in the same order
  Object.entries(REVERSE_CONVERSION).forEach(([kiSafe, legacy]) => {
    // 1. Revert user_navigation_preferences
    db.prepare(`
      UPDATE user_navigation_preferences 
      SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = ?
    `).run(legacy, kiSafe);
    
    // 2. Revert user_navigation_mode_settings
    db.prepare(`
      UPDATE user_navigation_mode_settings 
      SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP  
      WHERE navigation_mode = ?
    `).run(legacy, kiSafe);
    
    // 3. Revert navigation_mode_history
    db.prepare(`
      UPDATE navigation_mode_history 
      SET previous_mode = ?
      WHERE previous_mode = ?
    `).run(legacy, kiSafe);
    
    db.prepare(`
      UPDATE navigation_mode_history 
      SET new_mode = ?
      WHERE new_mode = ?
    `).run(legacy, kiSafe);
    
    // 4. Revert user_footer_content_preferences
    db.prepare(`
      UPDATE user_footer_content_preferences 
      SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = ?
    `).run(legacy, kiSafe);
    
    console.log(`[Migration 043] Reverted: ${kiSafe} → ${legacy}`);
  });
  
  console.log('[Migration 043] ✅ Rollback completed successfully');
}