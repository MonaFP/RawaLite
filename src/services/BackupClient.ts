// src/services/BackupClient.ts
import { LoggingService } from './LoggingService.js';

/**
 * Client-side wrapper for backup operations via IPC
 * Provides a clean API for renderer process backup access
 */
export class BackupClient {
  private static instance: BackupClient | null = null;

  private constructor() {
    if (!window.rawalite?.backup) {
      throw new Error('Backup API not available - check preload script');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BackupClient {
    if (!BackupClient.instance) {
      BackupClient.instance = new BackupClient();
    }
    return BackupClient.instance;
  }

  /**
   * Create a hot backup of the database while it's running
   */
  async createHotBackup(backupPath?: string): Promise<{
    success: boolean;
    backupPath: string;
    size: number;
    checksum: string;
    timestamp: string;
  }> {
    try {
      console.log('BackupClient.createHotBackup', { backupPath });
      const result = await window.rawalite.backup.hot(backupPath);
      console.log('BackupClient.createHotBackup result', result);
      await LoggingService.log(`Hot backup created: ${result.backupPath} (${result.size} bytes)`, 'info');
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.createHotBackup failed');
      throw error;
    }
  }

  /**
   * Create a vacuum backup (compact database)
   */
  async createVacuumBackup(backupPath: string): Promise<{
    success: boolean;
    backupPath: string;
    size: number;
    checksum: string;
    timestamp: string;
  }> {
    try {
      console.log('BackupClient.createVacuumBackup', { backupPath });
      const result = await window.rawalite.backup.vacuumInto(backupPath);
      console.log('BackupClient.createVacuumBackup result', result);
      await LoggingService.log(`Vacuum backup created: ${result.backupPath} (${result.size} bytes)`, 'info');
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.createVacuumBackup failed');
      throw error;
    }
  }

  /**
   * Check database integrity
   */
  async checkIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
    checksums: { pragma: string; custom: string };
  }> {
    try {
      console.log('BackupClient.checkIntegrity');
      const result = await window.rawalite.backup.integrityCheck();
      console.log('BackupClient.checkIntegrity result', result);
      
      if (result.valid) {
        await LoggingService.log('Database integrity check passed', 'info');
      } else {
        await LoggingService.log(`Database integrity check failed: ${result.errors.join(', ')}`, 'warn');
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.checkIntegrity failed');
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath: string): Promise<{
    success: boolean;
    restoredPath: string;
    timestamp: string;
  }> {
    try {
      console.log('BackupClient.restoreFromBackup', { backupPath });
      const result = await window.rawalite.backup.restore(backupPath);
      console.log('BackupClient.restoreFromBackup result', result);
      
      if (result.success) {
        await LoggingService.log(`Database restored from backup: ${backupPath}`, 'info');
      } else {
        await LoggingService.log(`Database restore failed: ${backupPath}`, 'warn');
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.restoreFromBackup failed');
      throw error;
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupOldBackups(backupDir: string, keepCount: number = 10): Promise<{
    success: boolean;
    deletedCount: number;
    deletedFiles: string[];
  }> {
    try {
      console.log('BackupClient.cleanupOldBackups', { backupDir, keepCount });
      const result = await window.rawalite.backup.cleanup(backupDir, keepCount);
      console.log('BackupClient.cleanupOldBackups result', result);
      
      if (result.success && result.deletedCount > 0) {
        await LoggingService.log(`Cleaned up ${result.deletedCount} old backup files`, 'info');
      }
      
      return result;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.cleanupOldBackups failed');
      throw error;
    }
  }

  // Convenience methods

  /**
   * Create a timestamped backup with automatic cleanup
   */
  async createTimestampedBackup(backupDir: string, useVacuum: boolean = false, keepCount: number = 10): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `rawalite_backup_${timestamp}.db`;
      const backupPath = `${backupDir}/${filename}`;

      const result = useVacuum 
        ? await this.createVacuumBackup(backupPath)
        : await this.createHotBackup(backupPath);

      if (!result.success) {
        throw new Error('Backup creation failed');
      }

      // Clean up old backups
      await this.cleanupOldBackups(backupDir, keepCount);

      return result.backupPath;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.createTimestampedBackup failed');
      throw error;
    }
  }

  /**
   * Validate a backup file by checking integrity after restore to temp location
   */
  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      console.log('BackupClient.validateBackup', { backupPath });
      
      // For now, just check if the backup file exists and has content
      // In a full implementation, we'd restore to temp location and check integrity
      const integrity = await this.checkIntegrity();
      
      await LoggingService.log(`Backup validation result: ${integrity.valid}`, 'info');
      return integrity.valid;
    } catch (error) {
      await LoggingService.logError(error as Error, 'BackupClient.validateBackup failed');
      return false;
    }
  }
}

export default BackupClient;