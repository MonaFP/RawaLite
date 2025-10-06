/**
 * Migration 017: Update History Tracking
 * 
 * Fügt eine Tabelle für App-Update-History hinzu zur Audit-Trail Funktionalität.
 * Trackt alle Update-Checks, Downloads und Installationen für Debugging und Compliance.
 * 
 * @version 1.0.13
 * @since Update System Enhancement (Phase 1)
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  // Create update_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS update_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Basic tracking info
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN (
        'check_started', 'check_completed', 'check_failed',
        'download_started', 'download_progress', 'download_completed', 'download_failed',
        'install_started', 'install_completed', 'install_failed',
        'update_skipped', 'update_postponed'
      )),
      
      -- Version information
      current_version TEXT NOT NULL,
      target_version TEXT,
      
      -- Status and results
      success BOOLEAN,
      error_message TEXT,
      error_code TEXT,
      
      -- Progress and timing
      progress_percent INTEGER DEFAULT 0,
      duration_ms INTEGER,
      
      -- Additional metadata
      user_action TEXT CHECK (user_action IN ('automatic', 'manual', 'scheduled')),
      download_url TEXT,
      file_size_bytes INTEGER,
      file_hash TEXT,
      
      -- System context
      platform TEXT DEFAULT (CASE 
        WHEN EXISTS (SELECT 1 FROM pragma_compile_options WHERE compile_options = 'ENABLE_COLUMN_METADATA') 
        THEN 'unknown' 
        ELSE 'unknown' 
      END),
      
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indices for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_update_history_timestamp ON update_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_update_history_session ON update_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_update_history_event_type ON update_history(event_type);
    CREATE INDEX IF NOT EXISTS idx_update_history_versions ON update_history(current_version, target_version);
  `);

  // Create trigger for automatic updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_history_updated_at
    AFTER UPDATE ON update_history
    FOR EACH ROW
    BEGIN
      UPDATE update_history 
      SET updated_at = datetime('now')
      WHERE id = NEW.id;
    END;
  `);

  console.log('✅ Migration 017: Update History table created with audit trail support');
}

export function down(db: Database): void {
  db.exec('DROP TRIGGER IF EXISTS update_history_updated_at;');
  db.exec('DROP INDEX IF EXISTS idx_update_history_versions;');
  db.exec('DROP INDEX IF EXISTS idx_update_history_event_type;');
  db.exec('DROP INDEX IF EXISTS idx_update_history_session;');
  db.exec('DROP INDEX IF EXISTS idx_update_history_timestamp;');
  db.exec('DROP TABLE IF EXISTS update_history;');
  
  console.log('✅ Migration 017: Update History table removed');
}