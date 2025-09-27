/**
 * 🔧 Standalone Path Utilities für Scripts
 * 
 * Pfad-Helper für Scripts die außerhalb des Electron-Kontexts laufen.
 * Bietet dieselben Pfade wie paths.ts, aber ohne Electron-Dependency.
 */

import { join } from 'path';
import { userInfo } from 'os';

/**
 * Standalone-Version von getUserDataDir für Scripts ohne Electron-Kontext
 */
export function getUserDataDirStandalone(): string {
  const userData = userInfo();
  return join(
    process.env.APPDATA || 
    (process.platform === 'darwin' ? 
      join(userData.homedir, 'Library', 'Application Support') : 
      join(userData.homedir, '.config')), 
    'RawaLite'
  );
}

/**
 * Logs-Verzeichnis für Scripts
 */
export function getLogsStandalone(): string {
  return join(getUserDataDirStandalone(), 'logs');
}

/**
 * Backup-Verzeichnis für Scripts
 */
export function getBackupStandalone(): string {
  return join(getUserDataDirStandalone(), 'backups');
}

/**
 * Temp-Verzeichnis für Scripts
 */
export function getTempStandalone(): string {
  return join(getUserDataDirStandalone(), 'temp');
}

/**
 * Universal Path Helper - versucht Electron zuerst, dann Fallback
 */
export async function getUserDataDirUniversal(): Promise<string> {
  try {
    // Versuche Electron-Kontext
    const { app } = await import('electron');
    return app.getPath('userData');
  } catch (e) {
    // Fallback für Standalone-Scripts
    return getUserDataDirStandalone();
  }
}
