/**
 * 🗂️ RawaLite Path Management - Zentrale Pfad-Verwaltung
 * 
 * Einheitliche Pfadverwaltung für:
 * - Datenbank-Dateien (Haupt + Legacy)
 * - PDF-Generierung und Downloads
 * - Logo und Templates
 * - Backup-System mit Timestamps
 * - Logs und Cache
 * - Sicherheitsvalidierung aller Pfade
 * 
 * SICHERHEIT: Alle Pfade werden validiert und sind innerhalb userData
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Get the standardized database path for RawaLite.
 * This is the single source of truth for database location.
 * 
 * @returns Absolute path to the database file
 */
export function getDbPath(): string {
  // Use consistent path: %AppData%/Roaming/rawalite/data/rawalite.db
  return path.join(app.getPath('userData'), 'data', 'rawalite.db');
}

/**
 * Get the legacy database path where data might exist from older versions.
 * This path was used by earlier versions of RawaLite.
 * 
 * @returns Absolute path to the legacy database file
 */
export function getLegacyDbPath(): string {
  // Legacy path: %AppData%/Roaming/rawalite/Shared Dictionary/db
  return path.join(app.getPath('userData'), 'Shared Dictionary', 'db');
}

/**
 * Get backup directory path for database migration.
 * Used to store backups during migration process.
 * 
 * @returns Absolute path to backup directory
 */
export function getBackupDir(): string {
  return path.join(app.getPath('userData'), 'backup');
}

/**
 * Generate timestamped backup path for database migration.
 * 
 * @param timestamp Optional timestamp string, defaults to current time
 * @returns Absolute path to timestamped backup directory
 */
export function getTimestampedBackupDir(timestamp?: string): string {
  const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(getBackupDir(), `migration-${ts}`);
}

/**
 * Get the legacy localStorage key used by browser-based database storage.
 * This might contain data in development or browser mode.
 */
export const LEGACY_LOCALSTORAGE_KEY = 'rawalite.db';

/**
 * Validate that a path is within the app's userData directory.
 * Security measure to prevent path traversal attacks.
 * 
 * @param targetPath Path to validate
 * @returns True if path is within userData directory
 */
export function isWithinUserDataDir(targetPath: string): boolean {
  const userDataPath = app.getPath('userData');
  const normalizedTarget = path.resolve(targetPath);
  const normalizedUserData = path.resolve(userDataPath);
  
  return normalizedTarget.startsWith(normalizedUserData);
}

/**
 * Templates-Verzeichnis: APP_DATA/RawaLite/templates/
 * (Für Logo-Dateien und PDF-Templates)
 */
export function getTemplatesDir(): string {
  return path.join(app.getPath('userData'), 'templates');
}

/**
 * Downloads-Verzeichnis: System Downloads Folder
 * (Standard-Speicherort für PDF-Exporte)
 */
export function getDownloadsDir(): string {
  return app.getPath('downloads');
}

/**
 * Cache-Verzeichnis: APP_DATA/RawaLite/cache/
 * (Für temporäre Dateien und PDF-Previews)
 */
export function getCacheDir(): string {
  return path.join(app.getPath('userData'), 'cache');
}

/**
 * Logs-Verzeichnis: APP_DATA/RawaLite/logs/
 * (Für App-Logs und Diagnose-Dateien)
 */
export function getLogsDir(): string {
  return path.join(app.getPath('userData'), 'logs');
}

/**
 * Temp-Verzeichnis: System Temp + RawaLite Subfolder
 * (Für kurzlebige temporäre Dateien)
 */
export function getTempDir(): string {
  return path.join(app.getPath('temp'), 'RawaLite');
}

/**
 * Documents-Verzeichnis: System Documents Folder
 * (Fallback für PDF-Exporte wenn Downloads nicht verfügbar)
 */
export function getDocumentsDir(): string {
  return app.getPath('documents');
}

/**
 * Desktop-Verzeichnis: System Desktop Folder
 * (Alternative für PDF-Exporte)
 */
export function getDesktopDir(): string {
  return path.join(app.getPath('home'), 'Desktop');
}

/**
 * Ensure directory exists, creating it recursively if needed.
 * 
 * @param dirPath Directory path to ensure
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Vollständige Pfad-Konfiguration für alle Services
 */
export const PATHS = {
  // Database
  db: getDbPath,
  legacyDb: getLegacyDbPath,
  
  // Directories
  userData: () => app.getPath('userData'),
  backup: getBackupDir,
  timestampedBackup: getTimestampedBackupDir,
  templates: getTemplatesDir,
  downloads: getDownloadsDir,
  cache: getCacheDir,
  logs: getLogsDir,
  temp: getTempDir,
  documents: getDocumentsDir,
  desktop: getDesktopDir,
  
  // System paths
  home: () => app.getPath('home'),
  appData: () => app.getPath('appData'),
} as const;

/**
 * Legacy Database path configuration (für Backward-Kompatibilität)
 */
export const DB_PATHS = {
  current: getDbPath,
  legacy: getLegacyDbPath,
  backup: getBackupDir,
  timestampedBackup: getTimestampedBackupDir,
} as const;