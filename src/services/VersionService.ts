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
   * Prüft auf verfügbare Updates via GitHub API
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      // Echte GitHub API statt Simulation
      const latestVersion = await this.fetchLatestVersionFromGitHub();
      const hasGitHubUpdate = this.isUpdateAvailable(currentVersion.version, latestVersion);
      
      // Prüfe auch Migration-Status
      const migrationStatus = await this.updateService.getMigrationStatus();
      const migrationRequired = migrationStatus.needsMigration;
      
      const hasUpdate = hasGitHubUpdate || migrationRequired;
      
      LoggingService.log(`[VersionService] Update check: current=${currentVersion.version}, latest=${latestVersion}, hasUpdate=${hasUpdate}, migrationRequired=${migrationRequired}`);
      
      return {
        hasUpdate,
        currentVersion: currentVersion.version,
        latestVersion: hasGitHubUpdate ? latestVersion : undefined,
        updateNotes: hasGitHubUpdate ? await this.fetchReleaseNotesFromGitHub(latestVersion) : 
                    (migrationRequired ? 'Datenbank-Updates verfügbar' : undefined)
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

  /**
   * Holt die neueste Version von GitHub Releases API
   */
  private async fetchLatestVersionFromGitHub(): Promise<string> {
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
      const version = release.tag_name?.replace(/^v/, '') || this.BASE_VERSION;
      
      LoggingService.log(`[VersionService] Fetched latest version from GitHub: ${version}`);
      return version;
    } catch (error) {
      LoggingService.log(`[VersionService] Failed to fetch from GitHub, using fallback: ${error}`);
      // Fallback to current version if GitHub is unreachable
      return this.BASE_VERSION;
    }
  }

  /**
   * Holt Release Notes von GitHub
   */
  private async fetchReleaseNotesFromGitHub(version: string): Promise<string> {
    try {
      const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-App'
        }
      });
      
      if (!response.ok) {
        return `Update auf Version ${version} verfügbar`;
      }
      
      const release = await response.json();
      return release.body || `Update auf Version ${version} verfügbar`;
    } catch (error) {
      LoggingService.log(`[VersionService] Failed to fetch release notes: ${error}`);
      return `Update auf Version ${version} verfügbar`;
    }
  }

  /**
   * Vergleicht zwei Versionen nach Semantic Versioning
   */
  private isUpdateAvailable(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(n => parseInt(n) || 0);
    const latestParts = latest.split('.').map(n => parseInt(n) || 0);

    // Ensure both arrays have same length (pad with zeros)
    const maxLength = Math.max(currentParts.length, latestParts.length);
    while (currentParts.length < maxLength) currentParts.push(0);
    while (latestParts.length < maxLength) latestParts.push(0);

    for (let i = 0; i < maxLength; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false; // Versions are equal
  }

  private async updateStoredVersion(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      // Hole die neueste Version von GitHub
      const latestVersion = await this.fetchLatestVersionFromGitHub();
      
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
