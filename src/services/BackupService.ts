/**
 * 🗄️ BackupService - Renderer-side wrapper for filesystem-based backups
 * 
 * Replaces localStorage-based backups with robust filesystem storage via IPC.
 * All backup data is stored in AppData/backups/ with proper rotation and limits.
 * 
 * Features:
 * - No QuotaExceededError - uses filesystem instead of web storage
 * - Automatic rotation (configurable keep count and size limits)
 * - Progress reporting for large backup operations
 * - Streaming/chunked operations for memory efficiency
 * - Strict IPC typing and error handling
 */

import type { BackupCreateOptions, BackupCreateResult, BackupListResult, BackupPruneOptions, BackupPruneResult } from '../types/ipc';
import { LoggingService } from './LoggingService';

export interface BackupInfo {
  id: string;
  kind: string;
  filePath: string;
  size: number;
  createdAt: string;
  description: string;
  version: string;
  sizeFormatted: string;
  dateFormatted: string;
}

export class BackupService {
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = data ? `[Backup${level.toUpperCase()}] ${message} - ${JSON.stringify(data)}` : `[Backup${level.toUpperCase()}] ${message}`;
    LoggingService.log(logMessage);
  }

  /**
   * Creates a backup using filesystem storage via IPC
   * 
   * @param options Backup configuration
   * @returns Backup result with file path and metadata
   */
  async create(options: BackupCreateOptions): Promise<BackupCreateResult> {
    try {
      this.log('info', 'Creating backup via filesystem IPC', options);

      // 🔧 CRITICAL FIX: Graceful degradation for non-Electron environments
      if (typeof window === 'undefined' || !window.rawalite?.backup) {
        this.log('warn', 'Backup IPC not available - skipping backup in non-Electron environment');
        return {
          success: false,
          error: 'Backup functionality not available in browser environment'
        };
      }

      // Call main process to create backup
      const result = await window.rawalite.backup.create(options);

      if (result.success) {
        this.log('info', 'Backup created successfully', {
          backupId: result.backupId,
          filePath: result.filePath,
          size: result.size
        });
      } else {
        this.log('error', 'Backup creation failed', { error: result.error });
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log('error', 'Backup creation error', { error: errorMsg });
      
      return {
        success: false,
        error: `Backup creation failed: ${errorMsg}`
      };
    }
  }

  /**
   * Lists all available backups
   * 
   * @returns List of backups with metadata
   */
  async list(): Promise<BackupInfo[]> {
    try {
      this.log('info', 'Listing backups');

      if (typeof window === 'undefined' || !window.rawalite?.backup) {
        this.log('warn', 'Backup IPC not available, returning empty list');
        return [];
      }

      const result = await window.rawalite.backup.list();

      if (result.success && result.backups) {
        const formattedBackups = result.backups.map((backup: any) => ({
          ...backup,
          sizeFormatted: this.formatBytes(backup.size),
          dateFormatted: this.formatDate(backup.createdAt)
        }));

        this.log('info', 'Backups listed successfully', { count: formattedBackups.length });
        return formattedBackups;
      } else {
        this.log('error', 'Failed to list backups', { error: result.error });
        return [];
      }
    } catch (error) {
      this.log('error', 'Error listing backups', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Removes old backups based on retention policy
   * 
   * @param options Pruning configuration (keep count, size limits)
   * @returns Pruning result
   */
  async prune(options: BackupPruneOptions = {}): Promise<BackupPruneResult> {
    try {
      const finalOptions = {
        keep: 5,
        maxTotalMB: 500,
        ...options
      };

      this.log('info', 'Pruning old backups', finalOptions);

      if (typeof window === 'undefined' || !window.rawalite?.backup) {
        throw new Error('Backup IPC not available');
      }

      const result = await window.rawalite.backup.prune(finalOptions);

      if (result.success) {
        this.log('info', 'Backup pruning completed', { removedCount: result.removedCount });
      } else {
        this.log('error', 'Backup pruning failed', { error: result.error });
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log('error', 'Backup pruning error', { error: errorMsg });
      
      return {
        success: false,
        error: `Backup pruning failed: ${errorMsg}`
      };
    }
  }

  /**
   * Creates a pre-update backup with proper metadata
   * 
   * @param currentVersion Current app version
   * @returns Backup result
   */
  async createPreUpdateBackup(currentVersion: string): Promise<BackupCreateResult> {
    return this.create({
      kind: 'pre-update',
      description: `Automatic backup before update from v${currentVersion}`,
      payloadMeta: {
        version: currentVersion
      }
    });
  }

  /**
   * Creates a manual backup with user description
   * 
   * @param description User-provided description
   * @returns Backup result
   */
  async createManualBackup(description?: string): Promise<BackupCreateResult> {
    return this.create({
      kind: 'manual',
      description: description || 'Manual backup created by user'
    });
  }

  /**
   * Creates a post-download backup
   * 
   * @param newVersion Version that was downloaded
   * @returns Backup result
   */
  async createPostDownloadBackup(newVersion: string): Promise<BackupCreateResult> {
    return this.create({
      kind: 'post-download',
      description: `Backup after downloading v${newVersion}`,
      payloadMeta: {
        version: newVersion
      }
    });
  }

  /**
   * Automatic cleanup with standard retention policy
   * 
   * @returns Pruning result
   */
  async autoCleanup(): Promise<BackupPruneResult> {
    return this.prune({
      keep: 5,
      maxTotalMB: 500
    });
  }

  /**
   * Get backup statistics
   * 
   * @returns Backup statistics
   */
  async getStats(): Promise<{
    totalCount: number;
    totalSize: number;
    totalSizeFormatted: string;
    oldestBackup?: string;
    newestBackup?: string;
  }> {
    try {
      const backups = await this.list();
      
      if (backups.length === 0) {
        return {
          totalCount: 0,
          totalSize: 0,
          totalSizeFormatted: '0 Bytes'
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const sortedByDate = [...backups].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        totalCount: backups.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        oldestBackup: sortedByDate[0]?.dateFormatted,
        newestBackup: sortedByDate[sortedByDate.length - 1]?.dateFormatted
      };
    } catch (error) {
      this.log('error', 'Error getting backup stats', { error: error instanceof Error ? error.message : String(error) });
      return {
        totalCount: 0,
        totalSize: 0,
        totalSizeFormatted: '0 Bytes'
      };
    }
  }

  /**
   * Check if backup system is available
   * 
   * @returns true if backup system is ready
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.rawalite?.backup);
  }

  // === UTILITY METHODS ===

  /**
   * Formats byte size for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formats date for display
   */
  private formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
export const backupService = new BackupService();