// src/main/db/BackupService.ts
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { getDb, closeDb } from './Database';

/**
 * Get backup directory path
 */
function getBackupDir(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'database', 'backups');
}

/**
 * Get database file path
 * ✅ FIX-1.2: Dev/Prod Database Separation (matching Database.ts)
 * Dev: rawalite-dev.db (development database)
 * Prod: rawalite.db (production database)
 */
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged; // ✅ Environment detection (matches Database.ts)
  
  if (isDev) {
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else {
    return path.join(userData, 'database', 'rawalite.db');
  }
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

/**
 * Create hot backup using better-sqlite3 backup API
 */
export async function createHotBackup(targetPath?: string): Promise<{
  path: string;
  bytes: number;
  durationMs: number;
}> {
  const start = Date.now();
  
  ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `hot-backup-${timestamp}.sqlite`;
  const backupPath = targetPath ?? path.join(getBackupDir(), fileName);
  
  // Ensure target directory exists
  const targetDir = path.dirname(backupPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  console.log(`💾 [Backup] Creating hot backup to: ${backupPath}`);
  
  try {
    const db = getDb();
    
    // Use better-sqlite3 backup API for consistent snapshot
    await new Promise<void>((resolve, reject) => {
      const backup = db.backup(backupPath);
      
      backup.then(() => {
        console.log('💾 [Backup] Hot backup completed successfully');
        resolve();
      }).catch((error) => {
        console.error('💾 [Backup] Hot backup failed:', error);
        reject(error);
      });
    });
    
    const bytes = fs.statSync(backupPath).size;
    const durationMs = Date.now() - start;
    
    console.log(`💾 [Backup] Hot backup created: ${bytes} bytes in ${durationMs}ms`);
    
    return {
      path: backupPath,
      bytes,
      durationMs
    };
    
  } catch (error) {
    console.error('💾 [Backup] Hot backup failed:', error);
    
    // Clean up failed backup file
    if (fs.existsSync(backupPath)) {
      try {
        fs.unlinkSync(backupPath);
      } catch (unlinkError) {
        console.warn('💾 [Backup] Failed to clean up failed backup file:', unlinkError);
      }
    }
    
    throw error;
  }
}

/**
 * Create compact backup using VACUUM INTO
 */
export function createVacuumBackup(targetPath: string): Promise<{
  path: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`💾 [Backup] Creating VACUUM backup to: ${targetPath}`);
      
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const db = getDb();
      
      // Use VACUUM INTO for compact backup
      db.exec(`VACUUM INTO '${targetPath.replace(/'/g, "''")}'`);
      
      const bytes = fs.statSync(targetPath).size;
      
      console.log(`💾 [Backup] VACUUM backup created: ${bytes} bytes`);
      
      resolve({
        path: targetPath,
        bytes
      });
      
    } catch (error) {
      console.error('💾 [Backup] VACUUM backup failed:', error);
      
      // Clean up failed backup file
      if (fs.existsSync(targetPath)) {
        try {
          fs.unlinkSync(targetPath);
        } catch (unlinkError) {
          console.warn('💾 [Backup] Failed to clean up failed VACUUM backup:', unlinkError);
        }
      }
      
      reject(error);
    }
  });
}

/**
 * Perform database integrity check
 */
