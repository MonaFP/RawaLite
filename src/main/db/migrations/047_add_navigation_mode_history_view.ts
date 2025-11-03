// src/main/db/migrations/047_add_navigation_mode_history_view.ts

export const version = 47;
export const name = '047_add_navigation_mode_history_view';

export function up(db: any): void {
  // ✅ 1) Repair user_navigation_preferences schema (TEXT → INTEGER, KI-safe modes)
  const prefsInfo = db.prepare("PRAGMA table_info(user_navigation_preferences)").all() as any[];
  const headerCol = prefsInfo.find((c: any) => c.name === 'header_height');
  const modeCol = prefsInfo.find((c: any) => c.name === 'navigation_mode');

  const needsRebuild = !headerCol || (headerCol.type && headerCol.type.toUpperCase() !== 'INTEGER');

  if (needsRebuild) {
    console.log('[047] Rebuilding user_navigation_preferences (header_height → INTEGER, KI-safe modes)…');
    db.exec(`
      CREATE TABLE user_navigation_preferences_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL DEFAULT 'mode-dashboard-view' 
          CHECK (navigation_mode IN ('mode-dashboard-view','mode-data-panel','mode-compact-focus')),
        header_height INTEGER NOT NULL DEFAULT 160 CHECK (header_height >= 36 AND header_height <= 220),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      INSERT INTO user_navigation_preferences_new (
        user_id, navigation_mode, header_height, sidebar_width, auto_collapse, remember_focus_mode, created_at, updated_at
      )
      SELECT 
        user_id,
        CASE navigation_mode
          WHEN 'header-statistics' THEN 'mode-dashboard-view'
          WHEN 'header-navigation' THEN 'mode-data-panel'
          WHEN 'full-sidebar' THEN 'mode-compact-focus'
          ELSE navigation_mode
        END AS navigation_mode,
        CASE 
          WHEN typeof(header_height)='text' THEN CAST(REPLACE(header_height,'px','') AS INTEGER)
          ELSE header_height
        END AS header_height,
        sidebar_width,
        auto_collapse,
        remember_focus_mode,
        created_at,
        updated_at
      FROM user_navigation_preferences;
    `);

    db.exec('DROP TABLE user_navigation_preferences');
    db.exec('ALTER TABLE user_navigation_preferences_new RENAME TO user_navigation_preferences');
    console.log('[047] Rebuild complete');
  }

  // ✅ 2) Normalize header heights to KI-safe values (idempotent)
  db.exec(`
    UPDATE user_navigation_preferences 
    SET header_height = CASE 
      WHEN navigation_mode = 'mode-compact-focus' THEN 60
      ELSE 160
    END 
    WHERE header_height IS NULL 
       OR header_height NOT IN (60,160,220);
  `);
  console.log('[047] Normalized user_navigation_preferences header heights');

  // ✅ 3) Ensure CHECK range via rebuild fallback (SQLite cannot add CHECK easily)
  // Wenn Spalte bereits INTEGER ist, sind Range-Checks typischerweise schon gesetzt; ansonsten wird 1) sie gesetzt haben.

  // ✅ 4) Mode settings schema alignment (if table exists and has navigation_mode column)
  const modeSettings = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='user_navigation_mode_settings'`).get();
  if (modeSettings) {
    console.log('[047] Checking user_navigation_mode_settings schema…');
    
    // Check if navigation_mode column exists (Migration 034/035 schema)
    const modeSettingsColumns = db.prepare(`PRAGMA table_info(user_navigation_mode_settings)`).all() as any[];
    const hasNavigationModeColumn = modeSettingsColumns.some((c: any) => c.name === 'navigation_mode');
    
    // Only rebuild if the old navigation_mode column exists
    if (hasNavigationModeColumn) {
      console.log('[047] Detected Migration 034/035 schema - aligning to Migration 047 structure…');
      db.exec(`
        CREATE TABLE user_navigation_mode_settings_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view','mode-data-panel','mode-compact-focus')),
          header_height INTEGER NOT NULL DEFAULT 160 CHECK (header_height >= 36 AND header_height <= 220),
          sidebar_width INTEGER NOT NULL DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
          auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
          auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
          remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
          mobile_breakpoint INTEGER NOT NULL DEFAULT 768 CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
          tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
          grid_template_columns TEXT NULL,
          grid_template_rows TEXT NULL,
          grid_template_areas TEXT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, navigation_mode)
        );
      `);

      db.exec(`
        INSERT INTO user_navigation_mode_settings_new (
          id, user_id, navigation_mode, header_height, sidebar_width, auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, mobile_breakpoint, tablet_breakpoint, grid_template_columns, grid_template_rows, grid_template_areas, created_at, updated_at
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
          CASE 
            WHEN navigation_mode = 'mode-compact-focus' THEN 60
            ELSE 160
          END,
          sidebar_width,
          auto_collapse_mobile,
          auto_collapse_tablet,
          remember_dimensions,
          mobile_breakpoint,
          tablet_breakpoint,
          grid_template_columns,
          grid_template_rows,
          grid_template_areas,
          created_at,
          updated_at
        FROM user_navigation_mode_settings;
      `);

      db.exec('DROP TABLE user_navigation_mode_settings');
      db.exec('ALTER TABLE user_navigation_mode_settings_new RENAME TO user_navigation_mode_settings');
      console.log('[047] Mode settings migrated from Migration 034 schema');
    } else {
      console.log('[047] Detected Migration 045 schema - user_navigation_mode_settings already optimized (no action needed)');
    }
  }

  // ✅ 5) Create user_navigation_mode_history table (no hard FK to users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_navigation_mode_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      previous_mode TEXT CHECK (previous_mode IN ('mode-dashboard-view','mode-data-panel','mode-compact-focus') OR previous_mode IS NULL),
      new_mode TEXT NOT NULL CHECK (new_mode IN ('mode-dashboard-view','mode-data-panel','mode-compact-focus')),
      previous_height INTEGER,
      new_height INTEGER NOT NULL CHECK (new_height >= 36 AND new_height <= 220),
      change_reason TEXT DEFAULT 'mode_change',
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT
    );
  `);
  console.log('[047] Ensured user_navigation_mode_history table');

  // ✅ 6) Create dedicated navigation_mode_history VIEW (read-only aggregation)
  db.exec(`
    CREATE VIEW IF NOT EXISTS navigation_mode_history AS
    SELECT 
      id,
      user_id,
      previous_mode,
      new_mode,
      previous_height,
      new_height,
      change_reason,
      changed_at,
      session_id,
      CASE 
        WHEN new_height > previous_height THEN 'expanded'
        WHEN new_height < previous_height THEN 'collapsed'
        ELSE 'mode_switch'
      END AS change_type
    FROM user_navigation_mode_history
    ORDER BY changed_at DESC;
  `);
  
  console.log('[047] Ensured navigation_mode_history VIEW');

  // ✅ 7) Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_nav_mode_history_user_id 
      ON user_navigation_mode_history(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_user_nav_mode_history_changed_at 
      ON user_navigation_mode_history(changed_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_user_nav_mode_history_session 
      ON user_navigation_mode_history(session_id);
    
    CREATE INDEX IF NOT EXISTS idx_user_nav_mode_history_mode 
      ON user_navigation_mode_history(new_mode);
  `);
  
  console.log('[047] Ensured performance indexes');

  // ✅ 8) Validation: Verify migration integrity
  const integrity = db.prepare(
    `SELECT COUNT(*) as cnt FROM user_navigation_preferences WHERE header_height IS NULL OR header_height NOT IN (60, 160, 220)`
  ).get() as { cnt: number };

  if (integrity.cnt > 0) {
    throw new Error(`[047] Validation failed: ${integrity.cnt} misaligned heights detected after normalization`);
  }
  
  console.log('[047] ✅ Migration UP complete - Database validated');
}

export function down(db: any): void {
  // ✅ Defensive rollback (no TEXT rollback - header_height stays INTEGER)
  
  // 1. Drop VIEW (safe - new in 047)
  db.exec(`DROP VIEW IF EXISTS navigation_mode_history;`);
  console.log('[047] Dropped navigation_mode_history VIEW');

  // 2. Drop user_navigation_mode_history table (safe - new in 047)
  db.exec(`DROP TABLE IF EXISTS user_navigation_mode_history;`);
  console.log('[047] Dropped user_navigation_mode_history table');

  // 3. Drop indexes (safe - created in 047)
  db.exec(`
    DROP INDEX IF EXISTS idx_user_nav_mode_history_user_id;
    DROP INDEX IF EXISTS idx_user_nav_mode_history_changed_at;
    DROP INDEX IF EXISTS idx_user_nav_mode_history_session;
    DROP INDEX IF EXISTS idx_user_nav_mode_history_mode;
  `);
  console.log('[047] Dropped performance indexes');

  // ⚠️ NOTE: We do NOT rollback header_height to TEXT (defensive strategy)
  // Previous data integrity is preserved as INTEGER
  // CHECK constraint also left in place (forward-compatible)

  console.log('[047] ✅ Migration DOWN complete (defensive - header_height data preserved)');
}
