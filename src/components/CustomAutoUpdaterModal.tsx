// src/components/CustomAutoUpdaterModal.tsx - Custom In-App Updater UI
import { useState, useEffect, useRef } from 'react';
import { formatVersion, parseVersion } from '../services/semver';
import { useVersion } from '../hooks/useVersion'; // 🔧 NEW: Unified version system
import type { UpdateCheckResponse, UpdateProgress } from '../types/updater';

// Using UpdateProgress from updater types instead of local DownloadProgress

const INSTALLER_RUNNING_MESSAGE = "Der Installationsassistent wurde gestartet. Bitte schliessen Sie den Wizard ab und starten Sie RawaLite danach manuell neu.";

const safeFormatVersion = (value?: string | null) => {
  if (!value || value.trim().length === 0) {
    return '0.0.0';
  }

  const parsed = parseVersion(value);
  return parsed ? formatVersion(parsed) : value;
};

type UpdateState = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'readyToInstall'
  | 'installing'
  | 'upToDate'
  | 'error';

interface CustomAutoUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomAutoUpdaterModal({ isOpen, onClose }: CustomAutoUpdaterModalProps) {
  const [state, setState] = useState<UpdateState>('idle');
  const [updateResponse, setUpdateResponse] = useState<UpdateCheckResponse | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [restartMessage, setRestartMessage] = useState<string | null>(null);
  // 🔧 UNIFIED VERSION: Use new version hook instead of local state
  const { appVersion } = useVersion();
  
  const progressListenerRef = useRef<((progress: UpdateProgress) => void) | null>(null);

  useEffect(() => {
    // Version is now managed by useVersion hook - no manual fetching needed

    // Setup progress listener
    const handleProgress = (progress: UpdateProgress) => {
      setProgress(progress);
    };
    
    progressListenerRef.current = handleProgress;
    
    if (window.rawalite?.updater?.onProgress) {
      window.rawalite.updater.onProgress(handleProgress);
    }

    // Cleanup
    return () => {
      if (window.rawalite?.updater?.offProgress) {
        window.rawalite.updater.offProgress();
      }
    };
  }, []);

  useEffect(() => {
    if (!window.rawalite?.updater?.onRestartRequired) {
      return;
    }

    const dispose = window.rawalite.updater.onRestartRequired((data: any) => {
      setState('installing');
      setRestartMessage(
        data && typeof data.message === 'string' && data.message.trim().length > 0
          ? data.message
          : INSTALLER_RUNNING_MESSAGE
      );
    });

    return () => {
      dispose?.();
    };
  }, []);

