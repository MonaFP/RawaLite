/**
 * Migration 042: Convert Legacy Navigation Modes to KI-Safe Modes
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
  console.log('[Migration 042] Converting legacy navigation modes to KI-safe modes...');
  
  // Legacy to KI-safe mode mapping
  const MODE_CONVERSION = {
    'header-statistics': 'mode-dashboard-view',
    'header-navigation': 'mode-data-panel',
    'full-sidebar': 'mode-compact-focus'
  };
  
  // Begin transaction for atomicity
  db.exec('BEGIN TRANSACTION');
  
  try {
    // 1. Convert user_navigation_preferences.navigation_mode
    console.log('[Migration 042] Converting user_navigation_preferences...');
    Object.entries(MODE_CONVERSION).forEach(([legacy, kiSafe]) => {
      const result = db.prepare(`
        UPDATE user_navigation_preferences 
        SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = ?
      `).run(kiSafe, legacy);
      
      if (result.changes > 0) {
        console.log(`[Migration 042] ✅ Converted ${result.changes} records: ${legacy} → ${kiSafe}`);
      }
    });
    
    // 2. Convert user_navigation_mode_settings.navigation_mode
    console.log('[Migration 042] Converting user_navigation_mode_settings...');
    Object.entries(MODE_CONVERSION).forEach(([legacy, kiSafe]) => {
      const result = db.prepare(`
        UPDATE user_navigation_mode_settings 
        SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = ?
      `).run(kiSafe, legacy);
      
      if (result.changes > 0) {
        console.log(`[Migration 042] ✅ Converted ${result.changes} records: ${legacy} → ${kiSafe}`);
      }
    });
    
    // 3. Convert navigation_mode_history (both previous_mode and new_mode)
    console.log('[Migration 042] Converting navigation_mode_history...');
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
        console.log(`[Migration 042] ✅ Converted history: ${legacy} → ${kiSafe} (prev: ${prevResult.changes}, new: ${newResult.changes})`);
      }
    });
    
    // 4. Convert user_footer_content_preferences.navigation_mode
    console.log('[Migration 042] Converting user_footer_content_preferences...');
    Object.entries(MODE_CONVERSION).forEach(([legacy, kiSafe]) => {
      const result = db.prepare(`
        UPDATE user_footer_content_preferences 
        SET navigation_mode = ?, updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = ?
      `).run(kiSafe, legacy);
      
      if (result.changes > 0) {
        console.log(`[Migration 042] ✅ Converted ${result.changes} footer preferences: ${legacy} → ${kiSafe}`);
      }
    });
    
    // 5. Verify conversion completed
    console.log('[Migration 042] Verifying conversion...');
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
      console.error('[Migration 042] ❌ Legacy modes still found after conversion:');
      remainingLegacy.forEach((row: any) => {
        console.error(`  - ${row.table_name}: ${row.mode}`);
      });
      throw new Error('Legacy mode conversion incomplete');
    }
    
    // Commit transaction
    db.exec('COMMIT');
    console.log('[Migration 042] ✅ Legacy navigation mode conversion completed successfully');
    
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[Migration 042] ❌ Migration failed, rolling back:', error);
    throw error;
  }
}

export function down(db: Database): void {
  console.log('[Migration 042] Rolling back KI-safe modes to legacy modes...');
  
  // KI-safe to legacy mode mapping (reverse)
  const REVERSE_CONVERSION = {
    'mode-dashboard-view': 'header-statistics',
    'mode-data-panel': 'header-navigation',
    'mode-compact-focus': 'full-sidebar'
  };
  
  // Begin transaction for atomicity
  db.exec('BEGIN TRANSACTION');
  
  try {
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
      
      console.log(`[Migration 042] Reverted: ${kiSafe} → ${legacy}`);
    });
    
    db.exec('COMMIT');
    console.log('[Migration 042] ✅ Rollback completed successfully');
    
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[Migration 042] ❌ Rollback failed:', error);
    throw error;
  }
}