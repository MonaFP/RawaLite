/**
 * Migration 042: User Navigation Mode Settings
 * 
 * Creates user-specific navigation mode settings table for personalized navigation behavior.
 * This migration addresses the missing userNavigationModeSettings table identified in footer integration.
 * 
 * Tables Created:
 * - user_navigation_mode_settings: User-specific navigation mode preferences
 * 
 * Features:
 * - Per-user navigation mode defaults
 * - Mode-specific UI preferences  
 * - Footer display settings
 * - Legacy to KI-safe mode mapping
 * 
 * @since v1.0.59
 * @date 2025-10-24
 */

export async function up(db: any): Promise<void> {
  console.log('[Migration 042] Creating user navigation mode settings...');

  // Create user navigation mode settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_navigation_mode_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      
      -- Navigation Mode Preferences
      default_navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view' 
        CHECK (default_navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      allow_mode_switching BOOLEAN NOT NULL DEFAULT 1,
      remember_last_mode BOOLEAN NOT NULL DEFAULT 1,
      
      -- UI Behavior Settings
      show_mode_indicator BOOLEAN NOT NULL DEFAULT 1,
      auto_hide_sidebar_in_focus BOOLEAN NOT NULL DEFAULT 1,
      persist_sidebar_width BOOLEAN NOT NULL DEFAULT 1,
      
      -- Footer Integration Settings
      show_footer BOOLEAN NOT NULL DEFAULT 1,
      footer_show_mode_info BOOLEAN NOT NULL DEFAULT 1,
      footer_show_theme_info BOOLEAN NOT NULL DEFAULT 1,
      footer_show_version BOOLEAN NOT NULL DEFAULT 1,
      footer_show_focus_controls BOOLEAN NOT NULL DEFAULT 1,
      
      -- Performance Settings
      enable_mode_transitions BOOLEAN NOT NULL DEFAULT 1,
      transition_duration_ms INTEGER NOT NULL DEFAULT 300 
        CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 1000),
      
      -- Legacy Support
      legacy_mode_mapping TEXT, -- JSON mapping for legacy modes
      
      -- Timestamps
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      
      -- Constraints
      UNIQUE(user_id)
    );
  `);

  // Insert default settings for default user
  await db.exec(`
    INSERT OR IGNORE INTO user_navigation_mode_settings (
      user_id,
      default_navigation_mode,
      legacy_mode_mapping
    ) VALUES (
      'default',
      'mode-dashboard-view',
      '{"header-statistics": "mode-dashboard-view", "header-navigation": "mode-data-panel", "full-sidebar": "mode-compact-focus"}'
    );
  `);

  // Create index for efficient user lookups
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_navigation_mode_settings_user_id 
    ON user_navigation_mode_settings(user_id);
  `);

  // Create trigger for updated_at
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_user_navigation_mode_settings_updated_at
    AFTER UPDATE ON user_navigation_mode_settings
    FOR EACH ROW
    BEGIN
      UPDATE user_navigation_mode_settings 
      SET updated_at = datetime('now') 
      WHERE id = NEW.id;
    END;
  `);

  console.log('[Migration 042] ✅ User navigation mode settings created successfully');
}

export async function down(db: any): Promise<void> {
  console.log('[Migration 042] Rolling back user navigation mode settings...');

  // Drop trigger
  await db.exec(`DROP TRIGGER IF EXISTS update_user_navigation_mode_settings_updated_at;`);
  
  // Drop index
  await db.exec(`DROP INDEX IF EXISTS idx_user_navigation_mode_settings_user_id;`);
  
  // Drop table
  await db.exec(`DROP TABLE IF EXISTS user_navigation_mode_settings;`);

  console.log('[Migration 042] ✅ User navigation mode settings rollback complete');
}