  const checkForUpdates = async () => {
    setState('checking');
    setError(null);

    try {
      const result = await window.rawalite!.updater.check();
      
      if (result.ok && result.hasUpdate) {
        setUpdateResponse(result);
        setState('available');
      } else {
        setState('upToDate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update-Prüfung fehlgeschlagen');
      setState('error');
    }
  };

  const downloadUpdate = async () => {
    if (!updateResponse?.target?.files?.[0]) return;

    setState('downloading');
    setProgress(null);
    setError(null);

    try {
      const updateFile = updateResponse.target.files[0];
      const downloadResult = await window.rawalite!.updater.download(updateFile.url);

      if (downloadResult?.ok && downloadResult?.file) {
        setDownloadedPath(downloadResult.file);
      } else {
        throw new Error(downloadResult?.error || 'Download fehlgeschlagen');
      }
      setState('readyToInstall');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
      setState('error');
    }
  };

  const installUpdate = async () => {
    if (!downloadedPath) return;

    setState('installing');
    setRestartMessage(INSTALLER_RUNNING_MESSAGE);
    setError(null);

    try {
      await window.rawalite!.updater.install(downloadedPath);
      // Installer wurde gestartet, App wartet auf manuellen Neustart
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation fehlgeschlagen');
      setState('error');
    }
  };

  const handleManualRestart = async () => {
    try {
      await window.rawalite?.app?.restartAfterUpdate?.();
    } catch (err) {
      console.error('Manual restart failed:', err);
      setError('Neustart konnte nicht ausgelöst werden. Bitte Anwendung manuell neu starten.');
      setState('error');
    }
  };

  const retry = () => {
    setError(null);
    setProgress(null);
    setState('idle');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return formatBytes(bytesPerSec) + '/s';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="auto-updater-overlay">
      <div className="auto-updater-modal">
        {/* Header */}
        <div className="auto-updater-header">
          <h2>🔄 RawaLite Update-Manager</h2>
          <button
            onClick={onClose}
            className="auto-updater-close"
            disabled={state === 'installing'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="auto-updater-content">
          {/* Current Version */}
          <div className="auto-updater-version">
            <strong>Aktuelle Version:</strong> {safeFormatVersion(appVersion)}
          </div>

          {/* State-based content */}
          {state === 'idle' && (
            <div className="auto-updater-idle">
              <p>Prüfe auf verfügbare Updates</p>
              <button
                onClick={checkForUpdates}
                className="auto-updater-button primary"
              >
                Nach Updates suchen
              </button>
            </div>
          )}

          {state === 'checking' && (
            <div className="auto-updater-checking">
              <div className="auto-updater-spinner"></div>
              <p>Suche nach Updates...</p>
            </div>
          )}

          {state === 'upToDate' && (
            <div className="auto-updater-not-available">
              <div className="auto-updater-success-icon">✓</div>
              <h3>Keine Updates verfügbar</h3>
              <p>
                Du nutzt bereits die neueste Version ({safeFormatVersion(appVersion)})
              </p>
              <button
                onClick={onClose}
                className="auto-updater-button"
              >
                Schließen
              </button>
            </div>
          )}

          {state === 'available' && updateResponse?.target && (
            <div className="auto-updater-available">
              <div className="auto-updater-update-icon">📦</div>
              <h3>Update verfügbar: v{safeFormatVersion(updateResponse.target.version)}</h3>
              <p>
                Größe: {formatBytes(updateResponse.target.files[0]?.size || 0)}
              </p>
              {updateResponse.target.notes && (
                <div className="auto-updater-release-notes">
                  <h4>Neuerungen:</h4>
                  <div className="auto-updater-notes-content">
                    {updateResponse.target.notes}
                  </div>
                </div>
              )}
              <div className="auto-updater-actions">
                <button
                  onClick={downloadUpdate}
                  className="auto-updater-button primary"
                >
                  Update herunterladen
                </button>
                <button onClick={onClose} className="auto-updater-button">
                  Später
                </button>
              </div>
            </div>
          )}

          {state === 'downloading' && (
            <div className="auto-updater-downloading">
              <div className="auto-updater-download-icon">⬇️</div>
              <h3>Update wird heruntergeladen</h3>
              
              {progress && (
                <div className="auto-updater-progress">
                  {/* Progress Bar */}
                  <div className="auto-updater-progress-bar">
                    <div
                      className="auto-updater-progress-fill"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  
                  {/* Progress Details */}
                  <div className="auto-updater-progress-info">
                    <span>{progress.percent}%</span>
                    <span>
                      {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                    </span>
                  </div>
                  
                  {progress.speed && progress.etaSec && (
                    <div className="auto-updater-progress-details">
                      <span>Geschwindigkeit: {formatSpeed(progress.speed)}</span>
                      <span>Verbleibend: {formatTime(progress.etaSec)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {state === 'verifying' && (
            <div className="auto-updater-verifying">
              <div className="auto-updater-spinner"></div>
              <p>Prüfe Datei-Integrität...</p>
            </div>
          )}

          {state === 'readyToInstall' && (
            <div className="auto-updater-ready">
              <div className="auto-updater-success-icon">✓</div>
              <h3>Update bereit zur Installation</h3>
              <p>
                Das Update wurde erfolgreich heruntergeladen und verifiziert.
              </p>
              <p className="auto-updater-install-note">
                <strong>Hinweis:</strong> Nachdem Sie auf "Installation starten" klicken, öffnet sich der Windows-Installer.
                Lassen Sie RawaLite geöffnet, bis der Wizard abgeschlossen ist, und starten Sie die Anwendung anschließend manuell neu.
              </p>

              <div className="auto-updater-actions">
                <button
                  onClick={installUpdate}
                  className="auto-updater-button primary"
                >
                  Installation starten
                </button>
                <button
                  onClick={onClose}
                  className="auto-updater-button"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {state === 'installing' && (
            <div className="auto-updater-installing">
              <div className="auto-updater-spinner"></div>
              <h3>Installer läuft</h3>
              <p>{restartMessage ?? INSTALLER_RUNNING_MESSAGE}</p>
              <div className="auto-updater-actions">
                <button
                  onClick={handleManualRestart}
                  className="auto-updater-button primary"
                >
                  App neu starten
                </button>
                <button
                  onClick={onClose}
                  className="auto-updater-button"
                >
                  Später
                </button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="auto-updater-error">
              <div className="auto-updater-error-icon">⚠️</div>
              <h3>Fehler beim Update</h3>
              <p>{error || 'Ein unbekannter Fehler ist aufgetreten.'}</p>
              
              <div className="auto-updater-actions">
                <button
                  onClick={retry}
                  className="auto-updater-button primary"
                >
                  Erneut versuchen
                </button>
                <button
                  onClick={onClose}
                  className="auto-updater-button"
                >
                  Schließen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}