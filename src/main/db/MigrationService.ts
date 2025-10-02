// src/main/db/MigrationService.ts
import { getDb, getUserVersion, setUserVersion, tx, closeDb } from './Database';
import { migrations } from './migrations/index';
import type { Migration } from './migrations/index';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/**
 * Create cold backup before migration (VACUUM INTO)
 */
function createPreMigrationBackup(): string | null {
  try {
    const userData = app.getPath('userData');
    const backupDir = path.join(userData, 'database', 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `pre-migration-${timestamp}.sqlite`);
    
    const db = getDb();
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
    
    console.log(`🗄️ [Migration] Cold backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('🗄️ [Migration] Failed to create pre-migration backup:', error);
    return null;
  }
}

/**
 * Run all pending migrations
 */
export async function runAllMigrations(): Promise<void> {
  const currentVersion = getUserVersion();
  const targetVersion = Math.max(...migrations.map(m => m.version));
  
  console.log(`🗄️ [Migration] Current schema version: ${currentVersion}`);
  console.log(`🗄️ [Migration] Target schema version: ${targetVersion}`);
  
  if (currentVersion >= targetVersion) {
    console.log('🗄️ [Migration] Database is up to date');
    return;
  }
  
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);
  
  if (pendingMigrations.length === 0) {
    console.log('🗄️ [Migration] No pending migrations');
    return;
  }
  
  console.log(`🗄️ [Migration] Running ${pendingMigrations.length} pending migrations`);
  
  // Create cold backup before starting migrations
  const backupPath = createPreMigrationBackup();
  if (!backupPath) {
    console.warn('🗄️ [Migration] Proceeding without backup (risky!)');
  }
  
  try {
    // Run all pending migrations in a single transaction
    tx((db) => {
      for (const migration of pendingMigrations) {
        console.log(`🗄️ [Migration] Running migration ${migration.version}: ${migration.name}`);
        
        try {
          migration.up(db);
          console.log(`🗄️ [Migration] ✅ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`🗄️ [Migration] ❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
      
      // Update schema version after all migrations succeed
      setUserVersion(targetVersion);
    });
    
    console.log(`🗄️ [Migration] ✅ All migrations completed successfully`);
    console.log(`🗄️ [Migration] Schema updated to version ${targetVersion}`);
    
  } catch (error) {
    console.error('🗄️ [Migration] ❌ Migration failed, database rolled back:', error);
    
    // If we have a backup and migrations failed, offer to restore
    if (backupPath && fs.existsSync(backupPath)) {
      console.log(`🗄️ [Migration] 💾 Backup available at: ${backupPath}`);
      console.log(`🗄️ [Migration] To restore: Stop app, replace database file, restart`);
    }
    
    throw error;
  }
}

/**
 * Rollback to specific version (for development/testing)
 */
export async function rollbackToVersion(targetVersion: number): Promise<void> {
  const currentVersion = getUserVersion();
  
  if (targetVersion >= currentVersion) {
    console.log(`🗄️ [Migration] Already at or below version ${targetVersion}`);
    return;
  }
  
  console.log(`🗄️ [Migration] Rolling back from ${currentVersion} to ${targetVersion}`);
  
  // Create backup before rollback
  const backupPath = createPreMigrationBackup();
  
  try {
    const migrationsToRollback = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Rollback in reverse order
    
    tx((db) => {
      for (const migration of migrationsToRollback) {
        if (!migration.down) {
          throw new Error(`Migration ${migration.version} has no down migration`);
        }
        
        console.log(`🗄️ [Migration] Rolling back migration ${migration.version}: ${migration.name}`);
        migration.down(db);
        console.log(`🗄️ [Migration] ✅ Rollback ${migration.version} completed`);
      }
      
      setUserVersion(targetVersion);
    });
    
    console.log(`🗄️ [Migration] ✅ Rollback completed to version ${targetVersion}`);
    
  } catch (error) {
    console.error('🗄️ [Migration] ❌ Rollback failed:', error);
    
    if (backupPath && fs.existsSync(backupPath)) {
      console.log(`🗄️ [Migration] 💾 Backup available at: ${backupPath}`);
    }
    
    throw error;
  }
}

/**
 * Get migration status
 */
export function getMigrationStatus(): {
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: Migration[];
} {
  const currentVersion = getUserVersion();
  const targetVersion = Math.max(...migrations.map(m => m.version), 0);
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);
  
  return {
    currentVersion,
    targetVersion,
    pendingMigrations
  };
}

/**
 * Validate database schema
 */
export function validateSchema(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const db = getDb();
    
    // Check if required tables exist
    const requiredTables = ['settings', 'customers', 'offers', 'invoices', 'packages', 'numbering_circles'];
    
    for (const table of requiredTables) {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table);
      
      if (!result) {
        errors.push(`Missing required table: ${table}`);
      }
    }
    
    // Check foreign key constraints are enabled
    const fkCheck = db.pragma('foreign_keys', { simple: true });
    if (!fkCheck) {
      errors.push('Foreign key constraints are not enabled');
    }
    
    // Check journal mode
    const journalMode = db.pragma('journal_mode', { simple: true });
    if (journalMode !== 'wal') {
      errors.push(`Journal mode is ${journalMode}, expected 'wal'`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    errors.push(`Schema validation failed: ${error}`);
    return {
      valid: false,
      errors
    };
  }
}