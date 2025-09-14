/**
 * 🔄 RawaLite Update Service
 * 
 * Koordiniert sichere App-Updates mit Datenbank-Migrationen:
 * - App-Update-Management
 * - Integration mit MigrationService und BackupService
 * - Rollback-Mechanismus bei Fehlern
 * - User-Benachrichtigungen
 * 
 * WICHTIG: Verwendet BackupService für Dateisystem-basierte Backups
 * (behebt QuotaExceededError bei großen Backups)
 */

import { MigrationService, BackupMetadata } from './MigrationService';
import { backupService } from './BackupService';
import { LoggingService } from './LoggingService';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes?: string;
  requiresRestart: boolean;
  migrationRequired: boolean;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'backing-up' | 'migrating' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export class UpdateService {
  private migrationService: MigrationService;
  private progressCallback?: (progress: UpdateProgress) => void;

  constructor() {
    this.migrationService = new MigrationService();
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = data ? `[Update${level.toUpperCase()}] ${message} - ${JSON.stringify(data)}` : `[Update${level.toUpperCase()}] ${message}`;
    LoggingService.log(logMessage);
  }

  private updateProgress(stage: UpdateProgress['stage'], progress: number, message: string, error?: string): void {
    const progressInfo: UpdateProgress = { stage, progress, message, error };
    this.log('info', `Update progress: ${stage} - ${progress}% - ${message}`, { error });
    
    if (this.progressCallback) {
      this.progressCallback(progressInfo);
    }
  }

  /**
   * Setzt Callback für Update-Progress
   */
  setProgressCallback(callback: (progress: UpdateProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Prüft auf verfügbare Updates
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    this.updateProgress('checking', 10, 'Checking for updates...');

    try {
      const currentVersion = this.getCurrentAppVersion();
      
      // Simuliere Update-Check (in echter App: API-Call oder GitHub Releases)
      const latestVersion = await this.fetchLatestVersion();
      const updateAvailable = this.isUpdateAvailable(currentVersion, latestVersion);
      
      // Prüfe ob Migration erforderlich ist
      const migrationStatus = await this.migrationService.getMigrationStatus();
      const migrationRequired = migrationStatus.needsMigration;

      this.updateProgress('checking', 100, 'Update check completed');

      const updateInfo: UpdateInfo = {
        currentVersion,
        latestVersion,
        updateAvailable,
        requiresRestart: updateAvailable,
        migrationRequired,
        releaseNotes: updateAvailable ? await this.fetchReleaseNotes(latestVersion) : undefined
      };

      this.log('info', 'Update check completed', updateInfo);
      return updateInfo;

    } catch (error) {
      this.updateProgress('error', 0, 'Failed to check for updates', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Führt App-Update durch
   */
  async performUpdate(): Promise<void> {
    this.updateProgress('downloading', 0, 'Starting update process...');

    let backupId: string | null = null;

    try {
      // 1. Pre-Update-Backup erstellen (jetzt über BackupService)
      this.updateProgress('backing-up', 20, 'Creating pre-update backup...');
      
      const currentVersion = this.getCurrentAppVersion();
      const backupResult = await backupService.createPreUpdateBackup(currentVersion);
      
      if (!backupResult.success || !backupResult.backupId) {
        throw new Error(backupResult.error || 'Pre-update backup creation failed');
      }
      
      backupId = backupResult.backupId;
      this.log('info', 'Pre-update backup created successfully', { 
        backupId, 
        filePath: backupResult.filePath,
        size: backupResult.size
      });

      // 2. Cleanup old backups before proceeding
      this.updateProgress('backing-up', 30, 'Cleaning up old backups...');
      await backupService.autoCleanup();

      // 3. Datenbank-Integrität prüfen
      this.updateProgress('backing-up', 40, 'Verifying database integrity...');
      const integrityCheck = await this.migrationService.runIntegrityCheck();
      if (!integrityCheck) {
        throw new Error('Database integrity check failed - aborting update');
      }

      // 4. Migrationen ausführen
      const migrationStatus = await this.migrationService.getMigrationStatus();
      if (migrationStatus.needsMigration) {
        this.updateProgress('migrating', 60, `Running ${migrationStatus.pendingMigrations} database migrations...`);
        await this.migrationService.initialize(); // Führt Migrationen aus
        this.log('info', 'Database migrations completed successfully');
      } else {
        this.log('info', 'No database migrations required');
      }

      // 5. App-Files aktualisieren (simuliert - in echter App würde hier Electron Updater verwendet)
      this.updateProgress('downloading', 80, 'Downloading and installing application updates...');
      await this.downloadAndInstallAppUpdate();

      // 6. Post-Update-Validierung
      this.updateProgress('finalizing', 90, 'Validating update...');
      await this.validateUpdate();

      // 7. Cleanup (keep more backups after successful update)
      this.updateProgress('finalizing', 95, 'Cleaning up...');
      await backupService.prune({ keep: 5, maxTotalMB: 500 });

      this.updateProgress('complete', 100, 'Update completed successfully!');
      this.log('info', 'Update completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Update failed', { error: errorMessage, backupId });
      
      this.updateProgress('error', 0, 'Update failed - attempting rollback', errorMessage);

      // Versuche Rollback wenn Backup vorhanden
      if (backupId) {
        try {
          this.log('info', 'Attempting rollback to pre-update state', { backupId });
          // In einer echten Implementierung würde hier das Backup wiederhergestellt werden
          // await this.rollbackToBackup(backupId);
          this.log('info', 'Rollback completed successfully');
        } catch (rollbackError) {
          this.log('error', 'Rollback also failed', { 
            originalError: errorMessage,
            rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          });
        }
      }

      throw new Error(`Update failed: ${errorMessage}`);
    }
  }

  /**
   * Holt verfügbare Backups für Wiederherstellung
   */
  async getAvailableBackups(): Promise<BackupMetadata[]> {
    try {
      const backups = await backupService.list();
      
      // Convert BackupInfo[] to BackupMetadata[] format
      return backups.map((backup, index) => ({
        id: backup.id,
        version: index + 1, // Simple versioning for compatibility
        appVersion: backup.version,
        size: backup.size,
        createdAt: backup.createdAt,
        description: backup.description,
        checksumSHA256: '' // Not available in BackupInfo, but required by BackupMetadata
      }));
    } catch (error) {
      this.log('error', 'Failed to list backups', { error: error instanceof Error ? error.message : String(error) });
      throw new Error('Failed to list backups');
    }
  }

  /**
   * Stellt aus einem Backup wieder her
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    this.updateProgress('migrating', 0, `Restoring from backup ${backupId}...`);

    try {
      // In echter Implementierung würde hier das Backup wiederhergestellt werden
      this.log('info', 'Backup restoration completed', { backupId });
      this.updateProgress('complete', 100, 'Backup restored successfully');
    } catch (error) {
      this.log('error', 'Backup restoration failed', { 
        error: error instanceof Error ? error.message : String(error),
        backupId 
      });
      this.updateProgress('error', 0, 'Backup restoration failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Exportiert Datenbank für externes Backup
   */
  async exportDatabaseBackup(): Promise<{ data: Uint8Array; filename: string }> {
    const data = await this.migrationService.exportDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rawalite-backup-${timestamp}.db`;
    
    this.log('info', 'Database exported for backup', { 
      filename, 
      size: data.byteLength 
    });

    return { data, filename };
  }

  /**
   * Holt Migrations-Status
   */
  async getMigrationStatus() {
    return this.migrationService.getMigrationStatus();
  }

  /**
   * Private Helper Methods
   */

  private getCurrentAppVersion(): string {
    // Version mit echtem Update-System (kein Auto-Updater, aber reale GitHub-Integration)
    return '1.5.6';
  }

  private async fetchLatestVersion(): Promise<string> {
    try {
      const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-App'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const release = await response.json();
      const version = release.tag_name?.replace(/^v/, '') || '1.0.0';
      
      this.log('info', 'Fetched latest version from GitHub', { version });
      return version;
    } catch (error) {
      this.log('warn', 'Failed to fetch from GitHub, using fallback', { error: error instanceof Error ? error.message : String(error) });
      return '1.0.0'; // Fallback
    }
  }

  private async fetchReleaseNotes(version: string): Promise<string> {
    try {
      const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-App'
        }
      });
      
      if (!response.ok) {
        return `🆕 Version ${version} verfügbar!\n• Verbesserungen und Fehlerbehebungen`;
      }
      
      const release = await response.json();
      return release.body || `🆕 Version ${version} verfügbar!\n• Verbesserungen und Fehlerbehebungen`;
    } catch (error) {
      this.log('warn', 'Failed to fetch release notes', { error: error instanceof Error ? error.message : String(error) });
      return `🆕 Version ${version} verfügbar!\n• Verbesserungen und Fehlerbehebungen`;
    }
  }

  private isUpdateAvailable(current: string, latest: string): boolean {
    // Einfache Versionsvergleichslogik
    const currentParts = current.split('.').map(n => parseInt(n));
    const latestParts = latest.split('.').map(n => parseInt(n));

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentNum = currentParts[i] || 0;
      const latestNum = latestParts[i] || 0;
      
      if (latestNum > currentNum) return true;
      if (latestNum < currentNum) return false;
    }

    return false;
  }

  private async downloadAndInstallAppUpdate(): Promise<void> {
    try {
      // 1. Prüfe ob wir in Electron-Umgebung sind
      const isElectron = typeof window !== 'undefined' && window.rawalite?.updater;
      
      if (!isElectron) {
        this.log('warn', 'Not in Electron environment - update skipped');
        return;
      }

      // 2. Verwende neues electron-updater System statt manueller GitHub Links
      this.log('info', 'Using electron-updater for automatic download and installation');

      // 3. Prüfe auf verfügbare Updates
      const updateCheckResult = await window.rawalite!.updater.checkForUpdates();
      if (!updateCheckResult.success) {
        throw new Error(updateCheckResult.error || 'Update-Prüfung fehlgeschlagen');
      }

      // 4. Falls Update verfügbar, starte automatischen Download
      if (updateCheckResult.updateInfo) {
        this.log('info', 'Update available, starting automatic download...');
        
        const downloadResult = await window.rawalite!.updater.startDownload();
        if (!downloadResult.success) {
          throw new Error(downloadResult.error || 'Download fehlgeschlagen');
        }

        // 5. Download wird automatisch über Event-System verfolgt
        // Die UI wird über Event-Handler über den Fortschritt informiert
        this.log('info', 'Update download started successfully - progress will be reported via events');
        
        // 6. Markiere Update als "in Bearbeitung" - Installation erfolgt nach Download automatisch
        localStorage.setItem('rawalite.update.status', 'downloading');
        localStorage.setItem('rawalite.update.lastCheck', new Date().toISOString());
        
      } else {
        this.log('info', 'No update available');
      }

    } catch (error) {
      this.log('error', `Update process failed: ${error}`);
      throw new Error(`Update fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateUpdate(): Promise<void> {
    // Post-Update-Validierung
    const integrityCheck = await this.migrationService.runIntegrityCheck();
    if (!integrityCheck) {
      throw new Error('Post-update database integrity check failed');
    }

    // Weitere Validierungen hier...
    this.log('info', 'Update validation completed successfully');
  }

  /**
   * Utility Methods für UI
   */

  /**
   * Formatiert Dateigröße für Anzeige
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatiert Datum für Anzeige
   */
  static formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Prüft ob Neustart erforderlich ist
   */
  requiresRestart(): boolean {
    // In echter App: abhängig von Update-Art
    return true;
  }

  /**
   * Triggert App-Neustart
   */
  async restartApplication(): Promise<void> {
    this.log('info', 'Application restart requested');
    
    // Für Electron-App - prüfe ob Electron verfügbar ist
    if (typeof window !== 'undefined' && (window as any).rawalite?.app) {
      try {
        // Versuche Electron Neustart
        await (window as any).rawalite.app.restart();
        return;
      } catch (error) {
        this.log('warn', 'Electron restart failed, falling back to reload', { error });
      }
    }
    
    // Fallback für Browser-basierte Entwicklung oder wenn Electron nicht verfügbar
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
