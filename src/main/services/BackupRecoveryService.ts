/**
 * Backup Recovery Service
 * 
 * Backend service for backup management and recovery operations.
 * Handles backup listing, validation, restoration, and cleanup.
 * 
 * Phase 2 Step 2 - Rollback System Implementation
 * @since v1.0.43.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getUserVersion } from '../db/Database';

/**
 * Backup metadata extracted from filesystem
 */
export interface BackupMetadata {
  filename: string;
  fullPath: string;
  size: number;
  created: Date;
  modified: Date;
  type: 'hot' | 'vacuum' | 'migration' | 'unknown';
  isValid: boolean;
}

/**
 * Backup list with summary information
 */
export interface BackupListResult {
  backups: BackupMetadata[];
  totalCount: number;
  totalSize: number;
  oldestBackup: BackupMetadata | null;
  newestBackup: BackupMetadata | null;
}

/**
 * Validation result for backup files
 */
export interface BackupValidationResult {
  isValid: boolean;
  filename: string;
  size: number;
  error?: string;
  sqliteVersion?: string;
  pageSize?: number;
}

/**
 * Restore operation result
 */
export interface RestoreResult {
  success: boolean;
  sourcePath: string;
  targetPath: string;
  timestamp: string;
  message: string;
}

/**
 * Backup cleanup result
 */
export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  freedSpace: number;
  keptCount: number;
  deletedFiles: string[];
}

/**
 * Migration status with pending information
 */
export interface MigrationStatus {
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: number;
  needsRollback: boolean;
}

/**
 * BackupRecoveryService - Manages backup operations for rollback system
 */
export class BackupRecoveryService {
  private static instance: BackupRecoveryService | null = null;
  private backupDir: string;

