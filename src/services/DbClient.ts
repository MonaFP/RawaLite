// src/services/DbClient.ts
import { LoggingService } from './LoggingService.js';
import { convertSQLQuery, mapToSQL, mapFromSQLArray, mapFromSQL } from '../lib/field-mapper.js';

/**
 * Client-side wrapper for database operations via IPC
 * Provides a clean API for renderer process database access
 */
export class DbClient {
  private static instance: DbClient | null = null;

  private constructor() {
    this.validateDatabaseAPI();
  }

  /**
   * Validate that database API is available
   * In test environment, this check is skipped
   */
  private validateDatabaseAPI(): void {
    // Skip validation in test environment
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'test') {
      return;
    }
    
    // Skip validation in Vitest environment
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.VITEST === 'true') {
      return;
    }
    
    if (typeof window === 'undefined' || !window.rawalite?.db?.query) {
      throw new Error('Database API not available - check preload script');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DbClient {
    if (!DbClient.instance) {
      DbClient.instance = new DbClient();
    }
    return DbClient.instance;
  }

  /**
   * Get database API abstracted for testing
   */
  private getDatabaseAPI(): any {
    // In test environment, return mock from global window
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'test') {
      return (globalThis as any).window?.rawalite?.db;
    }
    
    // In Vitest environment, return mock from global window
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.VITEST === 'true') {
      return (globalThis as any).window?.rawalite?.db;
    }
    
    // In production/browser environment
    return window.rawalite.db;
  }

  /**
   * Execute a SELECT query and return rows
   * Automatically converts SQL to snake_case and results to camelCase
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      // Step 1: Convert SQL query camelCase → snake_case
      const mappedSQL = convertSQLQuery(sql);
      
      // Step 2: Parameter arrays sollten NICHT gemappt werden für prepared statements
      // Das mapping erfolgt nur für Object-Parameters in komplexeren Operationen
      const mappedParams = params; // Für prepared statements: Parameter bleiben unverändert

      console.log('DbClient.query', { originalSQL: sql, mappedSQL, params: mappedParams });
      
      // Step 3: Execute with mapped data
      const result = await this.getDatabaseAPI().query(mappedSQL, mappedParams);
      
      // Step 4: Convert results snake_case → camelCase
      const mappedResult = mapFromSQLArray(result) as T[];
      
      console.log('DbClient.query result', { rawCount: result.length, mappedCount: mappedResult.length });
      return mappedResult;
    } catch (error) {
      await LoggingService.logError(error as Error, 'DbClient.query failed');
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement
   * Automatically converts SQL to snake_case and parameters
   */
  async exec(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
    try {
      // Step 1: Convert SQL query camelCase → snake_case
      const mappedSQL = convertSQLQuery(sql);
      
      // Step 2: Parameter arrays für prepared statements bleiben unverändert
      const mappedParams = params; // Prepared statement params sind primitive values

      console.log('DbClient.exec', { originalSQL: sql, mappedSQL, params: mappedParams });
      
      // Step 3: Execute with mapped data
      const result = await this.getDatabaseAPI().exec(mappedSQL, mappedParams);
      
      console.log('DbClient.exec result', result);
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'DbClient.exec failed');
      throw error;
    }
  }

  /**
   * Execute multiple statements in a transaction
   * Automatically converts SQL and parameters for all queries
   */
  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<any[]> {
    try {
      // Step 1: Map all queries (nur SQL, params bleiben unverändert für prepared statements)
      const mappedQueries = queries.map(query => {
        const mappedSQL = convertSQLQuery(query.sql);
        return { sql: mappedSQL, params: query.params }; // params bleiben unverändert
      });

      console.log('DbClient.transaction', { 
        originalQueryCount: queries.length, 
        mappedQueryCount: mappedQueries.length 
      });
      
      // Step 2: Execute transaction with mapped data
      const results = await this.getDatabaseAPI().transaction(mappedQueries);
      
      console.log('DbClient.transaction results', { resultCount: results.length });
      return results;
    } catch (error) {
      await LoggingService.logError(error as Error, 'DbClient.transaction failed');
      throw error;
    }
  }

  // Convenience methods for common operations

  /**
   * Insert a single row and return the new ID
   * Automatically converts field names to snake_case
   */
  async insert(table: string, data: Record<string, any>): Promise<number> {
    // Convert data camelCase → snake_case
    const mappedData = mapToSQL(data);
    const columns = Object.keys(mappedData);
    const values = Object.values(mappedData);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await this.exec(sql, values);
    return result.lastInsertRowid;
  }

  /**
   * Update rows by ID
   * Automatically converts field names to snake_case
   */
  async updateById(table: string, id: number, data: Record<string, any>): Promise<number> {
    // Convert data camelCase → snake_case
    const mappedData = mapToSQL(data);
    const columns = Object.keys(mappedData);
    const values = Object.values(mappedData);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const result = await this.exec(sql, [...values, id]);
    return result.changes;
  }

  /**
   * Delete rows by ID
   */
  async deleteById(table: string, id: number): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.exec(sql, [id]);
    return result.changes;
  }

  /**
   * Get a single row by ID
   * Automatically converts results to camelCase
   */
  async getById<T = any>(table: string, id: number): Promise<T | null> {
    const rows = await this.query<T>(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all rows from a table
   * Automatically converts results to camelCase
   */
  async getAll<T = any>(table: string, orderBy?: string): Promise<T[]> {
    const sql = `SELECT * FROM ${table}${orderBy ? ` ORDER BY ${orderBy}` : ''}`;
    return await this.query<T>(sql);
  }

  /**
   * Count rows in a table
   */
  async count(table: string, where?: string, params?: any[]): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${table}${where ? ` WHERE ${where}` : ''}`;
    const result = await this.query<{ count: number }>(sql, params);
    return result[0]?.count || 0;
  }

  /**
   * Check if a row exists
   */
  async exists(table: string, where: string, params?: any[]): Promise<boolean> {
    const count = await this.count(table, where, params);
    return count > 0;
  }
}

export default DbClient;