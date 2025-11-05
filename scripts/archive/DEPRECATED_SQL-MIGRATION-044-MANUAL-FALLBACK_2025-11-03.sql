-- Migration 044 Manual Execution
-- Schema cleanup: Remove legacy modes from CHECK constraints

BEGIN TRANSACTION;

-- Step 1: Create backup
CREATE TABLE IF NOT EXISTS migration_backup_044_navigation_preferences AS 
SELECT * FROM user_navigation_preferences;

-- Step 2: Create new table with clean constraints
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
);

-- Step 3: Data migration with legacy mode conversion
INSERT INTO user_navigation_preferences_new 
SELECT 
  id, user_id,
  CASE 
    WHEN navigation_mode = 'header-statistics' THEN 'mode-dashboard-view'
    WHEN navigation_mode = 'header-navigation' THEN 'mode-data-panel'
    WHEN navigation_mode = 'full-sidebar' THEN 'mode-compact-focus'
    ELSE navigation_mode
  END as navigation_mode,
  header_height, sidebar_width, auto_collapse, remember_focus_mode,
  created_at, updated_at
FROM user_navigation_preferences;

-- Step 4: Atomic table swap
DROP TABLE user_navigation_preferences;
ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences;

-- Step 5: Update version
PRAGMA user_version = 44;

COMMIT;