  private constructor() {
    // Initialize backup directory from app paths
    const userDataPath = app.getPath('userData');
    this.backupDir = path.join(userDataPath, 'database', 'backups');
    this.ensureBackupDirectoryExists();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BackupRecoveryService {
    if (!BackupRecoveryService.instance) {
      BackupRecoveryService.instance = new BackupRecoveryService();
    }
    return BackupRecoveryService.instance;
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        console.log(`✅ [BACKUP_RECOVERY] Created backup directory: ${this.backupDir}`);
      }
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Failed to create backup directory:`, error);
      throw error;
    }
  }

  /**
   * List all available backups in backup directory
   * @param customDir Optional custom backup directory
   */
  listBackups(customDir?: string): BackupListResult {
    const targetDir = customDir || this.backupDir;

    try {
      if (!fs.existsSync(targetDir)) {
        console.warn(`⚠️ [BACKUP_RECOVERY] Backup directory not found: ${targetDir}`);
        return {
          backups: [],
          totalCount: 0,
          totalSize: 0,
          oldestBackup: null,
          newestBackup: null,
        };
      }

      const files = fs.readdirSync(targetDir);
      const backupFiles = files.filter(f => 
        f.endsWith('.db') || f.endsWith('.sqlite') || f.endsWith('.sqlite3')
      );

      const backups: BackupMetadata[] = backupFiles
        .map(filename => {
          const fullPath = path.join(targetDir, filename);
          const stats = fs.statSync(fullPath);
          const isValid = this.validateBackupFile(fullPath);

          // Determine backup type from filename
          let type: BackupMetadata['type'] = 'unknown';
          if (filename.includes('vacuum')) type = 'vacuum';
          else if (filename.includes('hot')) type = 'hot';
          else if (filename.includes('migration')) type = 'migration';

          return {
            filename,
            fullPath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type,
            isValid,
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      const oldestBackup = backups[backups.length - 1] || null;
      const newestBackup = backups[0] || null;

      console.log(
        `✅ [BACKUP_RECOVERY] Listed ${backups.length} backups from ${targetDir}`,
      );

      return {
        backups,
        totalCount: backups.length,
        totalSize,
        oldestBackup,
        newestBackup,
      };
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Failed to list backups:`, error);
      throw error;
    }
  }

  /**
   * Validate backup file by checking SQLite header
   * @param backupPath Path to backup file
   */
  validateBackup(backupPath: string): BackupValidationResult {
    const filename = path.basename(backupPath);

    try {
      if (!fs.existsSync(backupPath)) {
        console.warn(`⚠️ [BACKUP_RECOVERY] Backup file not found: ${backupPath}`);
        return {
          isValid: false,
          filename,
          size: 0,
          error: 'Backup file not found',
        };
      }

      const stats = fs.statSync(backupPath);
      const size = stats.size;

      // Check SQLite header magic bytes
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(backupPath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      const header = buffer.toString('ascii', 0, 13);
      const isValid = header === 'SQLite format';

      if (!isValid) {
        return {
          isValid: false,
          filename,
          size,
          error: 'Invalid SQLite file header',
        };
      }

      // Get page size from header
      const pageSize = buffer.readUInt16BE(16);

      console.log(
        `✅ [BACKUP_RECOVERY] Validated backup: ${filename} (${this.formatBytes(size)})`,
      );

      return {
        isValid: true,
        filename,
        size,
        sqliteVersion: 'SQLite3',
        pageSize,
      };
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Validation failed for ${filename}:`, error);
      return {
        isValid: false,
        filename,
        size: 0,
        error: String(error),
      };
    }
  }

  /**
   * Restore database from backup
   * @param backupPath Source backup file path
   * @param targetPath Destination path (defaults to main database)
   */
  restoreBackup(backupPath: string, targetPath?: string): RestoreResult {
    const timestamp = new Date().toISOString();

    try {
      if (!fs.existsSync(backupPath)) {
        const error = 'Backup file not found';
        console.error(`❌ [BACKUP_RECOVERY] ${error}: ${backupPath}`);
        return {
          success: false,
          sourcePath: backupPath,
          targetPath: targetPath || '',
          timestamp,
          message: error,
        };
      }

      // Validate backup before restoring
      const validation = this.validateBackup(backupPath);
      if (!validation.isValid) {
        const error = `Invalid backup file: ${validation.error}`;
        console.error(`❌ [BACKUP_RECOVERY] ${error}`);
        return {
          success: false,
          sourcePath: backupPath,
          targetPath: targetPath || '',
          timestamp,
          message: error,
        };
      }

      // Use main database path if target not specified
      const target = targetPath || this.getMainDatabasePath();

      // Backup current database before restore
      const currentBackup = path.join(
        this.backupDir,
        `pre-restore-${Date.now()}.db`,
      );
      if (fs.existsSync(target)) {
        fs.copyFileSync(target, currentBackup);
        console.log(`📦 [BACKUP_RECOVERY] Pre-restore backup created: ${currentBackup}`);
      }

      // Restore from backup
      fs.copyFileSync(backupPath, target);
      console.log(`✅ [BACKUP_RECOVERY] Database restored from: ${backupPath}`);

      return {
        success: true,
        sourcePath: backupPath,
        targetPath: target,
        timestamp,
        message: `Database restored successfully from ${path.basename(backupPath)}. App restart required.`,
      };
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Restore failed:`, error);
      return {
        success: false,
        sourcePath: backupPath,
        targetPath: targetPath || '',
        timestamp,
        message: `Restore failed: ${String(error)}`,
      };
    }
  }

  /**
   * Clean up old backup files, keeping only the N most recent
   * @param customDir Optional custom backup directory
   * @param keepCount Number of backups to keep (default: 10)
   */
  cleanupBackups(customDir?: string, keepCount: number = 10): CleanupResult {
    const targetDir = customDir || this.backupDir;
    const timestamp = new Date().toISOString();

    try {
      const listResult = this.listBackups(targetDir);
      const { backups } = listResult;

      if (backups.length <= keepCount) {
        console.log(
          `ℹ️ [BACKUP_RECOVERY] Backup count (${backups.length}) within keep limit (${keepCount})`,
        );
        return {
          success: true,
          deletedCount: 0,
          freedSpace: 0,
          keptCount: backups.length,
          deletedFiles: [],
        };
      }

      const toDelete = backups.slice(keepCount);
      let freedSpace = 0;
      const deletedFiles: string[] = [];

      for (const backup of toDelete) {
        try {
          fs.unlinkSync(backup.fullPath);
          freedSpace += backup.size;
          deletedFiles.push(backup.filename);
          console.log(`🗑️ [BACKUP_RECOVERY] Deleted: ${backup.filename}`);
        } catch (error) {
          console.error(`⚠️ [BACKUP_RECOVERY] Failed to delete ${backup.filename}:`, error);
        }
      }

      console.log(
        `✅ [BACKUP_RECOVERY] Cleaned up ${deletedFiles.length} backups, freed ${this.formatBytes(freedSpace)}`,
      );

      return {
        success: true,
        deletedCount: deletedFiles.length,
        freedSpace,
        keptCount: keepCount,
        deletedFiles,
      };
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Cleanup failed:`, error);
      return {
        success: false,
        deletedCount: 0,
        freedSpace: 0,
        keptCount: 0,
        deletedFiles: [],
      };
    }
  }

  /**
   * Get current migration status
   */
  getMigrationStatus(): MigrationStatus {
    try {
      const currentVersion = getUserVersion();
      // Target version is the highest migration available
      const targetVersion = 47; // Phase 2 migration count - update as needed

      const pendingMigrations = Math.abs(targetVersion - currentVersion);

      return {
        currentVersion,
        targetVersion,
        pendingMigrations,
        needsRollback: currentVersion > targetVersion,
      };
    } catch (error) {
      console.error(`❌ [BACKUP_RECOVERY] Failed to get migration status:`, error);
      throw error;
    }
  }

  /**
   * Get main database path
   */
  private getMainDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'database', 'rawalite.db');
  }

  /**
   * Validate backup file by checking SQLite header
   * @param filePath Path to file to validate
   */
  private validateBackupFile(filePath: string): boolean {
    try {
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      const header = buffer.toString('ascii', 0, 13);
      return header === 'SQLite format';
    } catch {
      return false;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default BackupRecoveryService;
