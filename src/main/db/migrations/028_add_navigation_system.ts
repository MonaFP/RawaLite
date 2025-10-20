/**
 * Migration 028: Add Database-Navigation-System
 * 
 * Introduces database-first navigation management with:
 * - user_navigation_preferences: User's navigation mode and layout preferences
 * - Cross-device navigation state synchronization
 * - Database persistence to replace localStorage-only approach
 * 
 * Enables persistent navigation settings while maintaining fallback compatibility
 * with existing localStorage-based navigation (header, sidebar, full-sidebar).
 * 
 * @since v1.0.45+ (Database-Navigation-System)
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CSS-THEME-NAVIGATION-ARCHITECTURE_2025-10-17.md} Navigation Integration Architecture
 * @see {@link docs/ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md} Critical Fixes Registry
 * @related Migration 027 (Database-Theme-System) for pattern consistency
 */

import type { Database } from 'better-sqlite3';

/**
 * Apply migration: Create navigation system tables and seed with default preferences
 */
export const up = (db: Database): void => {
  console.log('🧭 [Migration 028] Adding Database-Navigation-System...');
  
  // Create user_navigation_preferences table
  console.log('🔧 [Migration 028] Creating user_navigation_preferences table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_navigation_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default' UNIQUE NOT NULL,
      navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header', 'sidebar', 'full-sidebar')) DEFAULT 'sidebar',
      header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 120),
      sidebar_width INTEGER DEFAULT 240 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
      auto_collapse INTEGER DEFAULT 0 CHECK (auto_collapse IN (0, 1)),
      remember_focus_mode INTEGER DEFAULT 1 CHECK (remember_focus_mode IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create navigation_mode_history table for user behavior analytics (optional)
  console.log('🔧 [Migration 028] Creating navigation_mode_history table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS navigation_mode_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      previous_mode TEXT CHECK (previous_mode IN ('header', 'sidebar', 'full-sidebar')),
      new_mode TEXT NOT NULL CHECK (new_mode IN ('header', 'sidebar', 'full-sidebar')),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT,
      FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes for performance
  console.log('🔧 [Migration 028] Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_preferences_user_id ON user_navigation_preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_navigation_preferences_navigation_mode ON user_navigation_preferences(navigation_mode);
    CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_user_id ON navigation_mode_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_changed_at ON navigation_mode_history(changed_at);
  `);
  
  // Seed database with default navigation preferences
  console.log('🔧 [Migration 028] Seeding default navigation preferences...');
  
  const insertDefaultPreferences = db.prepare(`
    INSERT OR IGNORE INTO user_navigation_preferences 
    (user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Default user navigation preferences
  const defaultPreferences = {
    user_id: 'default',
    navigation_mode: 'sidebar',        // Default to sidebar mode
    header_height: 72,                 // Standard header height
    sidebar_width: 240,               // Standard sidebar width
    auto_collapse: 0,                 // No auto-collapse by default
    remember_focus_mode: 1            // Remember focus mode preferences
  };
  
  insertDefaultPreferences.run(
    defaultPreferences.user_id,
    defaultPreferences.navigation_mode,
    defaultPreferences.header_height,
    defaultPreferences.sidebar_width,
    defaultPreferences.auto_collapse,
    defaultPreferences.remember_focus_mode
  );
  
  console.log('✅ [Migration 028] Database-Navigation-System created successfully');
  console.log('📊 [Migration 028] Default navigation preferences: sidebar mode, 72px header, 240px sidebar');
  console.log('🧭 [Migration 028] Navigation modes: header, sidebar, full-sidebar');
  console.log('🛡️ [Migration 028] localStorage fallback compatibility preserved');
  console.log('🔄 [Migration 028] Cross-device navigation sync enabled');
};

/**
 * Revert migration: Remove navigation system tables
 * 
 * Note: This will remove ALL navigation preferences and history.
 * The app will fall back to localStorage-only navigation state.
 */
export const down = (db: Database): void => {
  console.log('🧭 [Migration 028] Reverting Database-Navigation-System...');
  
  console.log('⚠️  [Migration 028] Removing navigation mode history...');
  db.exec('DROP TABLE IF EXISTS navigation_mode_history');
  
  console.log('⚠️  [Migration 028] Removing user navigation preferences...');
  db.exec('DROP TABLE IF EXISTS user_navigation_preferences');
  
  console.log('✅ [Migration 028] Database-Navigation-System removed successfully');
  console.log('🛡️ [Migration 028] App will fall back to localStorage-based navigation');
};