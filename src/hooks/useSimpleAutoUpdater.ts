/**
 * 🔄 Simple Auto-Updater Hook für Custom Updater System
 * 
 * Vereinfachter Hook der die neue Custom Updater API nutzt
 * und kompatibel mit dem Header-Component bleibt.
 */

import { useState, useEffect, useCallback } from "react";
import type { UpdateCheckResponse, UpdateManifest, UpdateProgress } from '../types/updater';

export type SimpleUpdateState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "error";

export interface SimpleUpdateHookState {
  state: SimpleUpdateState;
  error: string | null;
  updateInfo: UpdateManifest | null;
  progress: UpdateProgress | null;
  installInitiated: boolean;
}

export interface SimpleUpdateActions {
  checkForUpdates: () => Promise<void>;
  startDownload: () => Promise<void>;
  installAndRestart: () => Promise<void>;
}

interface SimpleAutoUpdaterOptions {
  autoCheckOnStart?: boolean;
}

export function useSimpleAutoUpdater(options: SimpleAutoUpdaterOptions = {}): [SimpleUpdateHookState, SimpleUpdateActions] {
  const [state, setState] = useState<SimpleUpdateState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateManifest | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [installInitiated, setInstallInitiated] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

  // Setup progress listener
  useEffect(() => {
    if (!window.rawalite?.updater) return;

    const handleProgress = (progressData: UpdateProgress) => {
      setProgress(progressData);
    };

    const cleanup = window.rawalite.updater.onProgress(handleProgress);

    return () => {
      cleanup();
    };
  }, []);

  // Auto-check on start
  useEffect(() => {
    if (options.autoCheckOnStart && window.rawalite?.updater) {
      checkForUpdates();
    }
  }, [options.autoCheckOnStart]);

  const checkForUpdates = useCallback(async () => {
    if (!window.rawalite?.updater) {
      setError('Updater nicht verfügbar');
      setState('error');
      return;
    }

    setState('checking');
    setError(null);

    try {
      const result = await window.rawalite.updater.check();
      
      if (result.ok && result.hasUpdate && result.target) {
        setUpdateInfo(result.target);
        setState('available');
      } else {
        setState('not-available');
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setError(err instanceof Error ? err.message : 'Update-Prüfung fehlgeschlagen');
      setState('error');
    }
  }, []);

  const startDownload = useCallback(async () => {
    if (!updateInfo?.files?.[0] || !window.rawalite?.updater) {
      setError('Kein Update verfügbar oder Updater nicht bereit');
      setState('error');
      return;
    }

    setState('downloading');
    setProgress(null);
    setError(null);

    try {
      const updateFile = updateInfo.files[0];
      const filePath = await window.rawalite.updater.download(updateFile.url);
      
      setDownloadedPath(filePath);
      setState('downloaded');
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
      setState('error');
    }
  }, [updateInfo]);

  const installAndRestart = useCallback(async () => {
    if (!downloadedPath || !window.rawalite?.updater) {
      setError('Kein heruntergeladenes Update oder Updater nicht bereit');
      setState('error');
      return;
    }

    setState('installing');
    setInstallInitiated(true);
    setError(null);

    try {
      await window.rawalite.updater.install(downloadedPath);
      // App should quit and installer should start
    } catch (err) {
      console.error('Install failed:', err);
      setError(err instanceof Error ? err.message : 'Installation fehlgeschlagen');
      setState('error');
      setInstallInitiated(false);
    }
  }, [downloadedPath]);

  const hookState: SimpleUpdateHookState = {
    state,
    error,
    updateInfo,
    progress,
    installInitiated
  };

  const actions: SimpleUpdateActions = {
    checkForUpdates,
    startDownload,
    installAndRestart
  };

  return [hookState, actions];
}

export default useSimpleAutoUpdater;