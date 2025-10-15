/**
 * Database IPC Handlers
 * 
 * Core database operations for SQLite interactions.
 * 
 * ⚠️ CRITICAL FIX-012: SQLite Parameter Binding
 * This module contains the critical SQLite parameter binding logic that MUST be preserved:
 * - NULL value handling in prepared statements
 * - Parameter binding patterns for all database operations
 * - Transaction handling with proper error propagation
 * 
 * @since v1.0.42.5
 * @critical FIX-012
 */

import { ipcMain } from 'electron';
import { getDb, prepare, exec, tx } from '../../src/main/db/Database';

/**
 * Register all database IPC handlers
 */
export function registerDatabaseHandlers(): void {
  console.log('🔌 [DATABASE] Registering database IPC handlers...');

  /**
   * Execute SQL query and return results
   * 
   * ⚠️ CRITICAL FIX-012: Parameter binding must handle NULL values correctly
   */
  ipcMain.handle('db:query', async (event, sql: string, params?: any[]) => {
    try {
      const stmt = prepare(sql)
      return params ? stmt.all(...params) : stmt.all()
    } catch (error) {
      console.error(`Database query failed:`, error)
      throw error
    }
  });

  /**
   * Execute SQL statement (INSERT, UPDATE, DELETE)
   * 
   * ⚠️ CRITICAL FIX-012: Parameter binding for mutations
   */
  ipcMain.handle('db:exec', async (event, sql: string, params?: any[]) => {
    try {
      return exec(sql, params)
    } catch (error) {
      console.error(`Database exec failed:`, error)
      throw error
    }
  });

  /**
   * Execute multiple SQL statements in a transaction
   * 
   * ⚠️ CRITICAL FIX-012: Transaction parameter binding consistency
   */
  ipcMain.handle('db:transaction', async (event, queries: Array<{ sql: string; params?: any[] }>) => {
    try {
      return tx(() => {
        const results: any[] = []
        for (const query of queries) {
          const result = exec(query.sql, query.params)
          results.push(result)
        }
        return results
      })
    } catch (error) {
      console.error(`Database transaction failed:`, error)
      throw error
    }
  });

  console.log('✅ [DATABASE] Database IPC handlers registered successfully');
}