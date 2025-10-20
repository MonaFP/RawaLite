/**
 * DatabaseFocusModeService - Database-First Focus Mode Management
 * 
 * Provides database-backed Focus Mode preferences with type safety and field mapping.
 * Follows the same architecture pattern as DatabaseThemeService and DatabaseNavigationService.
 * 
 * Features:
 * - Database-first with localStorage fallback
 * - Cross-device synchronization  
 * - Usage analytics and session tracking
 * - Auto-restore configuration
 * - Field mapping for SQL safety
 * 
 * @author GitHub Copilot
 * @date 2025-10-20
 * @migration 029
 */

import Database from 'better-sqlite3';
import { convertSQLQuery } from '../../lib/field-mapper';

export type FocusVariant = 'zen' | 'mini' | 'free';

export interface FocusPreferences {
  id?: number;
  userId: string;
  focusModeActive: boolean;
  focusModeVariant: FocusVariant | null;
  autoRestore: boolean;
  lastSessionVariant: FocusVariant | null;
  sessionCount: number;
  totalFocusTime: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FocusSession {
  id?: number;
  userId: string;
  focusModeVariant: FocusVariant;
  sessionStart: string;
  sessionEnd?: string;
  sessionDuration: number;
  sessionId?: string;
  navigationMode?: string;
  themeName?: string;
}

export interface FocusAnalytics {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionTime: number;
  mostUsedVariant: FocusVariant;
  variantUsageStats: Record<FocusVariant, { count: number; totalTime: number }>;
  lastUsed?: string;
}

export class DatabaseFocusModeService {
  private db: Database.Database;
  private statements: Record<string, Database.Statement | null> = {};

  constructor(database: Database.Database) {
    this.db = database;
    this.prepareStatements();
  }

