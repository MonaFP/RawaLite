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
  private readonly BASE_VERSION = '1.7.0';
  private readonly BUILD_DATE = '2025-09-14';
  
  private updateService: UpdateService;
  private currentVersionInfo: VersionInfo | null = null;

  constructor() {
    this.updateService = new UpdateService();
    
    // Bereinige falsche Version im localStorage beim Start (moderate Cleanup)
    const storedVersion = localStorage.getItem('rawalite.app.version');
    if (storedVersion && storedVersion !== this.BASE_VERSION) {
      localStorage.setItem('rawalite.app.version', this.BASE_VERSION);
      localStorage.setItem('rawalite.app.hasUpdate', 'false');
      LoggingService.log(`[VersionService] Updated stored version from ${storedVersion} to ${this.BASE_VERSION}`);
    }
  }

  /**
   * Holt die aktuelle Versionsinformation
   */
  async getCurrentVersion(): Promise<VersionInfo> {
    if (this.currentVersionInfo) {
      return this.currentVersionInfo;
    }

    // Versuche Version aus package.json zu lesen (für Development) oder localStorage
    let version = this.BASE_VERSION;
    let buildNumber = 1;

    try {
      // Hole Version aus package.json wenn verfügbar
      const packageVersion = await this.getPackageVersion();
      if (packageVersion) {
        version = packageVersion;
      } else {
        // Fallback: Aus localStorage gespeicherte Version lesen
        const storedVersion = localStorage.getItem('rawalite.app.version');
        if (storedVersion) {
          version = storedVersion;
        }
      }
    } catch (error) {
      console.warn('Could not read version, using default');
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
   * Prüft auf verfügbare Updates via electron-updater mit GitHub API Fallback
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      LoggingService.log(`[VersionService] Checking for updates, current version: ${currentVersion.version}`);
      
      // Prüfe Migration-Status zuerst (lokale Operation)
      let migrationRequired = false;
      try {
        const migrationStatus = await this.updateService.getMigrationStatus();
        migrationRequired = migrationStatus.needsMigration;
      } catch (migrationError) {
        LoggingService.log(`[VersionService] Migration check failed: ${migrationError}`);
      }
      
      // Verwende electron-updater falls verfügbar, sonst GitHub API Fallback
      let hasElectronUpdate = false;
      let latestVersion: string | undefined;
      let releaseNotes: string | undefined;
      
      const isElectron = typeof window !== 'undefined' && window.rawalite?.updater;
      
      if (isElectron) {
        try {
          LoggingService.log('[VersionService] Using electron-updater for update check');
          const updateResult = await window.rawalite!.updater.checkForUpdates();
          
          if (updateResult.success && updateResult.updateInfo) {
            hasElectronUpdate = true;
            latestVersion = updateResult.updateInfo.version;
            releaseNotes = updateResult.updateInfo.releaseNotes;
            LoggingService.log(`[VersionService] electron-updater found update: ${latestVersion}`);
          } else {
            LoggingService.log('[VersionService] electron-updater: No update available');
          }
        } catch (electronError) {
          LoggingService.log(`[VersionService] electron-updater failed, falling back to GitHub API: ${electronError}`);
          
          // Fallback zu GitHub API
          try {
            latestVersion = await this.fetchLatestVersionFromGitHub();
            hasElectronUpdate = this.isUpdateAvailable(currentVersion.version, latestVersion);
            
            if (hasElectronUpdate) {
              releaseNotes = await this.fetchReleaseNotesFromGitHub(latestVersion);
            }
          } catch (githubError) {
            LoggingService.log(`[VersionService] GitHub API also failed: ${githubError}`);
          }
        }
      } else {
        // Browser-Modus: Verwende GitHub API
        try {
          latestVersion = await this.fetchLatestVersionFromGitHub();
          hasElectronUpdate = this.isUpdateAvailable(currentVersion.version, latestVersion);
          LoggingService.log(`[VersionService] GitHub API check: current=${currentVersion.version}, latest=${latestVersion}, hasUpdate=${hasElectronUpdate}`);
          
          if (hasElectronUpdate) {
            releaseNotes = await this.fetchReleaseNotesFromGitHub(latestVersion);
          }
        } catch (githubError) {
          LoggingService.log(`[VersionService] GitHub API failed: ${githubError}`);
        }
      }
      
      const hasUpdate = hasElectronUpdate || migrationRequired;
      
      LoggingService.log(`[VersionService] Final update check result: hasUpdate=${hasUpdate}, migration=${migrationRequired}, electronUpdater=${hasElectronUpdate}`);
      
      return {
        hasUpdate,
        currentVersion: currentVersion.version,
        latestVersion: hasElectronUpdate ? latestVersion : undefined,
        updateNotes: releaseNotes || (migrationRequired ? 'Datenbank-Updates verfügbar' : undefined)
      };
    } catch (error) {
      LoggingService.log(`[VersionService] Update check failed: ${error}`);
      
      // Fallback: Versuche wenigstens aktuelle Version zu laden
      try {
        const currentVersion = await this.getCurrentVersion();
        return {
          hasUpdate: false,
          currentVersion: currentVersion.version
        };
      } catch (fallbackError) {
        LoggingService.log(`[VersionService] Complete fallback failed: ${fallbackError}`);
        return {
          hasUpdate: false,
          currentVersion: '1.0.0'
        };
      }
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

  /**
   * Holt die Version aus der package.json (für Development builds)
   */
  private async getPackageVersion(): Promise<string | null> {
    try {
      // In Electron können wir die package.json über das main process laden
      // Für jetzt verwenden wir die BASE_VERSION als Fallback
      
      // Für Testing: Verwende die echte Version aus package.json
      return this.BASE_VERSION;
    } catch (error) {
      return null;
    }
  }

  private isDevelopmentMode(): boolean {
    // Prüfe auf Development-Umgebung
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  /**
   * Holt die neueste Version von GitHub Releases API mit Private-Repo Fallback
   */
  private async fetchLatestVersionFromGitHub(): Promise<string> {
    try {
      // Kurzes Timeout für GitHub API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout
      
      const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RawaLite-App'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 404) {
        // Repository ist wahrscheinlich privat - verwende Fallback
        LoggingService.log('[VersionService] Repository appears to be private (404), using fallback');
        throw new Error('Repository private - using fallback');
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const release = await response.json();
      const version = release.tag_name?.replace(/^v/, '') || this.BASE_VERSION;
      
      LoggingService.log(`[VersionService] Fetched latest version from GitHub: ${version}`);
      return version;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        LoggingService.log('[VersionService] GitHub API timeout, using fallback');
      } else {
        LoggingService.log(`[VersionService] Failed to fetch from GitHub: ${error}`);
      }
      // Fallback to demo version when GitHub is unreachable
      throw error; // Re-throw to trigger fallback in calling function
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
    try {
      const currentParts = current.split('.').map(n => parseInt(n) || 0);
      const latestParts = latest.split('.').map(n => parseInt(n) || 0);

      // Ensure both arrays have same length (pad with zeros)
      const maxLength = Math.max(currentParts.length, latestParts.length);
      while (currentParts.length < maxLength) currentParts.push(0);
      while (latestParts.length < maxLength) latestParts.push(0);

      for (let i = 0; i < maxLength; i++) {
        if (latestParts[i] > currentParts[i]) {
          LoggingService.log(`[VersionService] Update available: ${current} -> ${latest}`);
          return true;
        }
        if (latestParts[i] < currentParts[i]) {
          LoggingService.log(`[VersionService] Current version is newer: ${current} vs ${latest}`);
          return false;
        }
      }

      LoggingService.log(`[VersionService] Versions are equal: ${current} = ${latest}`);
      return false; // Versions are equal
    } catch (error) {
      LoggingService.log(`[VersionService] Error comparing versions: ${error}`);
      return false;
    }
  }

  private async updateStoredVersion(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      // Da wir bei Version 1.5.0 sind, ist kein Update nötig
      // Markiere als aktuell
      localStorage.setItem('rawalite.app.version', this.BASE_VERSION);
      localStorage.setItem('rawalite.app.lastUpdate', new Date().toISOString());
      localStorage.setItem('rawalite.app.hasUpdate', 'false');
      
      // Cache leeren für sofortige Anzeige
      this.currentVersionInfo = null;
      
      LoggingService.log(`[VersionService] Version confirmed as current: ${this.BASE_VERSION}`);
      
      // Trigger storage event für andere Tabs/Components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'rawalite.app.version',
        newValue: this.BASE_VERSION,
        oldValue: currentVersion.version
      }));
      
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
