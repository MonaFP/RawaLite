/**
 * 🔄 Auto-Updater Hook
 *
 * React Hook für electron-updater Integration:
 * - Automatische Update-Prüfung beim App-Start
 * - Update-Status Management
 * - Event-basierte Kommunikation mit Main-Prozess
 */

import { useState, useEffect, useCallback, useRef } from "react";

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
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateHookState {
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  currentVersion: string;
  installInitiated: boolean; // 🔧 CRITICAL FIX: Track install state
}

export interface UpdateHookActions {
  checkForUpdates: () => Promise<void>;
  startDownload: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  dismissError: () => void;
  reset: () => void;
}

export function useAutoUpdater(
  options: {
    autoCheckOnStart?: boolean;
    checkInterval?: number; // in milliseconds
  } = {}
): [UpdateHookState, UpdateHookActions] {
  const { autoCheckOnStart = true, checkInterval } = options;

  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("");

  // 🔧 CRITICAL FIX: Track if install has been initiated to prevent "success" before actual install
  const [installInitiated, setInstallInitiated] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  // 🔧 CRITICAL FIX: Correct Electron API detection
  const isElectron = typeof window !== "undefined" && window.rawalite?.updater;

  // 🔧 CRITICAL FIX: Proper event handler for electron-updater messages
  const handleUpdateMessage = useCallback(
    (event: any, data: { type: string; data?: any }) => {
      console.log("[useAutoUpdater] Update message received:", data);

      // 🚨 CRITICAL FIX v1.8.8: Validate data structure to prevent React crash
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
        console.warn('[useAutoUpdater] Invalid update message format, ignoring:', data);
        return;
      }

      switch (data.type) {
        case "checking-for-update":
          setState("checking");
          setError(null);
          setInstallInitiated(false); // Reset install tracking
          break;

        case "update-available":
          setState("available");
          
          try {
            // 🚨 ULTRA-CRITICAL v1.8.9: Maximum defensive programming for v1.8.4 compatibility
            console.log('🔍 Raw update data received:', data);
            
            let updateData = {};
            let version = "Unbekannt";
            let releaseNotes = "";
            let releaseDate = new Date().toISOString();
            
            // STEP 1: Safely extract data object
            if (data && typeof data === 'object') {
              updateData = data.data || data || {};
            }
            
            // STEP 2: Ultra-safe version extraction with explicit any casting
            if (updateData && typeof updateData === 'object') {
              const dataAny = updateData as any; // TypeScript escape hatch for unknown structures
              
              const vRaw = dataAny?.version || dataAny?.ver;
              if (typeof vRaw === 'string' || typeof vRaw === 'number') {
                version = String(vRaw);
              }
              
              const nRaw = dataAny?.releaseNotes || dataAny?.notes || dataAny?.note;
              if (typeof nRaw === 'string') {
                releaseNotes = nRaw;
              }
              
              const dRaw = dataAny?.releaseDate || dataAny?.date;
              if (typeof dRaw === 'string') {
                releaseDate = dRaw;
              }
            }
            
            console.log('🔒 SANITIZED update info:', { version, releaseNotes: releaseNotes.substring(0, 50), releaseDate });
            
            setUpdateInfo({ version, releaseNotes, releaseDate });
            setInstallInitiated(false);
            
          } catch (error) {
            console.error('🚨 CRITICAL: Update data processing failed:', error);
            // Emergency fallback
            setUpdateInfo({
              version: "Neue Version verfügbar",
              releaseNotes: "Bitte laden Sie die neueste Version von GitHub herunter.",
              releaseDate: new Date().toISOString()
            });
            setInstallInitiated(false);
          }
          break;

        case "update-not-available":
          setState("not-available");
          setUpdateInfo(null);
          setInstallInitiated(false); // Reset install tracking
          break;

        case "download-progress":
          setState("downloading");
          setProgress(data.data);
          // Do NOT show success during download - only progress
          break;

        case "update-downloaded":
          // 🔧 CRITICAL FIX: Only set to 'downloaded', not 'success' yet
          console.log(
            "[useAutoUpdater] Update downloaded - ready for installation"
          );
          setState("downloaded");
          setProgress(null);
          setInstallInitiated(false); // Reset install tracking
          // UI should show "Ready to install" button, not "Update successful"
          break;

        case "update-error":
          setState("error");
          setError(data.data?.message || "Unbekannter Fehler beim Update");
          setInstallInitiated(false); // Reset install tracking on error
          break;
      }
    },
    []
  );

  // Setup update message listener and get current version
  useEffect(() => {
    if (!isElectron) {
      console.warn(
        "[useAutoUpdater] Not running in Electron, auto-updater disabled"
      );
      return;
    }

    // Add event listener
    window.rawalite!.updater.onUpdateMessage(handleUpdateMessage);

    // Get current version
    window
      .rawalite!.updater.getVersion()
      .then((versionInfo: any) => {
        setCurrentVersion(versionInfo.current);
        console.log("[useAutoUpdater] Current version:", versionInfo.current);
      })
      .catch((err: any) => {
        console.warn("[useAutoUpdater] Could not get version:", err);
      });

    return () => {
      if (window.rawalite?.updater) {
        window.rawalite.updater.removeUpdateMessageListener(
          handleUpdateMessage
        );
      }
    };
  }, [handleUpdateMessage, isElectron]);

  // Auto-check on start
  useEffect(() => {
    if (isElectron && autoCheckOnStart && state === "idle") {
      console.log(
        "[useAutoUpdater] Starting automatic update check on initialization"
      );
      checkForUpdates();
    }
  }, [isElectron, autoCheckOnStart, state]);

  // Periodic update checks
  useEffect(() => {
    if (!isElectron || !checkInterval) return;

    intervalRef.current = setInterval(() => {
      if (state === "idle" || state === "not-available") {
        console.log("[useAutoUpdater] Periodic update check triggered");
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
      setError("Update-Funktionalität nicht verfügbar (nicht in Electron)");
      setState("error");
      return;
    }

    try {
      console.log("[useAutoUpdater] Manual update check triggered");
      setState("checking");
      setError(null);
      setInstallInitiated(false); // Reset install tracking

      const result = await window.rawalite!.updater.checkForUpdates();
      if (!result.success) {
        console.log("[useAutoUpdater] electron-updater failed, trying GitHub API fallback");
        
        // 🔧 CRITICAL FIX: Direct GitHub API fallback when electron-updater fails
        try {
          const response = await fetch("https://api.github.com/repos/MonaFP/RawaLite/releases/latest", {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'RawaLite-App'
            }
          });
          
          if (response.ok) {
            const release = await response.json();
            const latestVersion = release.tag_name.replace(/^v/, '');
            
            // Get current version dynamically from app
            const currentVersionData = await window.rawalite!.updater.getVersion();
            const currentVersion = currentVersionData.current;
            
            if (latestVersion !== currentVersion) {
              console.log(`[useAutoUpdater] GitHub API found update: ${latestVersion}`);
              setState("available");
              setUpdateInfo({
                version: latestVersion,
                releaseNotes: release.body || `Update auf Version ${latestVersion} verfügbar`,
                releaseDate: release.published_at
              });
            } else {
              console.log("[useAutoUpdater] GitHub API: No update available");
              setState("not-available");
            }
          } else {
            throw new Error(`GitHub API returned ${response.status}`);
          }
        } catch (githubError) {
          console.error("[useAutoUpdater] GitHub API fallback also failed:", githubError);
          setError(result.error || "Update-Prüfung fehlgeschlagen");
          setState("error");
        }
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error("[useAutoUpdater] Update check failed:", err);
      setError("Update-Prüfung fehlgeschlagen");
      setState("error");
    }
  }, [isElectron]);

  const startDownload = useCallback(async () => {
    if (!isElectron) {
      setError("Update-Funktionalität nicht verfügbar (nicht in Electron)");
      setState("error");
      return;
    }

    try {
      console.log("[useAutoUpdater] Starting update download");
      setError(null);
      setInstallInitiated(false); // Reset install tracking

      const result = await window.rawalite!.updater.startDownload();
      if (!result.success) {
        setError(result.error || "Download fehlgeschlagen");
        setState("error");
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error("[useAutoUpdater] Update download failed:", err);
      setError("Download fehlgeschlagen");
      setState("error");
    }
  }, [isElectron]);

  const installAndRestart = useCallback(async () => {
    if (!isElectron) {
      setError("Update-Funktionalität nicht verfügbar (nicht in Electron)");
      setState("error");
      return;
    }

    try {
      console.log("[useAutoUpdater] Installing update and restarting");
      setError(null);

      // 🔧 CRITICAL FIX: Mark install as initiated BEFORE calling IPC
      setInstallInitiated(true);
      console.log(
        "[useAutoUpdater] Install initiated - app should quit and restart now"
      );

      const result = await window.rawalite!.updater.installAndRestart();
      if (!result.success) {
        setError(result.error || "Installation fehlgeschlagen");
        setState("error");
        setInstallInitiated(false); // Reset on error
      } else {
        console.log(
          "[useAutoUpdater] Install command sent successfully - app should be restarting"
        );
        // App wird automatisch neu gestartet - installInitiated bleibt true
      }
    } catch (err) {
      console.error("[useAutoUpdater] Update install failed:", err);
      setError("Installation fehlgeschlagen");
      setState("error");
      setInstallInitiated(false); // Reset on error
    }
  }, [isElectron]);

  const dismissError = useCallback(() => {
    setError(null);
    setState("idle");
    setInstallInitiated(false); // Reset install tracking
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setUpdateInfo(null);
    setProgress(null);
    setError(null);
    setInstallInitiated(false); // Reset install tracking
  }, []);

  const hookState: UpdateHookState = {
    state,
    updateInfo,
    progress,
    error,
    currentVersion,
    installInitiated, // 🔧 CRITICAL FIX: Include install state in hook state
  };

  const hookActions: UpdateHookActions = {
    checkForUpdates,
    startDownload,
    installAndRestart,
    dismissError,
    reset,
  };

  return [hookState, hookActions];
}

// Utility functions for formatting
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + "/s";
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export default useAutoUpdater;
