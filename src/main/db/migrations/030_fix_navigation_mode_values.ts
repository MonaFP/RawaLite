/**
 * Migration 030: Fix Navigation Mode Values
 * 
 * CRITICAL FIX: Migration 028 used incorrect navigation mode values.
 * This migration corrects the CHECK constraints and updates existing data.
 * 
 * From: ['header', 'sidebar', 'full-sidebar'] (INCORRECT)
 * To:   ['header-statistics', 'header-navigation', 'full-sidebar'] (CORRECT)
 * 
 * @see docs/04-ui/final/LESSON_FIX-THEME-DATABASE-SYSTEM-CRITICAL-FAILURE-2025-10-20.md
 */

import type { Database } from 'better-sqlite3';

/**
 * Apply migration: Fix navigation mode values and constraints
 */
export const up = (db: Database): void => {
  console.log('🔧 [Migration 030] Fixing Navigation Mode Values...');
  
  // Step 1: Create new table with correct constraints
  console.log('🔧 [Migration 030] Creating corrected user_navigation_preferences...');
  db.exec(`
    CREATE TABLE user_navigation_preferences_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default' UNIQUE NOT NULL,
      navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
      header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 120),
      sidebar_width INTEGER DEFAULT 240 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
      auto_collapse INTEGER DEFAULT 0 CHECK (auto_collapse IN (0, 1)),
      remember_focus_mode INTEGER DEFAULT 1 CHECK (remember_focus_mode IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Step 2: Migrate existing data with value correction
  console.log('🔧 [Migration 030] Migrating existing navigation preferences...');
  db.exec(`
    INSERT INTO user_navigation_preferences_new (
      id, user_id, navigation_mode, header_height, sidebar_width, 
      auto_collapse, remember_focus_mode, created_at, updated_at
    )
    SELECT 
      id, 
      user_id,
      CASE 
        WHEN navigation_mode = 'header' THEN 'header-statistics'
        WHEN navigation_mode = 'sidebar' THEN 'header-navigation'
        WHEN navigation_mode = 'full-sidebar' THEN 'full-sidebar'
        ELSE 'header-navigation'  -- Default fallback
      END as navigation_mode,
      header_height,
      sidebar_width,
      auto_collapse,
      remember_focus_mode,
      created_at,
      updated_at
    FROM user_navigation_preferences
  `);
  
  // Step 3: Replace old table
  console.log('🔧 [Migration 030] Replacing old navigation preferences table...');
  db.exec(`DROP TABLE user_navigation_preferences`);
  db.exec(`ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences`);
  
  // Step 4: Fix navigation_mode_history table constraints
  console.log('🔧 [Migration 030] Fixing navigation_mode_history constraints...');
  db.exec(`
    CREATE TABLE navigation_mode_history_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      previous_mode TEXT CHECK (previous_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
      new_mode TEXT NOT NULL CHECK (new_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT,
      FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
    )
  `);
  
  // Migrate history data with value correction
  db.exec(`
    INSERT INTO navigation_mode_history_new (
      id, user_id, previous_mode, new_mode, changed_at, session_id
    )
    SELECT 
      id, 
      user_id,
      CASE 
        WHEN previous_mode = 'header' THEN 'header-statistics'
        WHEN previous_mode = 'sidebar' THEN 'header-navigation'  
        WHEN previous_mode = 'full-sidebar' THEN 'full-sidebar'
        ELSE previous_mode
      END as previous_mode,
      CASE 
        WHEN new_mode = 'header' THEN 'header-statistics'
        WHEN new_mode = 'sidebar' THEN 'header-navigation'
        WHEN new_mode = 'full-sidebar' THEN 'full-sidebar'
        ELSE 'header-navigation'
      END as new_mode,
      changed_at,
      session_id
    FROM navigation_mode_history
  `);
  
  // Replace old history table
  db.exec(`DROP TABLE navigation_mode_history`);
  db.exec(`ALTER TABLE navigation_mode_history_new RENAME TO navigation_mode_history`);
  
  // Step 5: Recreate indexes with correct names
  console.log('🔧 [Migration 030] Recreating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_preferences_user_id ON user_navigation_preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_navigation_preferences_navigation_mode ON user_navigation_preferences(navigation_mode);
    CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_user_id ON navigation_mode_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_changed_at ON navigation_mode_history(changed_at);
  `);
  
  console.log('✅ [Migration 030] Navigation mode values fixed successfully');
  console.log('   - header -> header-statistics');
  console.log('   - sidebar -> header-navigation');  
  console.log('   - full-sidebar -> full-sidebar (unchanged)');
};

/**
 * Rollback migration: Restore original navigation mode values
 */
export const down = (db: Database): void => {
  console.log('⏪ [Migration 030] Rolling back navigation mode fixes...');
  
  // This rollback would restore the incorrect values, which is not recommended
  // Instead, we log a warning and keep the corrected values
  console.warn('⚠️ [Migration 030] Rollback not recommended - would restore incorrect navigation mode values');
  console.warn('   If rollback is necessary, manually recreate Migration 028 tables');
  
  throw new Error('Migration 030 rollback not supported - would restore incorrect navigation mode values');
};