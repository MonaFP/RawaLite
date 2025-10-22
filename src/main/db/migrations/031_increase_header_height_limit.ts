/**
 * Migration 031: Increase Header Height Limit
 * 
 * Updates the CHECK constraint for header_height to allow up to 160px
 * to accommodate larger statistics cards in header-statistics mode.
 * 
 * @since v1.0.48+
 * @see Header Statistics Mode optimization
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  console.log('🔧 [Migration 031] Increasing header height limit to 160px...');
  
  try {
    // Create new table with updated constraints
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
    
    console.log('✅ [Migration 031] Header height limit increased to 160px successfully');
    
  } catch (error) {
    console.error('❌ [Migration 031] Failed to increase header height limit:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  console.log('🔄 [Migration 031] Reverting header height limit to 120px...');
  
  try {
    // Create original table with 120px limit
    db.exec(`
      CREATE TABLE user_navigation_preferences_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
        header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 120),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy data, clamping header_height to max 120px
    db.exec(`
      INSERT INTO user_navigation_preferences_new 
      (id, user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
      SELECT id, user_id, navigation_mode, 
        CASE WHEN header_height > 120 THEN 120 ELSE header_height END,
        sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at
      FROM user_navigation_preferences
    `);
    
    // Drop old table
    db.exec('DROP TABLE user_navigation_preferences');
    
    // Rename new table
    db.exec('ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences');
    
    console.log('✅ [Migration 031] Header height limit reverted to 120px successfully');
    
  } catch (error) {
    console.error('❌ [Migration 031] Failed to revert header height limit:', error);
    throw error;
  }
}