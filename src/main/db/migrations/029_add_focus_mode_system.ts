/**
 * Migration 029: Focus Mode System Database Schema
 * 
 * Creates database tables for Focus Mode preferences with cross-device synchronization.
 * Follows the same pattern as Theme System (Migration 027) and Navigation System (Migration 028).
 * 
 * Architecture: Database-first with localStorage fallback
 * User Experience: Focus Mode preferences persist across sessions and devices
 * 
 * @author GitHub Copilot
 * @date 2025-10-20
 * @migration 029
 */

import { Database } from 'better-sqlite3';

/**
 * Apply migration: Create Focus Mode system tables
 */
export const up = (db: Database): void => {
  console.log('🗄️ [Migration 029] Creating Focus Mode Database Schema...');
  
  // 1. Create user_focus_preferences table - Focus Mode user preferences
  console.log('🔧 [Migration 029] Creating user_focus_preferences table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_focus_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      focus_mode_active BOOLEAN DEFAULT 0,
      focus_mode_variant TEXT CHECK (focus_mode_variant IN ('zen', 'mini', 'free')) DEFAULT NULL,
      auto_restore BOOLEAN DEFAULT 0,
      last_session_variant TEXT CHECK (last_session_variant IN ('zen', 'mini', 'free')) DEFAULT NULL,
      session_count INTEGER DEFAULT 0,
      total_focus_time INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    )
  `);
  
  // 2. Create focus_mode_history table - Usage tracking and analytics
  console.log('🔧 [Migration 029] Creating focus_mode_history table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_mode_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      focus_mode_variant TEXT NOT NULL CHECK (focus_mode_variant IN ('zen', 'mini', 'free')),
      session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_end DATETIME DEFAULT NULL,
      session_duration INTEGER DEFAULT 0,
      session_id TEXT DEFAULT NULL,
      navigation_mode TEXT DEFAULT NULL,
      theme_name TEXT DEFAULT NULL
    )
  `);
  
  // 3. Create indexes for performance
  console.log('🔧 [Migration 029] Creating performance indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_focus_preferences_user_id ON user_focus_preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_focus_history_user_id ON focus_mode_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_focus_history_variant ON focus_mode_history(focus_mode_variant);
    CREATE INDEX IF NOT EXISTS idx_focus_history_session_start ON focus_mode_history(session_start);
  `);
  
  // 4. Insert default preferences for existing users
  console.log('🔧 [Migration 029] Setting up default focus preferences...');
  db.exec(`
    INSERT OR IGNORE INTO user_focus_preferences (
      user_id, 
      focus_mode_active, 
      focus_mode_variant, 
      auto_restore,
      session_count,
      total_focus_time
    ) VALUES (
      'default', 
      0, 
      NULL, 
      0,
      0,
      0
    )
  `);
  
  console.log('✅ [Migration 029] Focus Mode Database Schema created successfully');
  console.log('🎯 [Migration 029] Features enabled:');
  console.log('   - Focus Mode preferences persistence');
  console.log('   - Cross-device synchronization');  
  console.log('   - Usage analytics and history');
  console.log('   - Auto-restore configuration');
  console.log('   - Session tracking integration');
  console.log('🛡️ [Migration 029] localStorage fallback compatibility preserved');
};

/**
 * Revert migration: Remove Focus Mode system tables
 * 
 * Note: This will remove ALL Focus Mode preferences and history.
 * The app will fall back to localStorage-only focus mode.
 */
export const down = (db: Database): void => {
  console.log('🗄️ [Migration 029] Reverting Focus Mode Database Schema...');
  
  console.log('⚠️  [Migration 029] Removing focus mode history...');
  db.exec('DROP TABLE IF EXISTS focus_mode_history');
  
  console.log('⚠️  [Migration 029] Removing user focus preferences...');
  db.exec('DROP TABLE IF EXISTS user_focus_preferences');
  
  console.log('✅ [Migration 029] Focus Mode Database Schema removed successfully');
  console.log('🛡️ [Migration 029] App will fall back to localStorage-based focus mode');
};