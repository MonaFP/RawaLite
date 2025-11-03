// src/main/db/Database.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let instance: Database.Database | null = null;

/**
 * Get database file path - synchronous for main process
 * ✅ FIX-1.1: isDev differentiation implemented
 * Dev: rawalite-dev.db (development database)
 * Prod: rawalite.db (production database)
 */
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged; // ✅ FIX-1.1: Environment detection
  const dbFileName = isDev ? 'rawalite-dev.db' : 'rawalite.db'; // ✅ Dev/Prod separation
  return path.join(userData, 'database', dbFileName);
}

/**
 * Get singleton Database instance with proper PRAGMAs
 */
export function getDb(): Database.Database {
  if (instance) return instance;
  
  const dbFile = getDbPath();
  const dbDir = path.dirname(dbFile);
  
  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('🗄️ [DB] Created database directory:', dbDir);
  }
  
  console.log('🗄️ [DB] Opening database:', dbFile);
  
  const db = new Database(dbFile, { 
    fileMustExist: false,
    verbose: console.log 
  });
  
  // Set critical PRAGMAs for safety and performance
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('temp_store = MEMORY');
  
  console.log('🗄️ [DB] PRAGMAs configured:');
  console.log('  - foreign_keys:', db.pragma('foreign_keys', { simple: true }));
  console.log('  - journal_mode:', db.pragma('journal_mode', { simple: true }));
  console.log('  - synchronous:', db.pragma('synchronous', { simple: true }));
  console.log('  - temp_store:', db.pragma('temp_store', { simple: true }));
  
  instance = db;
  return db;
}

/**
 * Get database schema version
 */
export function getUserVersion(): number {
  return getDb().pragma('user_version', { simple: true }) as number;
}

/**
 * Set database schema version
 */
export function setUserVersion(version: number): void {
  getDb().pragma(`user_version = ${version}`);
  console.log(`🗄️ [DB] Schema version set to: ${version}`);
}

/**
 * Execute function in transaction
 */
export function tx<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction(db);
}

/**
 * Execute SQL statement
 */
export function exec(sql: string, params?: unknown[]): Database.RunResult {
  const db = getDb();
  if (params) {
    return db.prepare(sql).run(params);
  }
  // For exec without params, we need to run each statement
  const statements = sql.split(';').filter(s => s.trim());
  let result: Database.RunResult = { changes: 0, lastInsertRowid: 0 };
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      const runResult = db.prepare(stmt).run();
      result.changes += runResult.changes;
      if (runResult.lastInsertRowid > 0) {
        result.lastInsertRowid = runResult.lastInsertRowid;
      }
    }
  }
  
  return result;
}

/**
 * Prepare statement for reuse
 */
export function prepare(sql: string): Database.Statement {
  return getDb().prepare(sql);
}

/**
 * Close database connection
 */
export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
    console.log('🗄️ [DB] Database connection closed');
  }
}