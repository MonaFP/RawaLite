/**
 * Backup IPC Handlers
 * 
 * Database backup and restore operations.
 * Handles hot backups, vacuum backups, integrity checks, and restore operations.
 * 
 * @since v1.0.42.5
 */

import { ipcMain } from 'electron';
import { createHotBackup, createVacuumBackup, checkIntegrity, restoreFromBackup, cleanOldBackups } from '../../src/main/db/BackupService';

/**
 * Register all backup IPC handlers
 */
export function registerBackupHandlers(): void {
  console.log('🔌 [BACKUP] Registering backup IPC handlers...');

  /**
   * Create a hot backup of the database
   */
  ipcMain.handle('backup:hot', async (event, backupPath?: string) => {
    try {
      return await createHotBackup(backupPath)
    } catch (error) {
      console.error(`Hot backup failed:`, error)
      throw error
    }
  });

  /**
   * Create a vacuum backup (compact) of the database
   */
  ipcMain.handle('backup:vacuumInto', async (event, backupPath: string) => {
    try {
      return await createVacuumBackup(backupPath)
    } catch (error) {
      console.error(`Vacuum backup failed:`, error)
      throw error
    }
  });

  /**
   * Check database integrity
   */
  ipcMain.handle('backup:integrityCheck', async (event, dbPath?: string) => {
    try {
      return checkIntegrity()
    } catch (error) {
      console.error(`Integrity check failed:`, error)
      throw error
    }
  });

  /**
   * Restore database from backup
   */
  ipcMain.handle('backup:restore', async (event, backupPath: string, targetPath?: string) => {
    try {
      return restoreFromBackup(backupPath)
    } catch (error) {
      console.error(`Backup restore failed:`, error)
      throw error
    }
  });

  /**
   * Clean up old backup files
   */
  ipcMain.handle('backup:cleanup', async (event, backupDir: string, keepCount: number) => {
    try {
      return cleanOldBackups(keepCount)
    } catch (error) {
      console.error(`Backup cleanup failed:`, error)
      throw error
    }
  });

  console.log('✅ [BACKUP] Backup IPC handlers registered successfully');
}