/**
 * Migration 039: Fix full-sidebar header height to 36px
 * 
 * This migration corrects the full-sidebar header height from 72px to 36px
 * to match the updated SYSTEM_DEFAULTS and CSS fallback values.
 * 
 * Previous migrations (037/038) set full-sidebar to 72px, but the new
 * requirement is 36px (50% reduction from original 72px).
 * 
 * @version 1.0.48
 * @date 2025-01-12
 */

import { Database } from 'better-sqlite3';

export async function up(db: Database): Promise<void> {
  console.log('🔧 Migration 039: Fixing full-sidebar header height to 36px...');
  
  try {
    // STEP 1: First, update the CHECK constraint to allow 36px
    console.log('📐 Step 1: Updating CHECK constraint to allow header_height >= 36...');
    
    // Check if user_navigation_mode_settings table exists
    const modeSettingsTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_navigation_mode_settings'
    `).get();
    
    if (modeSettingsTable) {
      // SQLite doesn't support ALTER COLUMN with constraints directly
      // We need to recreate the table with updated constraint
      console.log('📐 Recreating user_navigation_mode_settings table with updated constraint...');
      
      // 1. Create temporary table with new constraint
      db.exec(`
        CREATE TABLE user_navigation_mode_settings_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')),
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
      
      // 2. Copy data from old table
      db.exec(`
        INSERT INTO user_navigation_mode_settings_temp 
        SELECT * FROM user_navigation_mode_settings
      `);
      
      // 3. Drop old table
      db.exec(`DROP TABLE user_navigation_mode_settings`);
      
      // 4. Rename temp table
      db.exec(`ALTER TABLE user_navigation_mode_settings_temp RENAME TO user_navigation_mode_settings`);
      
      console.log('  ✅ Updated table constraint: header_height >= 36');
    }

    // STEP 2: Now update the values
    console.log('📐 Step 2: Updating user_navigation_preferences for full-sidebar mode...');
    const updateUserPrefs = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 36,
          updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = 'full-sidebar' 
      AND header_height != 36
    `);
    const userPrefsChanges = updateUserPrefs.run();
    console.log(`  ✅ Updated ${userPrefsChanges.changes} user navigation preferences`);

    if (modeSettingsTable) {
      console.log('📐 Step 3: Updating user_navigation_mode_settings for full-sidebar mode...');
      const updateModeSettings = db.prepare(`
        UPDATE user_navigation_mode_settings 
        SET header_height = 36,
            updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = 'full-sidebar' 
        AND header_height != 36
      `);
      const modeSettingsChanges = updateModeSettings.run();
      console.log(`  ✅ Updated ${modeSettingsChanges.changes} mode settings`);
    }

    // STEP 3: Update focus mode preferences (if table exists)
    const focusTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_focus_mode_preferences'
    `).get();
    
    if (focusTable) {
      console.log('🎯 Step 4: Updating focus mode preferences for full-sidebar mode...');
      const updateFocusPrefs = db.prepare(`
        UPDATE user_focus_mode_preferences 
        SET focus_header_height = 28,
            updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = 'full-sidebar' 
        AND (focus_header_height IS NULL OR focus_header_height != 28)
      `);
      const focusChanges = updateFocusPrefs.run();
      console.log(`  ✅ Updated ${focusChanges.changes} focus mode preferences (focus height: 28px)`);
    }

    console.log('✅ Migration 039 completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - full-sidebar header height: 72px → 36px`);
    console.log(`   - full-sidebar focus height: 52px → 28px`);
    console.log(`   - Updated CHECK constraint: header_height >= 36`);
    console.log(`   - Matches SYSTEM_DEFAULTS and CSS fallback values`);
    
  } catch (error) {
    console.error('❌ Migration 039 failed:', error);
    throw error;
  }
}

export async function down(db: Database): Promise<void> {
  console.log('🔧 Rolling back Migration 039: Restoring full-sidebar header height to 72px...');
  
  try {
    // Revert user_navigation_preferences
    const revertUserPrefs = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 72,
          updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = 'full-sidebar' 
      AND header_height = 36
    `);
    revertUserPrefs.run();

    // Revert user_navigation_mode_settings
    const modeSettingsTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_navigation_mode_settings'
    `).get();
    
    if (modeSettingsTable) {
      const revertModeSettings = db.prepare(`
        UPDATE user_navigation_mode_settings 
        SET header_height = 72,
            updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = 'full-sidebar' 
        AND header_height = 36
      `);
      revertModeSettings.run();
    }

    // Revert focus mode preferences
    const focusTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_focus_mode_preferences'
    `).get();
    
    if (focusTable) {
      const revertFocusPrefs = db.prepare(`
        UPDATE user_focus_mode_preferences 
        SET focus_header_height = 52,
            updated_at = CURRENT_TIMESTAMP
        WHERE navigation_mode = 'full-sidebar' 
        AND focus_header_height = 28
      `);
      revertFocusPrefs.run();
    }

    console.log('✅ Migration 039 rollback completed');
    
  } catch (error) {
    console.error('❌ Migration 039 rollback failed:', error);
    throw error;
  }
}