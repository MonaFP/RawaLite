/**
 * Migration 046: Add Navigation Mode History
 * 
 * Creates user navigation mode history table for tracking navigation mode changes.
 * This migration addresses the missing user_navigation_mode_history table identified in DatabaseNavigationService.
 * 
 * Tables Created:
 * - user_navigation_mode_history: History of navigation mode changes per user
 * 
 * Features:
 * - Track navigation mode changes over time
 * - Session-based change tracking
 * - Automatic cleanup of old history entries
 * - User-specific history isolation
 * 
 * @since v1.0.64
 * @date 2025-10-27
 */

export async function up(db: any): Promise<void> {
  console.log('[Migration 046] Creating user navigation mode history...');

  // Create user navigation mode history table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_navigation_mode_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      
      -- Mode Change Tracking
      previous_mode TEXT NOT NULL 
        CHECK (previous_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      new_mode TEXT NOT NULL 
        CHECK (new_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      
      -- Session Context
      session_id TEXT NOT NULL,
      change_reason TEXT, -- Optional: user-action, system-default, etc.
      
      -- Timestamps
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      
      -- Performance: Index on user_id and changed_at for efficient queries
      FOREIGN KEY (user_id) REFERENCES user_navigation_mode_settings(user_id) ON DELETE CASCADE
    );
  `);

  // Create efficient indexes for history queries
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_mode_history_user_id 
    ON user_navigation_mode_history(user_id);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_mode_history_changed_at 
    ON user_navigation_mode_history(changed_at);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_mode_history_session 
    ON user_navigation_mode_history(session_id);
  `);

  // Create compound index for efficient user + time range queries
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_mode_history_user_time 
    ON user_navigation_mode_history(user_id, changed_at);
  `);

  console.log('[Migration 046] ✅ User navigation mode history created successfully');
}

export async function down(db: any): Promise<void> {
  console.log('[Migration 046] Rolling back user navigation mode history...');

  // Drop indexes
  await db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_history_user_id;`);
  await db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_history_changed_at;`);
  await db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_history_session;`);
  await db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_history_user_time;`);
  
  // Drop table
  await db.exec(`DROP TABLE IF EXISTS user_navigation_mode_history;`);

  console.log('[Migration 046] ✅ User navigation mode history rollback complete');
}