export function checkIntegrity(): {
  ok: boolean;
  details: string;
  errors: string[];
} {
  try {
    console.log('🔍 [Backup] Running integrity check...');
    
    const db = getDb();
    
    // Run PRAGMA integrity_check
    const integrityResults = db.prepare('PRAGMA integrity_check').all() as Array<{integrity_check: string}>;
    
    // Run PRAGMA foreign_key_check  
    const fkResults = db.prepare('PRAGMA foreign_key_check').all() as Array<any>;
    
    const errors: string[] = [];
    
    // Check integrity results
    const integrityOk = integrityResults.length === 1 && integrityResults[0].integrity_check === 'ok';
    if (!integrityOk) {
      errors.push(...integrityResults.map(r => r.integrity_check));
    }
    
    // Check foreign key results
    if (fkResults.length > 0) {
      errors.push(...fkResults.map(r => `FK violation: ${JSON.stringify(r)}`));
    }
    
    const ok = errors.length === 0;
    
    console.log(`🔍 [Backup] Integrity check completed: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) {
      console.error('🔍 [Backup] Integrity errors:', errors);
    }
    
    return {
      ok,
      details: JSON.stringify({
        integrity: integrityResults,
        foreignKeys: fkResults,
        timestamp: new Date().toISOString()
      }, null, 2),
      errors
    };
    
  } catch (error) {
    console.error('🔍 [Backup] Integrity check failed:', error);
    
    return {
      ok: false,
      details: `Integrity check failed: ${error}`,
      errors: [`Integrity check error: ${error}`]
    };
  }
}

/**
 * Restore database from backup
 * WARNING: This closes the current database and requires app restart
 */
export function restoreFromBackup(sourcePath: string): {
  needsRestart: boolean;
  message: string;
} {
  try {
    console.log(`🔄 [Backup] Restoring database from: ${sourcePath}`);
    
    // Validate source file exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Backup file not found: ${sourcePath}`);
    }
    
    // Validate source is within backup directory (security)
    const backupDir = getBackupDir();
    const resolvedSource = path.resolve(sourcePath);
    const resolvedBackupDir = path.resolve(backupDir);
    
    if (!resolvedSource.startsWith(resolvedBackupDir)) {
      throw new Error(`Restore source must be within backup directory: ${backupDir}`);
    }
    
    // Get database path
    const dbPath = getDbPath();
    
    // Create a backup of current database before restore
    const currentBackupPath = path.join(
      getBackupDir(), 
      `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`
    );
    
    try {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, currentBackupPath);
        console.log(`🔄 [Backup] Current database backed up to: ${currentBackupPath}`);
      }
    } catch (backupError) {
      console.warn('🔄 [Backup] Failed to backup current database:', backupError);
    }
    
    // Close current database connection
    closeDb();
    
    // Replace database file
    fs.copyFileSync(sourcePath, dbPath);
    
    console.log(`🔄 [Backup] Database restored successfully from: ${sourcePath}`);
    console.log(`🔄 [Backup] Application restart required to reload database`);
    
    return {
      needsRestart: true,
      message: `Database restored from ${path.basename(sourcePath)}. Application will restart.`
    };
    
  } catch (error) {
    console.error('🔄 [Backup] Database restore failed:', error);
    throw error;
  }
}

/**
 * List available backups
 */
export function listBackups(): Array<{
  name: string;
  path: string;
  size: number;
  created: Date;
  type: 'hot' | 'vacuum' | 'migration';
}> {
  try {
    ensureBackupDir();
    const backupDir = getBackupDir();
    
    const files = fs.readdirSync(backupDir);
    const backups = [];
    
    for (const file of files) {
      if (!file.endsWith('.sqlite')) continue;
      
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      let type: 'hot' | 'vacuum' | 'migration' = 'hot';
      if (file.includes('vacuum')) type = 'vacuum';
      if (file.includes('migration')) type = 'migration';
      
      backups.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        type
      });
    }
    
    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    
    return backups;
    
  } catch (error) {
    console.error('💾 [Backup] Failed to list backups:', error);
    return [];
  }
}

/**
 * Clean old backups (keep last N backups)
 */
export function cleanOldBackups(keepCount: number = 10): {
  deleted: number;
  kept: number;
  errors: string[];
} {
  try {
    const backups = listBackups();
    const errors: string[] = [];
    let deleted = 0;
    
    if (backups.length <= keepCount) {
      return {
        deleted: 0,
        kept: backups.length,
        errors: []
      };
    }
    
    const toDelete = backups.slice(keepCount);
    
    for (const backup of toDelete) {
      try {
        fs.unlinkSync(backup.path);
        deleted++;
        console.log(`🗑️ [Backup] Deleted old backup: ${backup.name}`);
      } catch (error) {
        const errorMsg = `Failed to delete ${backup.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`🗑️ [Backup] ${errorMsg}`);
      }
    }
    
    return {
      deleted,
      kept: backups.length - deleted,
      errors
    };
    
  } catch (error) {
    console.error('🗑️ [Backup] Failed to clean old backups:', error);
    
    return {
      deleted: 0,
      kept: 0,
      errors: [`Cleanup failed: ${error}`]
    };
  }
}