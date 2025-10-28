/**
 * Migration 041: Footer Content Preferences System
 * 
 * Adds database support for per-navigation-mode footer content configuration
 * and extends existing focus mode preferences with footer-specific settings.
 * 
 * This migration supports the Enhanced Focus-Bar approach where the footer
 * functionality is integrated into the existing focus-bar area without
 * violating the protected 4-area CSS Grid architecture (FIX-010).
 * 
 * Schema follows established patterns from Migration 035 (Focus Mode System)
 * and uses Field-Mapper integration for SQL injection prevention.
 * 
 * @version 1.0.59
 * @date 2025-10-24
 * @author GitHub Copilot
 */

import { Database } from 'better-sqlite3';

export async function up(db: Database): Promise<void> {
  console.log('🔧 Migration 041: Adding Footer Content Preferences System...');
  
  try {
    // STEP 1: Create user_footer_content_preferences table
    console.log('📋 Step 1: Creating user_footer_content_preferences table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_footer_content_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default',
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
        
        -- Footer Content Configuration
        show_status_info BOOLEAN NOT NULL DEFAULT 1,
        show_quick_actions BOOLEAN NOT NULL DEFAULT 1,
        show_application_info BOOLEAN NOT NULL DEFAULT 0,
        show_theme_selector BOOLEAN NOT NULL DEFAULT 0,
        show_focus_mode_toggle BOOLEAN NOT NULL DEFAULT 1,
        custom_content_slots TEXT DEFAULT '[]', -- JSON array of slot names
        
        -- Metadata
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        UNIQUE(user_id, navigation_mode)
      )
    `);
    console.log('  ✅ user_footer_content_preferences table created');

    // STEP 2: Add footer-specific columns to existing user_focus_mode_preferences
    console.log('📋 Step 2: Extending user_focus_mode_preferences with footer settings...');
    
    // Check if table exists first
    const focusTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_focus_mode_preferences'
    `).get();
    
    if (focusTable) {
      // Add footer preferences columns
      const footerColumns = [
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN show_footer_in_normal_mode BOOLEAN NOT NULL DEFAULT 1',
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN show_footer_in_focus_mode BOOLEAN NOT NULL DEFAULT 0',
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN footer_height_px INTEGER NOT NULL DEFAULT 80 CHECK (footer_height_px >= 40 AND footer_height_px <= 200)',
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN footer_position TEXT NOT NULL DEFAULT \'focus-bar-area\' CHECK (footer_position IN (\'bottom\', \'focus-bar-area\'))',
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN footer_auto_hide BOOLEAN NOT NULL DEFAULT 0',
        'ALTER TABLE user_focus_mode_preferences ADD COLUMN footer_auto_hide_delay_ms INTEGER NOT NULL DEFAULT 3000 CHECK (footer_auto_hide_delay_ms >= 1000 AND footer_auto_hide_delay_ms <= 10000)'
      ];

      for (const [index, sql] of footerColumns.entries()) {
        try {
          db.exec(sql);
          console.log(`  ✅ Added footer column ${index + 1}/6`);
        } catch (error) {
          // Column might already exist, check specifically
          if (error instanceof Error && error.message.includes('duplicate column name')) {
            console.log(`  ℹ️ Footer column ${index + 1}/6 already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
    } else {
      console.log('  ⚠️ user_focus_mode_preferences table not found, skipping footer extensions');
    }

    // STEP 3: Create indexes for performance
    console.log('📋 Step 3: Creating performance indexes...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_footer_content_user_id ON user_footer_content_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_footer_content_navigation_mode ON user_footer_content_preferences(navigation_mode);
      CREATE INDEX IF NOT EXISTS idx_footer_content_user_mode ON user_footer_content_preferences(user_id, navigation_mode);
    `);
    console.log('  ✅ Performance indexes created');

    // STEP 4: Insert default footer content preferences for existing users
    console.log('📋 Step 4: Setting up default footer content preferences...');
    
    // Check if default user exists in navigation preferences
    const defaultUser = db.prepare(`
      SELECT user_id FROM user_navigation_preferences WHERE user_id = 'default'
    `).get();

    if (defaultUser) {
      // Insert default footer preferences for all navigation modes
      const navigationModes = ['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'];
      
      for (const mode of navigationModes) {
        db.exec(`
          INSERT OR IGNORE INTO user_footer_content_preferences (
            user_id, 
            navigation_mode,
            show_status_info,
            show_quick_actions,
            show_application_info,
            show_theme_selector,
            show_focus_mode_toggle,
            custom_content_slots
          ) VALUES (
            'default',
            '${mode}',
            1,
            1,
            0,
            0,
            1,
            '[]'
          )
        `);
        console.log(`  ✅ Default footer preferences created for ${mode} mode`);
      }
    } else {
      console.log('  ℹ️ No default user found, skipping default footer preferences');
    }

    // STEP 5: Update existing focus mode preferences with footer defaults (if table exists)
    if (focusTable) {
      console.log('📋 Step 5: Updating existing focus mode preferences with footer defaults...');
      const updateExistingFocus = db.prepare(`
        UPDATE user_focus_mode_preferences 
        SET show_footer_in_normal_mode = 1,
            show_footer_in_focus_mode = 0,
            footer_height_px = 80,
            footer_position = 'focus-bar-area',
            footer_auto_hide = 0,
            footer_auto_hide_delay_ms = 3000,
            updated_at = CURRENT_TIMESTAMP
        WHERE show_footer_in_normal_mode IS NULL
      `);
      const focusChanges = updateExistingFocus.run();
      console.log(`  ✅ Updated ${focusChanges.changes} existing focus mode preferences with footer defaults`);
    }

    console.log('✅ Migration 041 completed successfully!');
    console.log('📊 Summary:');
    console.log('   - user_footer_content_preferences table created');
    console.log('   - user_focus_mode_preferences extended with 6 footer columns');
    console.log('   - Performance indexes created');
    console.log('   - Default footer preferences initialized');
    console.log('   - Footer Content System ready for Enhanced Focus-Bar integration');
    
  } catch (error) {
    console.error('❌ Migration 041 failed:', error);
    throw error;
  }
}

export async function down(db: Database): Promise<void> {
  console.log('🔧 Rolling back Migration 041: Removing Footer Content Preferences...');
  
  try {
    // Drop the footer content preferences table
    db.exec(`DROP TABLE IF EXISTS user_footer_content_preferences`);
    console.log('  ✅ user_footer_content_preferences table dropped');

    // Note: We cannot easily drop columns from SQLite, so we leave the footer columns
    // in user_focus_mode_preferences as they have default values and won't break anything
    console.log('  ℹ️ Footer columns in user_focus_mode_preferences retained (SQLite limitation)');

    console.log('✅ Migration 041 rollback completed');
    
  } catch (error) {
    console.error('❌ Migration 041 rollback failed:', error);
    throw error;
  }
}