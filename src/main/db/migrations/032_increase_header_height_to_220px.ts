/**
 * Migration 032: Increase Header Height Limit to 220px
 * 
 * Updates the CHECK constraint for header_height to allow up to 220px
 * to match logo area height and prevent scrollbar issues.
 * 
 * @since v1.0.48+
 * @see Header Statistics Mode height optimization
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  console.log('🔧 [Migration 032] Increasing header height limit to 220px...');
  
  try {
    // Create new table with updated constraints
    db.exec(`
      CREATE TABLE user_navigation_preferences_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
        header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 220),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy data from old table
    db.exec(`
      INSERT INTO user_navigation_preferences_new 
      (id, user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
      SELECT id, user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at
      FROM user_navigation_preferences
    `);
    
    // Drop old table
    db.exec('DROP TABLE user_navigation_preferences');
    
    // Rename new table
    db.exec('ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences');
    
    console.log('✅ [Migration 032] Header height limit increased to 220px successfully');
    
  } catch (error) {
    console.error('❌ [Migration 032] Failed to increase header height limit:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  console.log('🔄 [Migration 032] Reverting header height limit to 160px...');
  
  try {
    // Create original table with 160px limit
    db.exec(`
      CREATE TABLE user_navigation_preferences_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
        header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 160),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy data, clamping header_height to max 160px
    db.exec(`
      INSERT INTO user_navigation_preferences_new 
      (id, user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
      SELECT id, user_id, navigation_mode, 
        CASE WHEN header_height > 160 THEN 160 ELSE header_height END,
        sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at
      FROM user_navigation_preferences
    `);
    
    // Drop old table
    db.exec('DROP TABLE user_navigation_preferences');
    
    // Rename new table
    db.exec('ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences');
    
    console.log('✅ [Migration 032] Header height limit reverted to 160px successfully');
    
  } catch (error) {
    console.error('❌ [Migration 032] Failed to revert header height limit:', error);
    throw error;
  }
}