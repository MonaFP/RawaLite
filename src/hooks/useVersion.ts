/**
 * 🎣 useVersion Hook
 * 
 * React Hook für automatische Versionsverwaltung und Update-Prüfung
 */

import { useState, useEffect, useCallback } from 'react';
import { versionService, VersionInfo, UpdateCheckResult } from '../services/VersionService';

export interface UseVersionReturn {
  version: string;
  displayVersion: string;
  versionInfo: VersionInfo | null;
  updateAvailable: boolean;
  updateInfo: UpdateCheckResult | null;
  isCheckingUpdates: boolean;
  isUpdating: boolean;
  updateProgress: number;
  updateMessage: string;
  error: string | null;
  
  // Actions
  checkForUpdates: () => Promise<void>;
  performUpdate: () => Promise<void>;
  refreshVersion: () => Promise<void>;
}

export function useVersion(): UseVersionReturn {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [displayVersion, setDisplayVersion] = useState<string>('v1.0.0');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Version laden
  const loadVersion = useCallback(async () => {
    try {
      setError(null);
      const [info, display] = await Promise.all([
        versionService.getCurrentVersion(),
        versionService.getDisplayVersion()
      ]);
      
      setVersionInfo(info);
      setDisplayVersion(display);
    } catch (err) {
      console.error('Failed to load version:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Version');
    }
  }, []);

  // Updates prüfen
  const checkForUpdates = useCallback(async () => {
    if (isCheckingUpdates) return;
    
    try {
      setIsCheckingUpdates(true);
      setError(null);
      
      const updateResult = await versionService.checkForUpdates();
      setUpdateInfo(updateResult);
      
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setError(err instanceof Error ? err.message : 'Fehler bei Update-Prüfung');
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [isCheckingUpdates]);

  // Update durchführen
  const performUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      setUpdateProgress(0);
      setUpdateMessage('Update wird gestartet...');
      
      await versionService.performUpdate((progress, message) => {
        setUpdateProgress(progress);
        setUpdateMessage(message);
      });
      
      // Version neu laden nach Update
      await loadVersion();
      
      // Update-Info zurücksetzen
      setUpdateInfo(null);
      setUpdateMessage('Update erfolgreich abgeschlossen');
      
    } catch (err) {
      console.error('Failed to perform update:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Update');
      setUpdateMessage('Update fehlgeschlagen');
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, loadVersion]);

  // Version aktualisieren
  const refreshVersion = useCallback(async () => {
    await loadVersion();
  }, [loadVersion]);

  // Initial load
  useEffect(() => {
    loadVersion();
  }, [loadVersion]);

  // Automatische Update-Prüfung alle 30 Minuten
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // 30 Minuten

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Storage-Event Listener für Version-Updates
  useEffect(() => {
    const cleanup = versionService.onVersionUpdate((newVersion) => {
      setDisplayVersion(`v${newVersion}`);
      loadVersion();
    });

    return cleanup;
  }, [loadVersion]);

  return {
    version: versionInfo?.version || '1.0.0',
    displayVersion,
    versionInfo,
    updateAvailable: updateInfo?.hasUpdate || false,
    updateInfo,
    isCheckingUpdates,
    isUpdating,
    updateProgress,
    updateMessage,
    error,
    
    checkForUpdates,
    performUpdate,
    refreshVersion
  };
}
