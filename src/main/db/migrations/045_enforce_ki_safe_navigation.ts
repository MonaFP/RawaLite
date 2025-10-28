/**
 * Migration 045: Enforce KI-safe navigation schema
 *
 * - Rebuilds legacy tables with CHECK constraints that still reference legacy navigation modes
 * - Normalises remaining data to the new KI-safe identifiers
 * - Replaces the legacy per-mode `user_navigation_mode_settings` structure with the consolidated
 *   schema introduced in Migration 042 (one row per user, footer configuration included)
 * - Aligns navigation history and focus preferences with the 3-row footer layout
 */

import type { Database } from 'better-sqlite3';

type Mode = 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus';

const MODE_CONVERSION: Record<string, Mode> = {
  'header': 'mode-data-panel',
  'sidebar': 'mode-data-panel',
  'header-statistics': 'mode-dashboard-view',
  'header-navigation': 'mode-data-panel',
  'full-sidebar': 'mode-compact-focus',
  'mode-dashboard-view': 'mode-dashboard-view',
  'mode-data-panel': 'mode-data-panel',
  'mode-compact-focus': 'mode-compact-focus'
};

const HEADER_DEFAULTS: Record<Mode, number> = {
  'mode-dashboard-view': 160,
  'mode-data-panel': 160,
  'mode-compact-focus': 60
};

const SIDEBAR_DEFAULTS: Record<Mode, number> = {
  'mode-dashboard-view': 240,
  'mode-data-panel': 280,
  'mode-compact-focus': 240
};

const GRID_ROWS: Record<Mode, string> = {
  'mode-dashboard-view': '160px 1fr 60px',
  'mode-data-panel': '160px 1fr 60px',
  'mode-compact-focus': '60px 1fr 60px'
};

function normalizeMode(input: unknown): Mode {
  if (typeof input !== 'string') {
    return 'mode-dashboard-view';
  }
  return MODE_CONVERSION[input] ?? 'mode-dashboard-view';
}

export function up(db: Database): void {
  console.log('[Migration 045] Enforcing KI-safe navigation schema...');

  // Migration system already manages transactions - no explicit BEGIN/COMMIT needed
  normalizeUserPreferences(db);
  rebuildNavigationHistory(db);
  rebuildFocusPreferences(db);
  rebuildNavigationModeSettings(db);
  normalizeFooterPreferences(db);

  console.log('[Migration 045] ✅ KI-safe navigation schema enforced successfully');
}

export function down(): void {
  throw new Error('Migration 045 is not reversible – KI-safe schema is mandatory going forward.');
}

