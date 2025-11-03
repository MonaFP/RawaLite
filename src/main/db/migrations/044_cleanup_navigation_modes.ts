import { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🧹 Migration 044: Cleaning up legacy navigation modes...');
  
  // STEP 1: Create backup table for rollback safety
  db.exec(`
    CREATE TABLE IF NOT EXISTS migration_backup_044_navigation_preferences AS 
    SELECT * FROM user_navigation_preferences
  `);
  
  // STEP 2: Create new table with corrected constraints
  db.exec(`
    CREATE TABLE user_navigation_preferences_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view' 
        CHECK (navigation_mode IN (
          'mode-dashboard-view',
          'mode-data-panel',
          'mode-compact-focus'
        )),
      header_height INTEGER DEFAULT 72 CHECK (header_height >= 36 AND header_height <= 220),
      sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
      auto_collapse BOOLEAN DEFAULT FALSE,
      remember_focus_mode BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // STEP 3: Data migration with legacy mode conversion
  // NOTE: id is auto-generated, don't select from old table
  db.exec(`
    INSERT INTO user_navigation_preferences_new (user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at)
    SELECT 
      user_id,
      CASE 
        WHEN navigation_mode = 'header-statistics' THEN 'mode-dashboard-view'
        WHEN navigation_mode = 'header-navigation' THEN 'mode-data-panel'
        WHEN navigation_mode = 'full-sidebar' THEN 'mode-compact-focus'
        ELSE navigation_mode
      END as navigation_mode,
      COALESCE(header_height, 72) as header_height, 
      COALESCE(sidebar_width, 280) as sidebar_width, 
      COALESCE(auto_collapse, 0) as auto_collapse, 
      COALESCE(remember_focus_mode, 1) as remember_focus_mode,
      COALESCE(created_at, CURRENT_TIMESTAMP) as created_at, 
      COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at
    FROM user_navigation_preferences
  `);
  
  // STEP 4: Atomic table swap
  db.exec(`DROP TABLE user_navigation_preferences`);
  db.exec(`ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences`);
  
  // STEP 5: Validation
  const modeCheck = db.prepare(`
    SELECT COUNT(*) as count FROM user_navigation_preferences 
    WHERE navigation_mode IN ('header-navigation', 'header-statistics', 'full-sidebar')
  `).get() as { count: number };
  
  if (modeCheck.count > 0) {
    throw new Error('Migration 044 failed: Legacy modes still present');
  }
  
  console.log('✅ Migration 044: Legacy navigation modes cleanup completed');
}

export function down(db: Database): void {
  console.log('🔄 Migration 044 rollback: Restoring legacy navigation modes...');
  
  db.exec(`DROP TABLE IF EXISTS user_navigation_preferences`);
  db.exec(`
    CREATE TABLE user_navigation_preferences AS 
    SELECT * FROM migration_backup_044_navigation_preferences
  `);
  db.exec(`DROP TABLE migration_backup_044_navigation_preferences`);
  
  console.log('✅ Migration 044 rollback completed');
}