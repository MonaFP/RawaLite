/**
 * 🏷️ RawaLite Version Service
 *
 * Verwaltet App-Versionierung und automatische Updates der Versionsnummer
 */

import { LoggingService } from "./LoggingService";

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
  // 🔧 CRITICAL FIX: Removed hardcoded BASE_VERSION to prevent version conflicts after updates
  private readonly BUILD_DATE = "2025-09-18";

  private currentVersionInfo: VersionInfo | null = null;

  constructor() {

    // 🔧 CRITICAL FIX: No more localStorage manipulation in constructor
    // This was overriding legitimate version updates after successful installs

    LoggingService.log(
      `[VersionService] Constructor initialized - will get version from Electron IPC`
    );
  }

  /**
   * Holt die aktuelle Versionsinformation
   */
  async getCurrentVersion(): Promise<VersionInfo> {
    if (this.currentVersionInfo) {
      return this.currentVersionInfo;
    }

    // 🔧 CRITICAL FIX: Use electron-updater IPC for version detection
    let version = await this.getElectronUpdaterVersion();
    let buildNumber = 1;

    // 🔧 CRITICAL FIX: If electron-updater IPC fails, fallback to legacy IPC
    if (!version) {
      console.warn(
        "[VersionService] electron-updater IPC failed, using legacy IPC fallback"
      );
      version = await this.getElectronVersion();
    }

    // Last resort: package.json fallback
    if (!version) {
      console.warn(
        "[VersionService] All Electron IPC failed, using package.json fallback"
      );
      version = await this.getPackageJsonFallback();
    }

    if (!version) {
      console.error(
        "[VersionService] All version sources failed, using emergency fallback"
      );
      version = "1.0.0"; // Emergency fallback only
    }

    // Build Number aus Migration Status generieren
    try {
      const migrationService = new (
        await import("./MigrationService")
      ).MigrationService();
      const migrationStatus = await migrationService.getMigrationStatus();
      buildNumber = migrationStatus.currentVersion || 1;
    } catch (error) {
      console.warn("Could not get build number from migration status");
    }

    this.currentVersionInfo = {
      version,
      buildNumber,
      buildDate: this.BUILD_DATE,
      isDevelopment: this.isDevelopmentMode(),
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

      LoggingService.log(
        `[VersionService] Checking for updates, current version: ${currentVersion.version}`
      );

      // Migration-Status-Check entfernt - wird durch electron-updater gehandhabt
      let migrationRequired = false;

      // Verwende electron-updater falls verfügbar, sonst GitHub API Fallback
      let hasElectronUpdate = false;
      let latestVersion: string | undefined;
      let releaseNotes: string | undefined;

      const isElectron =
        typeof window !== "undefined" && window.rawalite?.updater;

      // CRITICAL FIX: Erkenne Development-Modus besser
      const isDevelopment =
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === "development" ||
        location?.hostname === "localhost" ||
        location?.hostname === "127.0.0.1" ||
        location?.port === "5173" ||
        currentVersion.isDevelopment;

      if (isElectron && !isDevelopment) {
        try {
          LoggingService.log(
            "[VersionService] Using electron-updater for update check"
          );
          const updateResult = await window.rawalite!.updater.checkForUpdates();

          if (updateResult.success && updateResult.updateInfo) {
            hasElectronUpdate = true;
            latestVersion = updateResult.updateInfo.version;
            releaseNotes = updateResult.updateInfo.releaseNotes;
            LoggingService.log(
              `[VersionService] electron-updater found update: ${latestVersion}`
            );
          } else {
            LoggingService.log(
              "[VersionService] electron-updater: No update available"
            );
          }
        } catch (electronError) {
          LoggingService.log(
            `[VersionService] electron-updater failed, falling back to GitHub API: ${electronError}`
          );

          // Fallback zu GitHub API
          try {
            latestVersion = await this.fetchLatestVersionFromGitHub();
            hasElectronUpdate = this.isUpdateAvailable(
              currentVersion.version,
              latestVersion
            );

            if (hasElectronUpdate) {
              releaseNotes = await this.fetchReleaseNotesFromGitHub(
                latestVersion
              );
            }
          } catch (githubError) {
            LoggingService.log(
              `[VersionService] GitHub API also failed: ${githubError}`
            );
          }
        }
      } else if (isDevelopment) {
        LoggingService.log(
          "[VersionService] Development mode detected - skipping update checks"
        );
        // Im Development-Modus: Keine externen Update-Checks
        hasElectronUpdate = false;
        latestVersion = currentVersion.version;
      } else {
        // Browser-Modus: Verwende GitHub API
        try {
          latestVersion = await this.fetchLatestVersionFromGitHub();
          hasElectronUpdate = this.isUpdateAvailable(
            currentVersion.version,
            latestVersion
          );

          LoggingService.log(
            `[VersionService] GitHub API check: current=${currentVersion.version}, latest=${latestVersion}, hasUpdate=${hasElectronUpdate}`
          );

          if (hasElectronUpdate) {
            releaseNotes = await this.fetchReleaseNotesFromGitHub(
              latestVersion
            );
          }
        } catch (githubError) {
          LoggingService.log(
            `[VersionService] GitHub API failed: ${githubError}`
          );
        }
      }

      const hasUpdate = hasElectronUpdate || migrationRequired;

      LoggingService.log(
        `[VersionService] Final update check result: hasUpdate=${hasUpdate}, migration=${migrationRequired}, electronUpdater=${hasElectronUpdate}`
      );

      return {
        hasUpdate,
        currentVersion: currentVersion.version,
        latestVersion: hasElectronUpdate ? latestVersion : undefined,
        updateNotes:
          releaseNotes ||
          (migrationRequired ? "Datenbank-Updates verfügbar" : undefined),
      };
    } catch (error) {
      LoggingService.log(`[VersionService] Update check failed: ${error}`);

      // Fallback: Versuche wenigstens aktuelle Version zu laden
      try {
        const currentVersion = await this.getCurrentVersion();
        return {
          hasUpdate: false,
          currentVersion: currentVersion.version,
        };
      } catch (fallbackError) {
        LoggingService.log(
          `[VersionService] Complete fallback failed: ${fallbackError}`
        );
        return {
          hasUpdate: false,
          currentVersion: "1.0.0",
        };
      }
    }
  }

  /**
   * Führt ein Update durch (via electron-updater)
   */
  async performUpdate(
    progressCallback?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      LoggingService.log("[VersionService] Starting update process");

      progressCallback?.(10, "Update wird vorbereitet...");

      // Verwende electron-updater direkt
      if (typeof window !== "undefined" && window.rawalite?.updater) {
        progressCallback?.(50, "Update wird heruntergeladen...");
        await window.rawalite.updater.startDownload();
        
        progressCallback?.(90, "Installation wird vorbereitet...");
        await window.rawalite.updater.installAndRestart();
      } else {
        throw new Error("electron-updater nicht verfügbar");
      }

      progressCallback?.(100, "Update erfolgreich abgeschlossen");

      // Cache leeren für nächsten getCurrentVersion Aufruf
      this.currentVersionInfo = null;

      LoggingService.log("[VersionService] Update completed successfully");
    } catch (error) {
      LoggingService.log(`[VersionService] Update failed: ${error}`);
      throw new Error(
        `Update fehlgeschlagen: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
    const updateInfo = await this.checkForUpdates(); // Use own method instead

    return {
      version,
      updateInfo,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    };
  }

  // Private Hilfsfunktionen

  /**
   * 🔧 CRITICAL FIX: Holt Version über electron-updater IPC (neueste API)
   */
  private async getElectronUpdaterVersion(): Promise<string | null> {
    try {
      // PRIMARY: Get version from electron-updater API (most current after updates)
      if (typeof window !== "undefined" && window.rawalite?.updater) {
        const versionInfo = await window.rawalite.updater.getVersion();
        console.log(
          "[VersionService] ✅ Got version from electron-updater (authoritative):",
          versionInfo.current
        );
        return versionInfo.current;
      }
      console.warn("[VersionService] ⚠️ electron-updater IPC not available");
      return null;
    } catch (error) {
      console.warn(
        "[VersionService] Failed to get version from electron-updater:",
        error
      );
      return null;
    }
  }

  /**
   * 🔧 CRITICAL FIX: Direct Electron version retrieval with proper error handling (legacy fallback)
   */
  private async getElectronVersion(): Promise<string | null> {
    try {
      // PRIMARY: Get real app version from Electron via IPC (post-update correct)
      if (typeof window !== "undefined" && window.rawalite?.app) {
        const electronVersion = await window.rawalite.app.getVersion();
        console.log(
          "[VersionService] ✅ Got Electron app version (authoritative):",
          electronVersion
        );
        return electronVersion;
      }
      console.warn("[VersionService] ⚠️ Electron IPC not available");
      return null;
    } catch (error) {
      console.warn(
        "[VersionService] Failed to get version from Electron:",
        error
      );
      return null;
    }
  }

  /**
   * 🔧 NEW: Package.json fallback for development/edge cases
   */
  private async getPackageJsonFallback(): Promise<string | null> {
    try {
      // This would read from the bundled package.json in development
      return "1.8.24";       // Current package.json version as absolute fallback
    } catch (error) {
      console.error("[VersionService] Package.json fallback failed:", error);
      return null;
    }
  }

  private isDevelopmentMode(): boolean {
    // Prüfe auf Development-Umgebung
    return import.meta.env.DEV || window.location.hostname === "localhost";
  }

  /**
   * Holt die neueste Version von GitHub Releases API mit Private-Repo Fallback
   */
  private async fetchLatestVersionFromGitHub(): Promise<string> {
    try {
      // ⚠️ GITHUB-HTTP-CALL: Erlaubter FALLBACK wenn electron-updater fehlschlägt
      // (Gemäß COPILOT_INSTRUCTIONS.md: "Fallback zu GitHub API wenn electron-updater fehlschlägt")
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sekunden Timeout

      const response = await fetch(
        "https://api.github.com/repos/MonaFP/RawaLite/releases/latest",
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "RawaLite-App",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 404) {
        // Repository ist wahrscheinlich privat - verwende Fallback
        LoggingService.log(
          "[VersionService] Repository appears to be private (404), using fallback"
        );
        throw new Error("Repository private - using fallback");
      }

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const release = await response.json();
      const version = release.tag_name?.replace(/^v/, "") || "1.8.1"; // Use current as fallback

      LoggingService.log(
        `[VersionService] FALLBACK: Fetched latest version from GitHub: ${version}`
      );
      return version;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        LoggingService.log(
          "[VersionService] GitHub API timeout, using fallback"
        );
      } else {
        LoggingService.log(
          `[VersionService] Failed to fetch from GitHub: ${error}`
        );
      }
      // Fallback to demo version when GitHub is unreachable
      throw error; // Re-throw to trigger fallback in calling function
    }
  }

  /**
   * Holt Release Notes von GitHub (ERLAUBTER FALLBACK)
   */
  private async fetchReleaseNotesFromGitHub(version: string): Promise<string> {
    try {
      // ⚠️ GITHUB-HTTP-CALL: Erlaubter FALLBACK wenn electron-updater fehlschlägt
      // (Gemäß COPILOT_INSTRUCTIONS.md: "Fallback zu GitHub API wenn electron-updater fehlschlägt")
      const response = await fetch(
        "https://api.github.com/repos/MonaFP/RawaLite/releases/latest",
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "RawaLite-App",
          },
        }
      );

      if (!response.ok) {
        return `Update auf Version ${version} verfügbar`;
      }

      const release = await response.json();
      return release.body || `Update auf Version ${version} verfügbar`;
    } catch (error) {
      LoggingService.log(
        `[VersionService] Failed to fetch release notes: ${error}`
      );
      return `Update auf Version ${version} verfügbar`;
    }
  }

  /**
   * Vergleicht zwei Versionen nach Semantic Versioning
   */
  private isUpdateAvailable(current: string, latest: string): boolean {
    return this.isVersionOutdated(current, latest);
  }

  /**
   * Prüft ob eine Version veraltet ist (current < latest)
   */
  private isVersionOutdated(current: string, latest: string): boolean {
    try {
      const currentParts = current.split(".").map((n) => parseInt(n) || 0);
      const latestParts = latest.split(".").map((n) => parseInt(n) || 0);

      // Ensure both arrays have same length (pad with zeros)
      const maxLength = Math.max(currentParts.length, latestParts.length);
      while (currentParts.length < maxLength) currentParts.push(0);
      while (latestParts.length < maxLength) latestParts.push(0);

      for (let i = 0; i < maxLength; i++) {
        if (latestParts[i] > currentParts[i]) {
          LoggingService.log(
            `[VersionService] Update available: ${current} -> ${latest}`
          );
          return true;
        }
        if (latestParts[i] < currentParts[i]) {
          LoggingService.log(
            `[VersionService] Current version is newer: ${current} vs ${latest}`
          );
          return false;
        }
      }

      LoggingService.log(
        `[VersionService] Versions are equal: ${current} = ${latest}`
      );
      return false; // Versions are equal
    } catch (error) {
      LoggingService.log(`[VersionService] Error comparing versions: ${error}`);
      return false;
    }
  }

  private async updateStoredVersion(): Promise<void> {
    // 🔧 CRITICAL FIX: Remove localStorage version overrides entirely
    // After successful updates, the version should come from Electron IPC only

    try {
      // Just clear the cache to force reload from Electron
      this.currentVersionInfo = null;
      LoggingService.log(
        `[VersionService] Version cache cleared - will reload from Electron IPC`
      );

      // Trigger storage event für andere Tabs/Components
      const currentVersion = await this.getCurrentVersion();
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "rawalite.app.version",
          newValue: currentVersion.version,
          oldValue: null,
        })
      );
    } catch (error) {
      LoggingService.log(
        `[VersionService] Failed to update stored version: ${error}`
      );
    }
  }

  /**
   * Event Listener für automatische Version-Updates
   */
  onVersionUpdate(callback: (newVersion: string) => void): () => void {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "rawalite.app.version" && event.newValue) {
        callback(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup-Funktion zurückgeben
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }
}

// Singleton-Instanz für globale Verwendung
export const versionService = new VersionService();
