/**
 * 🔄 Auto-Updater Modal Component
 * 
 * Deutsche UI für automatische Updates mit electron-updater:
 * - Update-Prüfung und -Download
 * - Fortschrittsanzeige
 * - Benutzerbestätigung für Installation
 * - Fehlerbehandlung
 */

import React, { useState, useEffect, useCallback } from 'react';
import './AutoUpdaterModal.css';

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

type UpdateState = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface AutoUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheck?: boolean; // Automatische Prüfung beim Öffnen
}

export const AutoUpdaterModal: React.FC<AutoUpdaterModalProps> = ({
  isOpen,
  onClose,
  autoCheck = false
}) => {
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  // Update message handler
  const handleUpdateMessage = useCallback((event: any, data: { type: string; data?: any }) => {
    console.log('Update message received:', data);
    
    switch (data.type) {
      case 'checking-for-update':
        setUpdateState('checking');
        setError(null);
        break;
        
      case 'update-available':
        setUpdateState('available');
        setUpdateInfo({
          version: data.data?.version || 'Unbekannt',
          releaseNotes: data.data?.releaseNotes,
          releaseDate: data.data?.releaseDate
        });
        break;
        
      case 'update-not-available':
        setUpdateState('not-available');
        setUpdateInfo(null);
        break;
        
      case 'download-progress':
        setUpdateState('downloading');
        setProgress(data.data);
        break;
        
      case 'update-downloaded':
        setUpdateState('downloaded');
        setProgress(null);
        break;
        
      case 'update-error':
        setUpdateState('error');
        setError(data.data?.message || 'Unbekannter Fehler beim Update');
        break;
    }
  }, []);

  // Setup update message listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.rawalite?.updater) {
      window.rawalite.updater.onUpdateMessage(handleUpdateMessage);
      
      // Get current version
      window.rawalite.updater.getVersion().then(versionInfo => {
        setCurrentVersion(versionInfo.current);
      }).catch(err => {
        console.warn('Could not get version:', err);
      });
      
      return () => {
        if (window.rawalite?.updater) {
          window.rawalite.updater.removeUpdateMessageListener(handleUpdateMessage);
        }
      };
    }
  }, [handleUpdateMessage]);

  // Auto-check on open
  useEffect(() => {
    if (isOpen && autoCheck && updateState === 'idle') {
      handleCheckForUpdates();
    }
  }, [isOpen, autoCheck, updateState]);

  const handleCheckForUpdates = async () => {
    if (!window.rawalite?.updater) {
      setError('Update-Funktionalität nicht verfügbar');
      return;
    }

    try {
      setUpdateState('checking');
      setError(null);
      
      const result = await window.rawalite.updater.checkForUpdates();
      if (!result.success) {
        setError(result.error || 'Update-Prüfung fehlgeschlagen');
        setUpdateState('error');
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error('Update check failed:', err);
      setError('Update-Prüfung fehlgeschlagen');
      setUpdateState('error');
    }
  };

  const handleStartDownload = async () => {
    if (!window.rawalite?.updater) {
      setError('Update-Funktionalität nicht verfügbar');
      return;
    }

    try {
      setError(null);
      const result = await window.rawalite.updater.startDownload();
      if (!result.success) {
        setError(result.error || 'Download fehlgeschlagen');
        setUpdateState('error');
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error('Update download failed:', err);
      setError('Download fehlgeschlagen');
      setUpdateState('error');
    }
  };

  const handleInstallAndRestart = async () => {
    if (!window.rawalite?.updater) {
      setError('Update-Funktionalität nicht verfügbar');
      return;
    }

    try {
      setError(null);
      const result = await window.rawalite.updater.installAndRestart();
      if (!result.success) {
        setError(result.error || 'Installation fehlgeschlagen');
        setUpdateState('error');
      }
      // App wird automatisch neu gestartet
    } catch (err) {
      console.error('Update install failed:', err);
      setError('Installation fehlgeschlagen');
      setUpdateState('error');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  if (!isOpen) return null;

  return (
    <div className="auto-updater-overlay">
      <div className="auto-updater-modal">
        <div className="auto-updater-header">
          <h2>🔄 App-Updates</h2>
          <button
            className="auto-updater-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        <div className="auto-updater-content">
          {/* Current Version Display */}
          <div className="auto-updater-version">
            <strong>Aktuelle Version:</strong> {currentVersion || 'Wird geladen...'}
          </div>

          {/* Update State Content */}
          {updateState === 'idle' && (
            <div className="auto-updater-idle">
              <p>Klicken Sie auf "Nach Updates suchen", um zu prüfen, ob eine neue Version verfügbar ist.</p>
              <button
                className="auto-updater-button primary"
                onClick={handleCheckForUpdates}
              >
                Nach Updates suchen
              </button>
            </div>
          )}

          {updateState === 'checking' && (
            <div className="auto-updater-checking">
              <div className="auto-updater-spinner"></div>
              <p>Prüfe auf verfügbare Updates...</p>
            </div>
          )}

          {updateState === 'not-available' && (
            <div className="auto-updater-not-available">
              <div className="auto-updater-success-icon">✓</div>
              <h3>Keine Updates verfügbar</h3>
              <p>Sie verwenden bereits die neueste Version von RawaLite.</p>
              <button
                className="auto-updater-button"
                onClick={handleCheckForUpdates}
              >
                Erneut prüfen
              </button>
            </div>
          )}

          {updateState === 'available' && updateInfo && (
            <div className="auto-updater-available">
              <div className="auto-updater-update-icon">📦</div>
              <h3>Update verfügbar</h3>
              <div className="auto-updater-version-info">
                <p><strong>Neue Version:</strong> {updateInfo.version}</p>
                {updateInfo.releaseDate && (
                  <p><strong>Veröffentlicht:</strong> {new Date(updateInfo.releaseDate).toLocaleDateString('de-DE')}</p>
                )}
              </div>
              
              {updateInfo.releaseNotes && (
                <div className="auto-updater-release-notes">
                  <h4>Änderungen:</h4>
                  <div className="auto-updater-notes-content">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}
              
              <div className="auto-updater-actions">
                <button
                  className="auto-updater-button primary"
                  onClick={handleStartDownload}
                >
                  Update herunterladen
                </button>
                <button
                  className="auto-updater-button"
                  onClick={onClose}
                >
                  Später
                </button>
              </div>
            </div>
          )}

          {updateState === 'downloading' && progress && (
            <div className="auto-updater-downloading">
              <div className="auto-updater-download-icon">⬇️</div>
              <h3>Update wird heruntergeladen</h3>
              
              <div className="auto-updater-progress">
                <div className="auto-updater-progress-bar">
                  <div 
                    className="auto-updater-progress-fill"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <div className="auto-updater-progress-info">
                  <span>{progress.percent.toFixed(1)}%</span>
                  <span>{formatBytes(progress.transferred)} / {formatBytes(progress.total)}</span>
                  <span>{formatSpeed(progress.bytesPerSecond)}</span>
                </div>
              </div>
              
              {/* Detaillierte Status-Texte basierend auf Fortschritt */}
              <div className="auto-updater-status-details">
                {progress.percent < 10 && (
                  <p>🔄 Verbindung zu GitHub wird hergestellt...</p>
                )}
                {progress.percent >= 10 && progress.percent < 30 && (
                  <p>📥 Download wird initialisiert...</p>
                )}
                {progress.percent >= 30 && progress.percent < 50 && (
                  <p>⚙️ Grundkomponenten werden heruntergeladen...</p>
                )}
                {progress.percent >= 50 && progress.percent < 74 && (
                  <p>📦 Hauptanwendung wird übertragen...</p>
                )}
                {progress.percent >= 74 && progress.percent < 90 && (
                  <p>🔐 Checksummen werden validiert... (Bitte warten, dies kann etwas dauern)</p>
                )}
                {progress.percent >= 90 && progress.percent < 100 && (
                  <p>✅ Download wird abgeschlossen...</p>
                )}
                {progress.percent >= 100 && (
                  <p>🎉 Download erfolgreich! Installation wird vorbereitet...</p>
                )}
              </div>
              
              <p className="auto-updater-note">
                <strong>Hinweis:</strong> Bei ~74% kann es zu einer längeren Pause kommen (Checksum-Validierung).
              </p>
            </div>
          )}

          {updateState === 'downloaded' && (
            <div className="auto-updater-downloaded">
              <div className="auto-updater-success-icon">✓</div>
              <h3>Update bereit zur Installation</h3>
              <p>Das Update wurde erfolgreich heruntergeladen und ist bereit zur Installation.</p>
              <p><strong>Hinweis:</strong> Die Anwendung wird für die Installation neu gestartet.</p>
              
              <div className="auto-updater-actions">
                <button
                  className="auto-updater-button primary"
                  onClick={handleInstallAndRestart}
                >
                  Jetzt installieren und neu starten
                </button>
                <button
                  className="auto-updater-button"
                  onClick={onClose}
                >
                  Später installieren
                </button>
              </div>
            </div>
          )}

          {updateState === 'error' && (
            <div className="auto-updater-error">
              <div className="auto-updater-error-icon">⚠️</div>
              <h3>Fehler beim Update</h3>
              <p>{error || 'Ein unbekannter Fehler ist aufgetreten.'}</p>
              
              <div className="auto-updater-actions">
                <button
                  className="auto-updater-button primary"
                  onClick={handleCheckForUpdates}
                >
                  Erneut versuchen
                </button>
                <button
                  className="auto-updater-button"
                  onClick={onClose}
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
};

export default AutoUpdaterModal;