function tableExists(db: Database, name: string): boolean {
  const result = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`
    )
    .get(name);
  return Boolean(result);
}

function normalizeUserPreferences(db: Database): void {
  console.log('[Migration 045] • Normalising user_navigation_preferences');

  db.exec(`
    UPDATE user_navigation_preferences
    SET navigation_mode = CASE navigation_mode
      WHEN 'header-statistics' THEN 'mode-dashboard-view'
      WHEN 'header-navigation' THEN 'mode-data-panel'
      WHEN 'full-sidebar' THEN 'mode-compact-focus'
      ELSE navigation_mode
    END,
    header_height = CASE navigation_mode
      WHEN 'mode-dashboard-view' THEN ${HEADER_DEFAULTS['mode-dashboard-view']}
      WHEN 'mode-data-panel' THEN ${HEADER_DEFAULTS['mode-data-panel']}
      WHEN 'mode-compact-focus' THEN ${HEADER_DEFAULTS['mode-compact-focus']}
      ELSE header_height
    END,
    sidebar_width = CASE navigation_mode
      WHEN 'mode-dashboard-view' THEN ${SIDEBAR_DEFAULTS['mode-dashboard-view']}
      WHEN 'mode-data-panel' THEN ${SIDEBAR_DEFAULTS['mode-data-panel']}
      WHEN 'mode-compact-focus' THEN ${SIDEBAR_DEFAULTS['mode-compact-focus']}
      ELSE sidebar_width
    END,
    updated_at = CURRENT_TIMESTAMP
  `);
}

function rebuildNavigationHistory(db: Database): void {
  if (!tableExists(db, 'navigation_mode_history')) {
    console.log('[Migration 045] • navigation_mode_history table not found – skipping');
    return;
  }

  console.log('[Migration 045] • Rebuilding navigation_mode_history with KI-safe checks');

  db.exec(`
    CREATE TABLE navigation_mode_history_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default',
      previous_mode TEXT CHECK (previous_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus') OR previous_mode IS NULL),
      new_mode TEXT NOT NULL CHECK (new_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT,
      FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    INSERT INTO navigation_mode_history_new (id, user_id, previous_mode, new_mode, changed_at, session_id)
    SELECT
      id,
      user_id,
      CASE previous_mode
        WHEN 'header-statistics' THEN 'mode-dashboard-view'
        WHEN 'header-navigation' THEN 'mode-data-panel'
        WHEN 'full-sidebar' THEN 'mode-compact-focus'
        ELSE previous_mode
      END,
      CASE new_mode
        WHEN 'header-statistics' THEN 'mode-dashboard-view'
        WHEN 'header-navigation' THEN 'mode-data-panel'
        WHEN 'full-sidebar' THEN 'mode-compact-focus'
        ELSE new_mode
      END,
      changed_at,
      session_id
    FROM navigation_mode_history
  `);

  db.exec('DROP TABLE navigation_mode_history');
  db.exec('ALTER TABLE navigation_mode_history_new RENAME TO navigation_mode_history');
  db.exec('CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_user_id ON navigation_mode_history(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_navigation_mode_history_changed_at ON navigation_mode_history(changed_at)');
}

function rebuildFocusPreferences(db: Database): void {
  if (!tableExists(db, 'user_focus_mode_preferences')) {
    console.log('[Migration 045] • user_focus_mode_preferences table not found – skipping');
    return;
  }

  console.log('[Migration 045] • Rebuilding user_focus_mode_preferences with KI-safe checks');

  db.exec(`
    CREATE TABLE user_focus_mode_preferences_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      auto_focus_enabled BOOLEAN NOT NULL DEFAULT 0,
      auto_focus_delay_seconds INTEGER NOT NULL DEFAULT 300 CHECK (auto_focus_delay_seconds >= 30 AND auto_focus_delay_seconds <= 3600),
      focus_on_mode_switch BOOLEAN NOT NULL DEFAULT 0,
      hide_sidebar_in_focus BOOLEAN NOT NULL DEFAULT 1,
      hide_header_stats_in_focus BOOLEAN NOT NULL DEFAULT 0,
      dim_background_opacity REAL NOT NULL DEFAULT 0.3 CHECK (dim_background_opacity >= 0.0 AND dim_background_opacity <= 1.0),
      transition_duration_ms INTEGER NOT NULL DEFAULT 300 CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 1000),
      transition_easing TEXT NOT NULL DEFAULT 'ease-in-out' CHECK (transition_easing IN ('linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out')),
      block_notifications BOOLEAN NOT NULL DEFAULT 1,
      block_popups BOOLEAN NOT NULL DEFAULT 1,
      block_context_menu BOOLEAN NOT NULL DEFAULT 0,
      minimal_ui_mode BOOLEAN NOT NULL DEFAULT 0,
      track_focus_sessions BOOLEAN NOT NULL DEFAULT 1,
      show_focus_timer BOOLEAN NOT NULL DEFAULT 1,
      focus_break_reminders BOOLEAN NOT NULL DEFAULT 0,
      focus_break_interval_minutes INTEGER NOT NULL DEFAULT 25 CHECK (focus_break_interval_minutes >= 5 AND focus_break_interval_minutes <= 120),
      show_footer_in_normal_mode BOOLEAN NOT NULL DEFAULT 1,
      show_footer_in_focus_mode BOOLEAN NOT NULL DEFAULT 0,
      footer_height_px INTEGER NOT NULL DEFAULT 60 CHECK (footer_height_px >= 40 AND footer_height_px <= 200),
      footer_position TEXT NOT NULL DEFAULT 'bottom' CHECK (footer_position IN ('bottom')),
      footer_auto_hide BOOLEAN NOT NULL DEFAULT 0,
      footer_auto_hide_delay_ms INTEGER NOT NULL DEFAULT 3000 CHECK (footer_auto_hide_delay_ms >= 1000 AND footer_auto_hide_delay_ms <= 10000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, navigation_mode),
      FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    INSERT INTO user_focus_mode_preferences_new (
      id, user_id, navigation_mode, auto_focus_enabled, auto_focus_delay_seconds, focus_on_mode_switch,
      hide_sidebar_in_focus, hide_header_stats_in_focus, dim_background_opacity,
      transition_duration_ms, transition_easing,
      block_notifications, block_popups, block_context_menu, minimal_ui_mode,
      track_focus_sessions, show_focus_timer, focus_break_reminders, focus_break_interval_minutes,
      show_footer_in_normal_mode, show_footer_in_focus_mode, footer_height_px, footer_position,
      footer_auto_hide, footer_auto_hide_delay_ms,
      created_at, updated_at
    )
    SELECT
      id,
      user_id,
      CASE navigation_mode
        WHEN 'header-statistics' THEN 'mode-dashboard-view'
        WHEN 'header-navigation' THEN 'mode-data-panel'
        WHEN 'full-sidebar' THEN 'mode-compact-focus'
        ELSE navigation_mode
      END,
      auto_focus_enabled,
      auto_focus_delay_seconds,
      focus_on_mode_switch,
      hide_sidebar_in_focus,
      hide_header_stats_in_focus,
      dim_background_opacity,
      transition_duration_ms,
      transition_easing,
      block_notifications,
      block_popups,
      block_context_menu,
      minimal_ui_mode,
      track_focus_sessions,
      show_focus_timer,
      focus_break_reminders,
      focus_break_interval_minutes,
      COALESCE(show_footer_in_normal_mode, 1),
      COALESCE(show_footer_in_focus_mode, 0),
      COALESCE(footer_height_px, 60),
      'bottom',
      COALESCE(footer_auto_hide, 0),
      COALESCE(footer_auto_hide_delay_ms, 3000),
      created_at,
      updated_at
    FROM user_focus_mode_preferences
  `);

  db.exec('DROP TABLE user_focus_mode_preferences');
  db.exec('ALTER TABLE user_focus_mode_preferences_new RENAME TO user_focus_mode_preferences');
}

function rebuildNavigationModeSettings(db: Database): void {
  if (tableExists(db, 'user_navigation_mode_settings')) {
    console.log('[Migration 045] • Dropping legacy user_navigation_mode_settings');
    db.exec('DROP TABLE user_navigation_mode_settings');
  }

  console.log('[Migration 045] • Creating KI-safe user_navigation_mode_settings');

  db.exec(`
    CREATE TABLE user_navigation_mode_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      default_navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view'
        CHECK (default_navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      allow_mode_switching BOOLEAN NOT NULL DEFAULT 1,
      remember_last_mode BOOLEAN NOT NULL DEFAULT 1,
      show_mode_indicator BOOLEAN NOT NULL DEFAULT 1,
      auto_hide_sidebar_in_focus BOOLEAN NOT NULL DEFAULT 1,
      persist_sidebar_width BOOLEAN NOT NULL DEFAULT 1,
      show_footer BOOLEAN NOT NULL DEFAULT 1,
      footer_show_mode_info BOOLEAN NOT NULL DEFAULT 1,
      footer_show_theme_info BOOLEAN NOT NULL DEFAULT 1,
      footer_show_version BOOLEAN NOT NULL DEFAULT 1,
      footer_show_focus_controls BOOLEAN NOT NULL DEFAULT 1,
      enable_mode_transitions BOOLEAN NOT NULL DEFAULT 1,
      transition_duration_ms INTEGER NOT NULL DEFAULT 300 CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 1000),
      legacy_mode_mapping TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id)
    )
  `);

  // Trigger to keep updated_at in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_user_navigation_mode_settings_updated
    AFTER UPDATE ON user_navigation_mode_settings
    FOR EACH ROW
    BEGIN
      UPDATE user_navigation_mode_settings
      SET updated_at = datetime('now')
      WHERE id = NEW.id;
    END;
  `);

  // Seed defaults for all known users (including 'default')
  const users = db.prepare(`SELECT DISTINCT user_id, navigation_mode FROM user_navigation_preferences`).all();
  const insert = db.prepare(`
    INSERT INTO user_navigation_mode_settings (
      user_id,
      default_navigation_mode,
      legacy_mode_mapping
    ) VALUES (?, ?, '{}')
  `);

  for (const row of users as Array<{ user_id: string; navigation_mode?: string }>) {
    const mode = normalizeMode(row.navigation_mode);
    insert.run(row.user_id ?? 'default', mode);
  }
}

function normalizeFooterPreferences(db: Database): void {
  if (!tableExists(db, 'user_footer_content_preferences')) {
    console.log('[Migration 045] • user_footer_content_preferences table not found – skipping');
    return;
  }

  console.log('[Migration 045] • Normalising user_footer_content_preferences');

  db.exec(`
    UPDATE user_footer_content_preferences
    SET navigation_mode = CASE navigation_mode
      WHEN 'header-statistics' THEN 'mode-dashboard-view'
      WHEN 'header-navigation' THEN 'mode-data-panel'
      WHEN 'full-sidebar' THEN 'mode-compact-focus'
      ELSE navigation_mode
    END,
    updated_at = CURRENT_TIMESTAMP
  `);
}
