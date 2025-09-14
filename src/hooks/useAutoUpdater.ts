/**
 * 🔄 Auto-Updater Hook
 * 
 * React Hook für electron-updater Integration:
 * - Automatische Update-Prüfung beim App-Start
 * - Update-Status Management
 * - Event-basierte Kommunikation mit Main-Prozess
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export type UpdateState = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateHookState {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  currentVersion: string;
}

export interface UpdateHookActions {
  checkForUpdates: () => Promise<void>;
  startDownload: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  dismissError: () => void;
  reset: () => void;
}

export function useAutoUpdater(options: {
  autoCheckOnStart?: boolean;
  checkInterval?: number; // in milliseconds
} = {}): [UpdateHookState, UpdateHookActions] {
  const { autoCheckOnStart = true, checkInterval } = options;
  
  const [state, setState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const isElectron = typeof window !== 'undefined' && window.rawalite?.updater;

  // Update message handler
  const handleUpdateMessage = useCallback((event: any, data: { type: string; data?: any }) => {
    console.log('[useAutoUpdater] Update message received:', data);
    
    switch (data.type) {
      case 'checking-for-update':
        setState('checking');
        setError(null);
        break;
        
      case 'update-available':
        setState('available');
        setUpdateInfo({
          version: data.data?.version || 'Unbekannt',
          releaseNotes: data.data?.releaseNotes,
          releaseDate: data.data?.releaseDate
        });
        break;
        
      case 'update-not-available':
        setState('not-available');
        setUpdateInfo(null);
        break;
        
      case 'download-progress':
        setState('downloading');
        setProgress(data.data);
        break;
        
      case 'update-downloaded':
        setState('downloaded');
        setProgress(null);
        break;
        
      case 'update-error':
        setState('error');
        setError(data.data?.message || 'Unbekannter Fehler beim Update');
        break;
    }
  }, []);

  // Setup update message listener and get current version
  useEffect(() => {
    if (!isElectron) {
      console.warn('[useAutoUpdater] Not running in Electron, auto-updater disabled');
      return;
    }

    // Add event listener
    window.rawalite!.updater.onUpdateMessage(handleUpdateMessage);
    
    // Get current version
    window.rawalite!.updater.getVersion()
      .then((versionInfo: any) => {
        setCurrentVersion(versionInfo.current);
        console.log('[useAutoUpdater] Current version:', versionInfo.current);
      })
      .catch((err: any) => {
        console.warn('[useAutoUpdater] Could not get version:', err);
      });
    
    return () => {
      if (window.rawalite?.updater) {
        window.rawalite.updater.removeUpdateMessageListener(handleUpdateMessage);
      }
    };
  }, [handleUpdateMessage, isElectron]);

  // Auto-check on start
  useEffect(() => {
    if (isElectron && autoCheckOnStart && state === 'idle') {
      console.log('[useAutoUpdater] Starting automatic update check on initialization');
      checkForUpdates();
    }
  }, [isElectron, autoCheckOnStart, state]);

  // Periodic update checks
  useEffect(() => {
    if (!isElectron || !checkInterval) return;

    intervalRef.current = setInterval(() => {
      if (state === 'idle' || state === 'not-available') {
        console.log('[useAutoUpdater] Periodic update check triggered');
        checkForUpdates();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isElectron, checkInterval, state]);

  // Actions
  const checkForUpdates = useCallback(async () => {
    if (!isElectron) {
      setError('Update-Funktionalität nicht verfügbar (nicht in Electron)');
      setState('error');
      return;
    }

    try {
      console.log('[useAutoUpdater] Manual update check triggered');
      setState('checking');
      setError(null);
      
      const result = await window.rawalite!.updater.checkForUpdates();
      if (!result.success) {
        setError(result.error || 'Update-Prüfung fehlgeschlagen');
        setState('error');
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error('[useAutoUpdater] Update check failed:', err);
      setError('Update-Prüfung fehlgeschlagen');
      setState('error');
    }
  }, [isElectron]);

  const startDownload = useCallback(async () => {
    if (!isElectron) {
      setError('Update-Funktionalität nicht verfügbar (nicht in Electron)');
      setState('error');
      return;
    }

    try {
      console.log('[useAutoUpdater] Starting update download');
      setError(null);
      
      const result = await window.rawalite!.updater.startDownload();
      if (!result.success) {
        setError(result.error || 'Download fehlgeschlagen');
        setState('error');
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error('[useAutoUpdater] Update download failed:', err);
      setError('Download fehlgeschlagen');
      setState('error');
    }
  }, [isElectron]);

  const installAndRestart = useCallback(async () => {
    if (!isElectron) {
      setError('Update-Funktionalität nicht verfügbar (nicht in Electron)');
      setState('error');
      return;
    }

    try {
      console.log('[useAutoUpdater] Installing update and restarting');
      setError(null);
      
      const result = await window.rawalite!.updater.installAndRestart();
      if (!result.success) {
        setError(result.error || 'Installation fehlgeschlagen');
        setState('error');
      }
      // App wird automatisch neu gestartet
    } catch (err) {
      console.error('[useAutoUpdater] Update install failed:', err);
      setError('Installation fehlgeschlagen');
      setState('error');
    }
  }, [isElectron]);

  const dismissError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setUpdateInfo(null);
    setProgress(null);
    setError(null);
  }, []);

  const hookState: UpdateHookState = {
    state,
    updateInfo,
    progress,
    error,
    currentVersion
  };

  const hookActions: UpdateHookActions = {
    checkForUpdates,
    startDownload,
    installAndRestart,
    dismissError,
    reset
  };

  return [hookState, hookActions];
}

// Utility functions for formatting
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s';
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default useAutoUpdater;