/**
 * RollbackService - Frontend service for rollback operations via IPC
 * 
 * Provides browser-safe interface to database rollback operations.
 * Communicates with main process via IPC channels (rollback:* handlers).
 * Follows established ThemeIpcService and BackupClient patterns for consistency.
 * 
 * Phase 2 Step 3 - Renderer Layer Implementation
 * @since v1.0.70 (Rollback System)
 * @see docs/ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md
 * @pattern BackupClient, ThemeIpcService - Established RawaLite IPC pattern
 */

import { LoggingService } from './LoggingService.js';

/**
 * Migration status information
 */
export interface MigrationStatus {
  success: boolean;
  currentVersion: number;
  targetVersion: number;
  pendingCount: number;
  pendingMigrations: Array<{
    version: number;
    name: string;
    type: string;
  }>;
}

/**
 * Rollback result information
 */
export interface RollbackResult {
  success: boolean;
  message: string;
  previousVersion?: number;
  newVersion?: number;
  timestamp?: string;
}

/**
 * Backup metadata from list operation
 */
export interface BackupMetadata {
  filename: string;
  path: string;
  size: number;
  sizeFormatted: string;
  created: string;
  type: 'hot' | 'vacuum' | 'migration' | 'unknown';
  isValid: boolean;
}

/**
 * Backup list result
 */
export interface BackupListResult {
  success: boolean;
  backups: BackupMetadata[];
  directory: string;
  count: number;
  totalSize: number;
  totalSizeFormatted: string;
}

/**
 * Backup validation result
 */
export interface BackupValidationResult {
  success: boolean;
  valid: boolean;
  filename?: string;
  size?: number;
  sizeFormatted?: string;
  sqliteVersion?: string;
  pageSize?: number;
  error?: string;
}

/**
 * Backup restoration result
 */
export interface BackupRestoreResult {
  success: boolean;
  message: string;
  sourcePath?: string;
  targetPath?: string;
  timestamp?: string;
}

/**
 * Backup cleanup result
 */
export interface BackupCleanupResult {
  success: boolean;
  deletedCount: number;
  deletedFiles: string[];
  freedSpace: number;
  freedSpaceFormatted: string;
  keptCount: number;
}

/**
 * RollbackService - Frontend IPC service for rollback operations
 * Singleton pattern for consistent state management
 */
export class RollbackService {
  private static instance: RollbackService | null = null;

  private constructor() {
    if (!this.getRollbackAPI()) {
      throw new Error('Rollback API not available - check preload script');
    }
  }

