/**
 * Update History Service für RawaLite
 * 
 * Verwaltet die Audit-Trail Funktionalität für App-Updates.
 * Protokolliert alle Update-Checks, Downloads und Installationen für Debugging und Compliance.
 * 
 * @version 1.0.13
 * @author RawaLite Team
 * @since Update System Enhancement (Phase 1)
 */

import type { Database } from 'better-sqlite3';
import { randomBytes } from 'crypto';

export type UpdateEventType = 
  | 'check_started' | 'check_completed' | 'check_failed'
  | 'download_started' | 'download_progress' | 'download_completed' | 'download_failed'
  | 'install_started' | 'install_completed' | 'install_failed'
  | 'update_skipped' | 'update_postponed';

export type UserActionType = 'automatic' | 'manual' | 'scheduled';

export interface UpdateHistoryEntry {
  id?: number;
  timestamp: string;
  session_id: string;
  event_type: UpdateEventType;
  current_version: string;
  target_version?: string;
  success?: boolean;
  error_message?: string;
  error_code?: string;
  progress_percent?: number;
  duration_ms?: number;
  user_action?: UserActionType;
  download_url?: string;
  file_size_bytes?: number;
  file_hash?: string;
  platform?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateHistoryFilter {
  session_id?: string;
  event_type?: UpdateEventType;
  current_version?: string;
  target_version?: string;
  success?: boolean;
  user_action?: UserActionType;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Update History Service für Audit-Trail Funktionalität
 */
export class UpdateHistoryService {
  private db: Database;
  private currentSessionId: string;

  constructor(database: Database) {
    this.db = database;
    this.currentSessionId = this.generateSessionId();
  }

  /**
   * Generiert eine eindeutige Session-ID für diese App-Instanz
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Fügt einen neuen Update-History Eintrag hinzu
   */
  addEntry(entry: Omit<UpdateHistoryEntry, 'id' | 'session_id' | 'timestamp' | 'created_at' | 'updated_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO update_history (
        session_id, event_type, current_version, target_version,
        success, error_message, error_code, progress_percent, duration_ms,
        user_action, download_url, file_size_bytes, file_hash, platform
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      this.currentSessionId,
      entry.event_type,
      entry.current_version,
      entry.target_version,
      entry.success,
      entry.error_message,
      entry.error_code,
      entry.progress_percent,
      entry.duration_ms,
      entry.user_action,
      entry.download_url,
      entry.file_size_bytes,
      entry.file_hash,
      entry.platform || process.platform
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update-History Einträge abrufen mit optionaler Filterung
   */
  getEntries(filter: UpdateHistoryFilter = {}): UpdateHistoryEntry[] {
    let query = 'SELECT * FROM update_history WHERE 1=1';
    const params: any[] = [];

    if (filter.session_id) {
      query += ' AND session_id = ?';
      params.push(filter.session_id);
    }

    if (filter.event_type) {
      query += ' AND event_type = ?';
      params.push(filter.event_type);
    }

    if (filter.current_version) {
      query += ' AND current_version = ?';
      params.push(filter.current_version);
    }

    if (filter.target_version) {
      query += ' AND target_version = ?';
      params.push(filter.target_version);
    }

    if (filter.success !== undefined) {
      query += ' AND success = ?';
      params.push(filter.success);
    }

    if (filter.user_action) {
      query += ' AND user_action = ?';
      params.push(filter.user_action);
    }

    if (filter.from_date) {
      query += ' AND timestamp >= ?';
      params.push(filter.from_date);
    }

    if (filter.to_date) {
      query += ' AND timestamp <= ?';
      params.push(filter.to_date);
    }

    query += ' ORDER BY timestamp DESC';

    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    if (filter.offset) {
      query += ' OFFSET ?';
      params.push(filter.offset);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as UpdateHistoryEntry[];
  }

  /**
   * Aktuelle Session-ID abrufen
   */
  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Update-History Statistiken
   */
  getStatistics(): {
    total_entries: number;
    successful_updates: number;
    failed_updates: number;
    last_successful_update?: string;
    last_check?: string;
  } {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(CASE WHEN event_type = 'install_completed' AND success = 1 THEN 1 ELSE 0 END) as successful_updates,
        SUM(CASE WHEN event_type LIKE '%_failed' THEN 1 ELSE 0 END) as failed_updates,
        MAX(CASE WHEN event_type = 'install_completed' AND success = 1 THEN timestamp END) as last_successful_update,
        MAX(CASE WHEN event_type = 'check_completed' THEN timestamp END) as last_check
      FROM update_history
    `).get() as any;

    return {
      total_entries: stats.total_entries || 0,
      successful_updates: stats.successful_updates || 0,
      failed_updates: stats.failed_updates || 0,
      last_successful_update: stats.last_successful_update,
      last_check: stats.last_check
    };
  }

  /**
   * Alte Update-History Einträge bereinigen (älter als X Tage)
   */
  cleanupOldEntries(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const stmt = this.db.prepare(`
      DELETE FROM update_history 
      WHERE timestamp < ?
    `);

    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * Update-Session erfolgreich abschließen
   */
  markSessionComplete(success: boolean = true): void {
    const stmt = this.db.prepare(`
      UPDATE update_history 
      SET success = ?, updated_at = datetime('now')
      WHERE session_id = ? AND success IS NULL
    `);

    stmt.run(success, this.currentSessionId);
  }
}

export default UpdateHistoryService;