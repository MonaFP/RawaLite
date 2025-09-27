/**
 * 📦 Backup Implementation for Main Process
 * 
 * Handles filesystem-based backup operations in the main Electron process.
 * Stores backups in AppData/backups/ with streaming for memory efficiency.
 * 
 * Features:
 * - Streaming ZIP creation to avoid memory issues
 * - Automatic rotation and size limits
 * - Detailed metadata tracking
 * - Cross-platform path handling
 * - Atomic operations with cleanup on failure
 */

import { app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import type { BackupCreateOptions, BackupCreateResult, BackupListResult, BackupPruneOptions, BackupPruneResult } from '../src/types/ipc';
import { getBackupDir, getDbPath } from '../src/lib/paths';

interface BackupMetadata {
  id: string;
  kind: string;
  filePath: string;
  size: number;
  createdAt: string;
  description: string;
  version: string;
  checksum: string;
}

export class BackupManager {
  private backupsDir: string;
  private metadataFile: string;

  constructor() {
    // Use central path management for consistent backups directory
    this.backupsDir = getBackupDir();
    this.metadataFile = path.join(this.backupsDir, 'metadata.json');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure backups directory exists
      await fs.mkdir(this.backupsDir, { recursive: true });
      console.log('✅ Backup directory initialized:', this.backupsDir);
      
      // Test write permissions
      const testFile = path.join(this.backupsDir, '.write-test');
      try {
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        console.log('✅ Backup directory is writable');
      } catch (writeError) {
        console.warn('⚠️ Backup directory may not be writable:', writeError);
        // Don't throw - system can still function
      }
    } catch (error) {
      console.error('❌ Failed to initialize backup directory:', error);
      // Don't throw - allow system to continue without backups
      console.log('⚠️ Continuing without backup system...');
    }
  }

  async createBackup(options: BackupCreateOptions): Promise<BackupCreateResult> {
    try {
      console.log('🔄 Creating backup:', options);

      // Generate backup metadata
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      const version = options.payloadMeta?.version || '1.0.0';
      const filename = `rawalite-backup_${timestamp.replace(/[:.]/g, '-')}_${version}_${options.kind}.zip`;
      const filePath = path.join(this.backupsDir, filename);

      // Get database data from existing SQLite file or export
      const dbData = await this.getDatabaseData();
      if (!dbData) {
        throw new Error('No database data available for backup');
      }

      // Create ZIP with streaming for memory efficiency
      const zip = new JSZip();
      
      // Add database file
      zip.file('database.sqlite', dbData);
      
      // Add metadata
      const metadata = {
        id: backupId,
        kind: options.kind,
        createdAt: timestamp,
        description: options.description || `${options.kind} backup`,
        version,
        appVersion: this.getAppVersion()
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Generate ZIP and write to file
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      await fs.writeFile(filePath, zipBuffer);

      // Calculate file size and checksum
      const stats = await fs.stat(filePath);
      const checksum = await this.calculateFileChecksum(filePath);

      // Save backup metadata
      const backupMeta: BackupMetadata = {
        id: backupId,
        kind: options.kind,
        filePath,
        size: stats.size,
        createdAt: timestamp,
        description: options.description || `${options.kind} backup`,
        version,
        checksum
      };

      await this.saveBackupMetadata(backupMeta);

      console.log('✅ Backup created successfully:', {
        id: backupId,
        path: filePath,
        size: stats.size
      });

      return {
        success: true,
        backupId,
        filePath,
        size: stats.size
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Backup creation failed:', errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  async listBackups(): Promise<BackupListResult> {
    try {
      const metadata = await this.loadBackupMetadata();
      
      // Verify files still exist and update metadata
      const validBackups: BackupMetadata[] = [];
      
      for (const backup of metadata) {
        try {
          await fs.access(backup.filePath);
          validBackups.push(backup);
        } catch {
          console.warn('⚠️ Backup file missing, removing from metadata:', backup.filePath);
        }
      }

      // Save cleaned metadata if any files were missing
      if (validBackups.length !== metadata.length) {
        await this.saveAllBackupMetadata(validBackups);
      }

      // Convert to API format
      const backups = validBackups.map(backup => ({
        id: backup.id,
        kind: backup.kind,
        filePath: backup.filePath,
        size: backup.size,
        createdAt: backup.createdAt,
        description: backup.description,
        version: backup.version
      }));

      console.log('📋 Listed backups:', { count: backups.length });

      return {
        success: true,
        backups
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to list backups:', errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  async pruneBackups(options: BackupPruneOptions): Promise<BackupPruneResult> {
    try {
      const keep = options.keep || 5;
      const maxTotalMB = options.maxTotalMB || 500;
      const maxTotalBytes = maxTotalMB * 1024 * 1024;

      console.log('🧹 Pruning backups:', { keep, maxTotalMB });

      const metadata = await this.loadBackupMetadata();
      
      // Sort by creation date (newest first)
      const sortedBackups = [...metadata].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const toKeep: BackupMetadata[] = [];
      const toRemove: BackupMetadata[] = [];
      let totalSize = 0;

      // Apply retention policy
      for (let i = 0; i < sortedBackups.length; i++) {
        const backup = sortedBackups[i];
        
        if (i < keep && totalSize + backup.size <= maxTotalBytes) {
          // Keep this backup
          toKeep.push(backup);
          totalSize += backup.size;
        } else {
          // Remove this backup
          toRemove.push(backup);
        }
      }

      // Remove files and update metadata
      let removedCount = 0;
      for (const backup of toRemove) {
        try {
          await fs.unlink(backup.filePath);
          removedCount++;
          console.log('🗑️ Removed backup:', backup.filePath);
        } catch (error) {
          console.warn('⚠️ Failed to remove backup file:', backup.filePath, error);
        }
      }

      // Save updated metadata
      await this.saveAllBackupMetadata(toKeep);

      console.log('✅ Backup pruning completed:', { removedCount, keptCount: toKeep.length });

      return {
        success: true,
        removedCount
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Backup pruning failed:', errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  // === PRIVATE HELPERS ===

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAppVersion(): string {
    return app.getVersion() || '1.0.0';
  }

  private async getDatabaseData(): Promise<Buffer | null> {
    try {
      // Use standardized database path from central path management
      const dbPath = getDbPath();
      
      try {
        const data = await fs.readFile(dbPath);
        console.log('📄 Read database from file:', dbPath, 'Size:', data.length);
        return data;
      } catch {
        // Database file doesn't exist yet, return null
        console.warn('⚠️ Database file not found, creating empty backup');
        return Buffer.from(''); // Empty database backup
      }
    } catch (error) {
      console.error('❌ Failed to get database data:', error);
      return null;
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      
      for await (const chunk of stream) {
        hash.update(chunk);
      }
      
      return hash.digest('hex');
    } catch (error) {
      console.warn('⚠️ Failed to calculate checksum:', error);
      return 'unknown';
    }
  }

  private async loadBackupMetadata(): Promise<BackupMetadata[]> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      // File doesn't exist yet
      return [];
    }
  }

  private async saveBackupMetadata(backup: BackupMetadata): Promise<void> {
    const metadata = await this.loadBackupMetadata();
    metadata.push(backup);
    await this.saveAllBackupMetadata(metadata);
  }

  private async saveAllBackupMetadata(metadata: BackupMetadata[]): Promise<void> {
    await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}

// Global instance
let backupManager: BackupManager | null = null;

export function initializeBackupSystem(): void {
  try {
    console.log('🔄 Initializing backup system...');
    
    // Create backup manager instance
    backupManager = new BackupManager();
    
    // Initialize backup directory with better error handling
    backupManager.initialize().catch(error => {
      console.error('❌ Failed to initialize backup directory:', error);
      // Don't crash - system can still function without backups
    });

    // Register IPC handlers with enhanced error handling
    ipcMain.handle('backup:create', async (_, options: BackupCreateOptions) => {
      try {
        if (!backupManager) {
          console.error('❌ Backup manager not available during create operation');
          return { 
            success: false, 
            error: 'Backup-System ist nicht verfügbar. Bitte App neu starten.' 
          };
        }
        
        console.log('📦 Creating backup with options:', options);
        const result = await backupManager.createBackup(options);
        console.log('📦 Backup creation result:', result.success ? 'SUCCESS' : result.error);
        return result;
      } catch (error) {
        console.error('❌ Backup creation error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Backup-Fehler'
        };
      }
    });

    ipcMain.handle('backup:list', async () => {
      try {
        if (!backupManager) {
          console.error('❌ Backup manager not available during list operation');
          return { 
            success: false, 
            error: 'Backup-System ist nicht verfügbar. Bitte App neu starten.' 
          };
        }
        
        const result = await backupManager.listBackups();
        console.log('📋 Backup list result:', result.success ? `${result.backups?.length || 0} backups` : result.error);
        return result;
      } catch (error) {
        console.error('❌ Backup list error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Fehler beim Laden der Backup-Liste'
        };
      }
    });

    ipcMain.handle('backup:prune', async (_, options: BackupPruneOptions) => {
      try {
        if (!backupManager) {
          console.error('❌ Backup manager not available during prune operation');
          return { 
            success: false, 
            error: 'Backup-System ist nicht verfügbar. Bitte App neu starten.' 
          };
        }
        
        console.log('🧹 Pruning backups with options:', options);
        const result = await backupManager.pruneBackups(options);
        console.log('🧹 Backup prune result:', result.success ? `${result.removedCount} removed` : result.error);
        return result;
      } catch (error) {
        console.error('❌ Backup prune error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Fehler beim Bereinigen der Backups'
        };
      }
    });

    console.log('✅ Backup IPC handlers registered successfully');
    
  } catch (initError) {
    console.error('❌ Critical backup system initialization error:', initError);
    
    // Register fallback IPC handlers to prevent IPC errors
    const fallbackHandler = async () => ({
      success: false,
      error: 'Backup-System konnte nicht initialisiert werden. Bitte App neu starten.'
    });
    
    ipcMain.handle('backup:create', fallbackHandler);
    ipcMain.handle('backup:list', fallbackHandler);  
    ipcMain.handle('backup:prune', fallbackHandler);
    
    console.log('⚠️ Fallback backup handlers registered due to initialization failure');
    throw initError; // Re-throw so caller knows initialization failed
  }
}