  /**
   * Get rollback API from window.rawalite
   */
  private getRollbackAPI(): any {
    return (window.rawalite as any)?.rollback;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RollbackService {
    if (!RollbackService.instance) {
      RollbackService.instance = new RollbackService();
    }
    return RollbackService.instance;
  }

  /**
   * Get current migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      console.log('RollbackService.getMigrationStatus');
      const api = this.getRollbackAPI();
      const result = await api.status();
      console.log('RollbackService.getMigrationStatus result', result);
      
      await LoggingService.log(
        `Migration status: v${result.currentVersion} (target: v${result.targetVersion}, pending: ${result.pendingCount})`,
        'info'
      );
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.getMigrationStatus failed');
      throw error;
    }
  }

  /**
   * Perform rollback to specific migration version
   */
  async rollbackToVersion(targetVersion: number): Promise<RollbackResult> {
    try {
      console.log('RollbackService.rollbackToVersion', { targetVersion });
      const api = this.getRollbackAPI();
      const result = await api.migrate(targetVersion);
      console.log('RollbackService.rollbackToVersion result', result);
      
      if (result.success) {
        await LoggingService.log(
          `Database rolled back to v${result.newVersion} (from v${result.previousVersion})`,
          'info'
        );
      } else {
        await LoggingService.log(`Rollback failed: ${result.message}`, 'warn');
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.rollbackToVersion failed');
      throw error;
    }
  }

  /**
   * List available backups for recovery
   */
  async listBackups(backupDir?: string): Promise<BackupListResult> {
    try {
      console.log('RollbackService.listBackups', { backupDir });
      const api = this.getRollbackAPI();
      const result = await api.listBackups(backupDir);
      console.log('RollbackService.listBackups result', { count: result.count });
      
      await LoggingService.log(
        `Found ${result.count} backup(s) totaling ${result.totalSizeFormatted}`,
        'info'
      );
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.listBackups failed');
      throw error;
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupPath: string): Promise<BackupValidationResult> {
    try {
      if (!backupPath) {
        throw new Error('Backup path is required');
      }

      console.log('RollbackService.validateBackup', { backupPath });
      const api = this.getRollbackAPI();
      const result = await api.validateBackup(backupPath);
      console.log('RollbackService.validateBackup result', { valid: result.valid });
      
      if (result.valid) {
        await LoggingService.log(
          `Backup validated: ${result.filename} (${result.sizeFormatted})`,
          'info'
        );
      } else {
        await LoggingService.log(
          `Backup validation failed: ${result.error}`,
          'warn'
        );
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.validateBackup failed');
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  /**
   * Restore database from backup file
   */
  async restoreBackup(backupPath: string, targetPath?: string): Promise<BackupRestoreResult> {
    try {
      if (!backupPath) {
        throw new Error('Backup path is required');
      }

      console.log('RollbackService.restoreBackup', { backupPath, targetPath });
      const api = this.getRollbackAPI();
      const result = await api.restore(backupPath, targetPath);
      console.log('RollbackService.restoreBackup result', { success: result.success });
      
      if (result.success) {
        await LoggingService.log(
          `Database restored from backup: ${result.message}`,
          'info'
        );
      } else {
        await LoggingService.log(
          `Restore failed: ${result.message}`,
          'warn'
        );
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.restoreBackup failed');
      throw error;
    }
  }

  /**
   * Clean up old backup files, keeping only recent ones
   */
  async cleanupBackups(backupDir?: string, keepCount: number = 10): Promise<BackupCleanupResult> {
    try {
      console.log('RollbackService.cleanupBackups', { backupDir, keepCount });
      const api = this.getRollbackAPI();
      const result = await api.cleanupBackups(backupDir, keepCount);
      console.log('RollbackService.cleanupBackups result', {
        deleted: result.deletedCount,
        freed: result.freedSpaceFormatted,
      });
      
      if (result.deletedCount > 0) {
        await LoggingService.log(
          `Cleaned up ${result.deletedCount} old backup(s), freed ${result.freedSpaceFormatted}`,
          'info'
        );
      } else {
        await LoggingService.log(
          `No backups needed cleanup (keeping ${result.keptCount})`,
          'info'
        );
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'RollbackService.cleanupBackups failed');
      throw error;
    }
  }

  /**
   * Convenience method: Get status and validate backup exists
   */
  async canRollback(): Promise<boolean> {
    try {
      const status = await this.getMigrationStatus();
      return status.pendingCount > 0 || status.currentVersion > status.targetVersion;
    } catch (error) {
      console.error('RollbackService.canRollback error:', error);
      return false;
    }
  }

  /**
   * Convenience method: Perform full rollback sequence with validation
   */
  async performRollback(targetVersion: number, backupDir?: string): Promise<{
    success: boolean;
    steps: {
      validation: BackupValidationResult;
      rollback: RollbackResult;
      cleanup: BackupCleanupResult;
    };
    message: string;
  }> {
    try {
      console.log('RollbackService.performRollback sequence started', { targetVersion, backupDir });

      // Step 1: List backups
      const backups = await this.listBackups(backupDir);
      if (backups.count === 0) {
        throw new Error('No backup files available for rollback');
      }

      // Step 2: Validate most recent backup
      const latestBackup = backups.backups[0];
      const validation = await this.validateBackup(latestBackup.path);
      if (!validation.valid) {
        throw new Error(`Latest backup is invalid: ${validation.error}`);
      }

      // Step 3: Perform rollback
      const rollback = await this.rollbackToVersion(targetVersion);
      if (!rollback.success) {
        throw new Error(rollback.message);
      }

      // Step 4: Cleanup old backups
      const cleanup = await this.cleanupBackups(backupDir, 10);

      await LoggingService.log(
        `Full rollback sequence completed successfully to v${rollback.newVersion}`,
        'info'
      );

      return {
        success: true,
        steps: { validation, rollback, cleanup },
        message: `Rollback completed successfully to version ${rollback.newVersion}. App restart recommended.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during rollback';
      await LoggingService.logError(error as Error, 'RollbackService.performRollback failed');
      
      return {
        success: false,
        steps: {
          validation: { success: false, valid: false, error: message },
          rollback: { success: false, message },
          cleanup: { success: false, deletedCount: 0, deletedFiles: [], freedSpace: 0, freedSpaceFormatted: '0 Bytes', keptCount: 0 },
        },
        message: `Rollback failed: ${message}`,
      };
    }
  }
}

export default RollbackService;
