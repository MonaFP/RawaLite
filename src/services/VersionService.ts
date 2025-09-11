/**
 * 🏷️ RawaLite Version Service
 * 
 * Verwaltet App-Versionierung und automatische Updates der Versionsnummer
 */

import { UpdateService } from './UpdateService';
import { LoggingService } from './LoggingService';

export interface VersionInfo {
  version: string;
  buildNumber: number;
  buildDate: string;
  gitHash?: string;
  isDevelopment: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateNotes?: string;
}

export class VersionService {
  private readonly BASE_VERSION = '1.0.0';
  private readonly BUILD_DATE = '2025-09-11';
  
  private updateService: UpdateService;
  private currentVersionInfo: VersionInfo | null = null;

  constructor() {
    this.updateService = new UpdateService();
  }

  /**
   * Holt die aktuelle Versionsinformation
   */
  async getCurrentVersion(): Promise<VersionInfo> {
    if (this.currentVersionInfo) {
      return this.currentVersionInfo;
    }

    // Versuche aus localStorage gespeicherte Version zu lesen
    let version = this.BASE_VERSION;
    let buildNumber = 1;

    try {
      const storedVersion = localStorage.getItem('rawalite.app.version');
      if (storedVersion) {
        version = storedVersion;
      }
    } catch (error) {
      console.warn('Could not read stored version, using default');
    }

    // Build Number aus Migration Status generieren
    try {
      const migrationService = new (await import('./MigrationService')).MigrationService();
      const migrationStatus = await migrationService.getMigrationStatus();
      buildNumber = migrationStatus.currentVersion || 1;
    } catch (error) {
      console.warn('Could not get build number from migration status');
    }

    this.currentVersionInfo = {
      version,
      buildNumber,
      buildDate: this.BUILD_DATE,
      isDevelopment: this.isDevelopmentMode()
    };

    return this.currentVersionInfo;
  }

  /**
   * Formatiert die Version für Anzeige im Header
   */
  async getDisplayVersion(): Promise<string> {
    const versionInfo = await this.getCurrentVersion();
    
    if (versionInfo.isDevelopment) {
      return `v${versionInfo.version}-dev`;
    }
    
    return `v${versionInfo.version}`;
  }

  /**
   * Prüft auf verfügbare Updates
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const updateInfo = await this.updateService.checkForUpdates();
      
      LoggingService.log(`[VersionService] Update check: hasUpdate=${updateInfo.updateAvailable}`);
      
      return {
        hasUpdate: updateInfo.updateAvailable || updateInfo.migrationRequired,
        currentVersion: currentVersion.version,
        latestVersion: updateInfo.updateAvailable ? updateInfo.latestVersion : undefined,
        updateNotes: updateInfo.releaseNotes || (updateInfo.migrationRequired ? 'Datenbank-Updates verfügbar' : undefined)
      };
    } catch (error) {
      LoggingService.log(`[VersionService] Update check failed: ${error}`);
      
      const currentVersion = await this.getCurrentVersion();
      return {
        hasUpdate: false,
        currentVersion: currentVersion.version
      };
    }
  }

  /**
   * Führt ein Update durch
   */
  async performUpdate(progressCallback?: (progress: number, message: string) => void): Promise<void> {
    try {
      LoggingService.log('[VersionService] Starting update process');
      
      progressCallback?.(10, 'Update wird vorbereitet...');
      
      // Setze Update-Service Callback
      this.updateService.setProgressCallback((updateProgress) => {
        // Update-Progress an UI weiterleiten (10-90%)
        const scaledProgress = 10 + (updateProgress.progress * 0.8);
        progressCallback?.(scaledProgress, updateProgress.message);
      });
      
      // Führe Update durch
      await this.updateService.performUpdate();
      
      progressCallback?.(95, 'Version wird aktualisiert...');
      
      // Version in lokalem Storage aktualisieren
      await this.updateStoredVersion();
      
      progressCallback?.(100, 'Update erfolgreich abgeschlossen');
      
      // Cache leeren für nächsten getCurrentVersion Aufruf
      this.currentVersionInfo = null;
      
      LoggingService.log('[VersionService] Update completed successfully');
      
    } catch (error) {
      LoggingService.log(`[VersionService] Update failed: ${error}`);
      throw new Error(`Update fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gibt Versionsinformationen für Debugging zurück
   */
  async getDebugInfo(): Promise<{
    version: VersionInfo;
    updateInfo: any;
    systemInfo: {
      userAgent: string;
      platform: string;
      language: string;
    };
  }> {
    const version = await this.getCurrentVersion();
    const updateInfo = await this.updateService.checkForUpdates();
    
    return {
      version,
      updateInfo,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };
  }

  // Private Hilfsfunktionen

  private isDevelopmentMode(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  private hasNewerVersion(): boolean {
    // Prüfe ob kürzlich ein Update installiert wurde
    const lastUpdate = localStorage.getItem('rawalite.app.lastUpdate');
    const hasUpdate = localStorage.getItem('rawalite.app.hasUpdate');
    
    if (hasUpdate === 'false') {
      // Kürzlich aktualisiert, kein neues Update für eine Weile
      const updateTime = lastUpdate ? new Date(lastUpdate).getTime() : 0;
      const now = new Date().getTime();
      const timeSinceUpdate = now - updateTime;
      
      // Mindestens 5 Minuten warten bevor wieder Updates angeboten werden
      if (timeSinceUpdate < 5 * 60 * 1000) {
        return false;
      }
    }
    
    // Für Demo-Zwecke simulieren wir gelegentlich verfügbare Updates
    // Aber weniger häufig als vorher
    const updateAvailable = Math.random() < 0.05; // 5% Chance auf verfügbares Update
    
    if (updateAvailable) {
      localStorage.setItem('rawalite.app.hasUpdate', 'true');
    }
    
    return updateAvailable;
  }

  private getLatestAvailableVersion(): string {
    // Simulierte neueste Version
    const current = this.BASE_VERSION.split('.').map(Number);
    current[2] += 1; // Patch-Version erhöhen
    return current.join('.');
  }

  private async updateStoredVersion(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const latestVersion = this.getLatestAvailableVersion();
      
      // Aktualisiere die BASE_VERSION für zukünftige Aufrufe
      (this as any).BASE_VERSION = latestVersion;
      
      // Speichere in localStorage
      localStorage.setItem('rawalite.app.version', latestVersion);
      localStorage.setItem('rawalite.app.lastUpdate', new Date().toISOString());
      localStorage.setItem('rawalite.app.hasUpdate', 'false'); // Markiere als aktualisiert
      
      LoggingService.log(`[VersionService] Version updated from ${currentVersion.version} to ${latestVersion}`);
    } catch (error) {
      LoggingService.log(`[VersionService] Failed to update stored version: ${error}`);
    }
  }

  /**
   * Event Listener für automatische Version-Updates
   */
  onVersionUpdate(callback: (newVersion: string) => void): () => void {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'rawalite.app.version' && event.newValue) {
        callback(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup-Funktion zurückgeben
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

// Singleton-Instanz für globale Verwendung
export const versionService = new VersionService();
