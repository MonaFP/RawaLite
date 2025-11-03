/**
 * Rollback & Migration IPC Handlers
 * 
 * Database migration rollback and recovery operations.
 * Handles rollback to specific migration version, status checks, and backup management.
 * Integrates with MigrationService, BackupService, and BackupRecoveryService for comprehensive recovery workflows.
 * 
 * Phase 2 Step 1 & Step 2 Integration
 * @since v1.0.70
 */

import { ipcMain } from 'electron';
import { getMigrationStatus, rollbackToVersion } from '../../src/main/db/MigrationService';
import BackupRecoveryService from '../../src/main/services/BackupRecoveryService';
import * as fs from 'node:fs/promises';
import * as path from 'path';

/**
 * Register all rollback & migration IPC handlers
 */
export function registerRollbackHandlers(): void {
  console.log('🔌 [ROLLBACK] Registering rollback & migration IPC handlers...');

  /**
   * Get current migration status
   */
  ipcMain.handle('rollback:status', async (event) => {
    try {
      const status = getMigrationStatus();
      console.log('🔄 [ROLLBACK] Migration status retrieved:', {
        current: status.currentVersion,
        target: status.targetVersion,
        pending: status.pendingMigrations.length,
      });
      
      return {
        success: true,
        currentVersion: status.currentVersion,
        targetVersion: status.targetVersion,
        pendingCount: status.pendingMigrations.length,
        pendingMigrations: status.pendingMigrations.map(m => ({
          version: m.version,
          name: m.name,
          type: 'pending',
        })),
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] Status check failed:', error);
      throw error;
    }
  });

  /**
   * Perform migration rollback to specific version
   */
  ipcMain.handle('rollback:migrate', async (event, targetVersion: number) => {
    try {
      const currentStatus = getMigrationStatus();
      
      if (targetVersion === currentStatus.currentVersion) {
        return {
          success: true,
          message: `Already at version ${targetVersion}`,
          previousVersion: currentStatus.currentVersion,
          newVersion: targetVersion,
        };
      }

      if (targetVersion > currentStatus.currentVersion) {
        throw new Error(
          `Cannot rollback to future version ${targetVersion} (current: ${currentStatus.currentVersion})`
        );
      }

      console.log(`🔄 [ROLLBACK] Starting rollback from v${currentStatus.currentVersion} to v${targetVersion}...`);

      // Perform rollback
      rollbackToVersion(targetVersion);

      const newStatus = getMigrationStatus();
      console.log(`✅ [ROLLBACK] Rollback completed successfully to v${targetVersion}`);

      return {
        success: true,
        message: `Rollback completed to version ${targetVersion}`,
        previousVersion: currentStatus.currentVersion,
        newVersion: newStatus.currentVersion,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] Rollback failed:', error);
      throw error;
    }
  });

  /**
   * List available backup files for recovery
   * Uses BackupRecoveryService for comprehensive backup management
   */
  ipcMain.handle('rollback:listBackups', async (event, backupDir?: string) => {
    try {
      const backupService = BackupRecoveryService.getInstance();
      const result = backupService.listBackups(backupDir);

      console.log(`🔄 [ROLLBACK] Found ${result.totalCount} backup files`);

      return {
        success: true,
        backups: result.backups.map(b => ({
          filename: b.filename,
          path: b.fullPath,
          size: b.size,
          sizeFormatted: formatBytes(b.size),
          created: b.created.toISOString(),
          type: b.type,
          isValid: b.isValid,
        })),
        directory: backupDir || 'default',
        count: result.totalCount,
        totalSize: result.totalSize,
        totalSizeFormatted: formatBytes(result.totalSize),
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] List backups failed:', error);
      throw error;
    }
  });

  /**
   * Restore database from a backup file
   * Uses BackupRecoveryService for backup restoration
   */
  ipcMain.handle('rollback:restore', async (event, backupPath: string, targetPath?: string) => {
    try {
      if (!backupPath) {
        throw new Error('Backup path is required');
      }

      const backupService = BackupRecoveryService.getInstance();
      const result = backupService.restoreBackup(backupPath, targetPath);

      if (!result.success) {
        console.error('❌ [ROLLBACK] Restore failed:', result.message);
        return {
          success: false,
          message: result.message,
        };
      }

      console.log(`✅ [ROLLBACK] Restore completed successfully`);

      return {
        success: true,
        message: result.message,
        sourcePath: result.sourcePath,
        targetPath: result.targetPath,
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] Restore failed:', error);
      throw error;
    }
  });

  /**
   * Validate backup file integrity
   * Uses BackupRecoveryService validation logic
   */
  ipcMain.handle('rollback:validateBackup', async (event, backupPath: string) => {
    try {
      if (!backupPath) {
        throw new Error('Backup path is required');
      }

      const backupService = BackupRecoveryService.getInstance();
      const validation = backupService.validateBackup(backupPath);

      console.log(`🔍 [ROLLBACK] Backup validation result: ${validation.isValid ? '✅' : '❌'}`);

      return {
        success: true,
        valid: validation.isValid,
        filename: validation.filename,
        size: validation.size,
        sizeFormatted: formatBytes(validation.size),
        sqliteVersion: validation.sqliteVersion,
        pageSize: validation.pageSize,
        error: validation.error,
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] Validation failed:', error);
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  });

  /**
   * Clean up old backup files (keep only recent ones)
   * Uses BackupRecoveryService for cleanup management
   */
  ipcMain.handle('rollback:cleanupBackups', async (event, backupDir?: string, keepCount: number = 10) => {
    try {
      const backupService = BackupRecoveryService.getInstance();
      const result = backupService.cleanupBackups(backupDir, keepCount);

      console.log(`🧹 [ROLLBACK] Cleanup completed: deleted ${result.deletedCount} files, freed ${formatBytes(result.freedSpace)}`);

      return {
        success: result.success,
        deletedCount: result.deletedCount,
        deletedFiles: result.deletedFiles,
        freedSpace: result.freedSpace,
        freedSpaceFormatted: formatBytes(result.freedSpace),
        keptCount: result.keptCount,
      };
    } catch (error) {
      console.error('❌ [ROLLBACK] Cleanup failed:', error);
      throw error;
    }
  });

  console.log('✅ [ROLLBACK] Rollback & migration IPC handlers registered successfully');
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