  /**
   * Prepare all SQL statements with field mapping for performance and security
   */
  private prepareStatements(): void {
    try {
      // Focus preferences CRUD operations
      this.statements.getUserPreferences = this.db.prepare(
        convertSQLQuery('SELECT * FROM user_focus_preferences WHERE user_id = ?')
      );
      
      this.statements.createUserPreferences = this.db.prepare(
        convertSQLQuery(`
          INSERT INTO user_focus_preferences (
            user_id, focus_mode_active, focus_mode_variant, auto_restore,
            last_session_variant, session_count, total_focus_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
      );
      
      this.statements.updateUserPreferences = this.db.prepare(
        convertSQLQuery(`
          UPDATE user_focus_preferences 
          SET focus_mode_active = ?, focus_mode_variant = ?, auto_restore = ?,
              last_session_variant = ?, session_count = ?, total_focus_time = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
      );
      
      this.statements.setFocusMode = this.db.prepare(
        convertSQLQuery(`
          UPDATE user_focus_preferences 
          SET focus_mode_active = ?, focus_mode_variant = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
      );
      
      this.statements.incrementSessionCount = this.db.prepare(
        convertSQLQuery(`
          UPDATE user_focus_preferences 
          SET session_count = session_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `)
      );
      
      // Focus history operations
      this.statements.createSession = this.db.prepare(
        convertSQLQuery(`
          INSERT INTO focus_mode_history (
            user_id, focus_mode_variant, session_start, session_id, navigation_mode, theme_name
          ) VALUES (?, ?, ?, ?, ?, ?)
        `)
      );
      
      this.statements.endSession = this.db.prepare(
        convertSQLQuery(`
          UPDATE focus_mode_history 
          SET session_end = CURRENT_TIMESTAMP, 
              session_duration = (strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', session_start))
          WHERE session_id = ? AND session_end IS NULL
        `)
      );
      
      this.statements.getSessionHistory = this.db.prepare(
        convertSQLQuery(`
          SELECT * FROM focus_mode_history 
          WHERE user_id = ? ORDER BY session_start DESC LIMIT ?
        `)
      );
      
      this.statements.getAnalytics = this.db.prepare(
        convertSQLQuery(`
          SELECT 
            COUNT(*) as total_sessions,
            COALESCE(SUM(session_duration), 0) as total_focus_time,
            COALESCE(AVG(session_duration), 0) as average_session_time,
            focus_mode_variant,
            MAX(session_start) as last_used
          FROM focus_mode_history 
          WHERE user_id = ? 
          GROUP BY focus_mode_variant
        `)
      );
      
      console.log('🎯 [DatabaseFocusModeService] SQL statements prepared successfully');
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error preparing statements:', error);
      throw error;
    }
  }

  /**
   * Get user's focus mode preferences
   */
  async getUserFocusPreferences(userId: string = 'default'): Promise<FocusPreferences | null> {
    try {
      const row = this.statements.getUserPreferences!.get(userId) as any;
      if (!row) return null;
      
      return {
        id: row.id,
        userId: row.user_id,
        focusModeActive: Boolean(row.focus_mode_active),
        focusModeVariant: row.focus_mode_variant as FocusVariant | null,
        autoRestore: Boolean(row.auto_restore),
        lastSessionVariant: row.last_session_variant as FocusVariant | null,
        sessionCount: row.session_count || 0,
        totalFocusTime: row.total_focus_time || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Set focus mode state (active/inactive with variant)
   */
  async setFocusMode(userId: string = 'default', active: boolean, variant: FocusVariant | null = null): Promise<boolean> {
    try {
      const result = this.statements.setFocusMode!.run(active ? 1 : 0, variant, userId);
      
      if (result.changes === 0) {
        // User preferences don't exist, create them
        await this.createUserPreferences(userId, active, variant);
      }
      
      return true;
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error setting focus mode:', error);
      return false;
    }
  }

  /**
   * Update auto-restore preference
   */
  async setAutoRestore(userId: string = 'default', autoRestore: boolean): Promise<boolean> {
    try {
      const preferences = await this.getUserFocusPreferences(userId);
      if (!preferences) {
        return await this.createUserPreferences(userId, false, null, autoRestore);
      }
      
      const result = this.statements.updateUserPreferences!.run(
        preferences.focusModeActive ? 1 : 0,
        preferences.focusModeVariant,
        autoRestore ? 1 : 0,
        preferences.lastSessionVariant,
        preferences.sessionCount,
        preferences.totalFocusTime,
        userId
      );
      
      return result.changes > 0;
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error setting auto-restore:', error);
      return false;
    }
  }

  /**
   * Start a new focus session
   */
  async startFocusSession(
    userId: string = 'default', 
    variant: FocusVariant, 
    sessionId: string,
    navigationMode?: string,
    themeName?: string
  ): Promise<boolean> {
    try {
      // Set focus mode active
      await this.setFocusMode(userId, true, variant);
      
      // Create session record
      this.statements.createSession!.run(
        userId, 
        variant, 
        new Date().toISOString(), 
        sessionId,
        navigationMode || null,
        themeName || null
      );
      
      // Increment session count
      this.statements.incrementSessionCount!.run(userId);
      
      return true;
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error starting focus session:', error);
      return false;
    }
  }

  /**
   * End current focus session
   */
  async endFocusSession(sessionId: string): Promise<boolean> {
    try {
      const result = this.statements.endSession!.run(sessionId);
      return result.changes > 0;
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error ending focus session:', error);
      return false;
    }
  }

  /**
   * Get focus mode analytics for user
   */
  async getFocusAnalytics(userId: string = 'default'): Promise<FocusAnalytics> {
    try {
      const rows = this.statements.getAnalytics!.all(userId) as any[];
      
      if (rows.length === 0) {
        return {
          totalSessions: 0,
          totalFocusTime: 0,
          averageSessionTime: 0,
          mostUsedVariant: 'zen',
          variantUsageStats: { zen: { count: 0, totalTime: 0 }, mini: { count: 0, totalTime: 0 }, free: { count: 0, totalTime: 0 } }
        };
      }
      
      const variantStats: Record<FocusVariant, { count: number; totalTime: number }> = {
        zen: { count: 0, totalTime: 0 },
        mini: { count: 0, totalTime: 0 },
        free: { count: 0, totalTime: 0 }
      };
      
      let totalSessions = 0;
      let totalFocusTime = 0;
      let mostUsedVariant: FocusVariant = 'zen';
      let maxCount = 0;
      let lastUsed: string | undefined;
      
      for (const row of rows) {
        const variant = row.focus_mode_variant as FocusVariant;
        const count = row.total_sessions || 0;
        const time = row.total_focus_time || 0;
        
        variantStats[variant] = { count, totalTime: time };
        totalSessions += count;
        totalFocusTime += time;
        
        if (count > maxCount) {
          maxCount = count;
          mostUsedVariant = variant;
        }
        
        if (!lastUsed || row.last_used > lastUsed) {
          lastUsed = row.last_used;
        }
      }
      
      return {
        totalSessions,
        totalFocusTime,
        averageSessionTime: totalSessions > 0 ? totalFocusTime / totalSessions : 0,
        mostUsedVariant,
        variantUsageStats: variantStats,
        lastUsed
      };
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error getting analytics:', error);
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        averageSessionTime: 0,
        mostUsedVariant: 'zen',
        variantUsageStats: { zen: { count: 0, totalTime: 0 }, mini: { count: 0, totalTime: 0 }, free: { count: 0, totalTime: 0 } }
      };
    }
  }

  /**
   * Reset user preferences to defaults
   */
  async resetFocusPreferences(userId: string = 'default'): Promise<boolean> {
    try {
      return await this.createUserPreferences(userId, false, null, false);
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Create new user preferences
   */
  private async createUserPreferences(
    userId: string, 
    active: boolean = false, 
    variant: FocusVariant | null = null,
    autoRestore: boolean = false
  ): Promise<boolean> {
    try {
      this.statements.createUserPreferences!.run(
        userId, 
        active ? 1 : 0, 
        variant, 
        autoRestore ? 1 : 0,
        null, // lastSessionVariant
        0,    // sessionCount
        0     // totalFocusTime
      );
      return true;
    } catch (error) {
      // If user already exists, update instead
      if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
        const result = this.statements.updateUserPreferences!.run(
          active ? 1 : 0,
          variant,
          autoRestore ? 1 : 0,
          null, // lastSessionVariant
          0,    // sessionCount
          0,    // totalFocusTime
          userId
        );
        return result.changes > 0;
      }
      
      console.error('[DatabaseFocusModeService] Error creating user preferences:', error);
      return false;
    }
  }

  /**
   * Validate focus mode schema exists
   */
  async validateFocusSchema(): Promise<boolean> {
    try {
      // Check if focus mode tables exist
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('user_focus_preferences', 'focus_mode_history')
      `).all();
      
      return tables.length === 2;
    } catch (error: unknown) {
      console.error('[DatabaseFocusModeService] Schema validation error:', error);
      return false;
    }
  }
}