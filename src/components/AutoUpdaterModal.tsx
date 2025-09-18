/**
 * 🔄 Auto-Updater Modal Component
 *
 * Deutsche UI für automatische Updates mit electron-updater:
 * - Update-Prüfung und -Download
 * - Fortschrittsanzeige
 * - Benutzerbestätigung für Installation
 * - Fehlerbehandlung
 */

import React, { useState, useEffect, useCallback } from "react";
import "./AutoUpdaterModal.css";

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
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

interface AutoUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheck?: boolean; // Automatische Prüfung beim Öffnen
}

export const AutoUpdaterModal: React.FC<AutoUpdaterModalProps> = ({
  isOpen,
  onClose,
  autoCheck = false,
}) => {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>("");

  // 🔧 CRITICAL FIX: Track installation state to prevent premature success messages
  const [installInitiated, setInstallInitiated] = useState<boolean>(false);

  // Update message handler
  const handleUpdateMessage = useCallback(
    (event: any, data: { type: string; data?: any }) => {
      console.log("Update message received:", data);

      // 🚨 CRITICAL FIX v1.8.8: Validate data structure to prevent React crash
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
        console.warn('[AutoUpdaterModal] Invalid update message format, ignoring:', data);
        return;
      }

      switch (data.type) {
        case "checking-for-update":
          setUpdateState("checking");
          setError(null);
          setInstallInitiated(false); // Reset installation tracking
          break;

        case "update-available":
          setUpdateState("available");
          
          try {
            // 🚨 ULTRA-CRITICAL v1.8.9: Maximum defensive programming for v1.8.4 compatibility
            console.log('🔍 [Modal] Raw update data received:', data);
            
            let updateData: any = {};
            let version = "Unbekannt";
            let releaseNotes = "";
            let releaseDate = new Date().toISOString();
            
            // STEP 1: Safely extract data object
            if (data && typeof data === 'object') {
              updateData = data.data || data || {};
            }
            
            // STEP 2: Ultra-safe property extraction
            if (updateData && typeof updateData === 'object') {
              const dataAny = updateData as any;
              
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
            
            console.log('🔒 [Modal] SANITIZED update info:', { version, releaseNotes: releaseNotes.substring(0, 50), releaseDate });
            
            setUpdateInfo({ version, releaseNotes, releaseDate });
            setInstallInitiated(false);
            
          } catch (error) {
            console.error('🚨 [Modal] CRITICAL: Update data processing failed:', error);
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
          setUpdateState("not-available");
          setUpdateInfo(null);
          setInstallInitiated(false); // Reset installation tracking
          break;

        case "download-progress":
          setUpdateState("downloading");
          setProgress(data.data);
          // Do NOT set installInitiated during download
          break;

        case "update-downloaded":
          // 🔧 CRITICAL FIX: Update is downloaded but not yet installed
          console.log(
            "Update downloaded successfully - ready for installation"
          );
          setUpdateState("downloaded"); // This should show "Ready to install" UI
          setProgress(null);
          setInstallInitiated(false); // Reset installation tracking
          // Do NOT show "Update successful" until after app restart
          break;

        case "update-error":
          setUpdateState("error");
          setError(data.data?.message || "Unbekannter Fehler beim Update");
          setInstallInitiated(false); // Reset on error
          break;
      }
    },
    []
  );

  // 🔧 CRITICAL FIX: Check if running in Electron environment
  const isElectron = typeof window !== "undefined" && window.rawalite?.updater;

  // Setup update message listener and get current version
  useEffect(() => {
    if (!isElectron) {
      console.warn(
        "[AutoUpdaterModal] Not running in Electron, auto-updater disabled"
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
        console.log("[AutoUpdaterModal] Current version:", versionInfo.current);
      })
      .catch((err: any) => {
        console.warn("[AutoUpdaterModal] Could not get version:", err);
      });

    return () => {
      if (window.rawalite?.updater) {
        window.rawalite.updater.removeUpdateMessageListener(
          handleUpdateMessage
        );
      }
    };
  }, [handleUpdateMessage, isElectron]);

  // Auto-check on open
  useEffect(() => {
    if (isOpen && autoCheck && updateState === "idle") {
      handleCheckForUpdates();
    }
  }, [isOpen, autoCheck, updateState]);

  const handleCheckForUpdates = async () => {
    if (!window.rawalite?.updater) {
      setError("Update-Funktionalität nicht verfügbar");
      return;
    }

    try {
      setUpdateState("checking");
      setError(null);
      setInstallInitiated(false); // Reset installation tracking

      const result = await window.rawalite.updater.checkForUpdates();
      if (!result.success) {
        setError(result.error || "Update-Prüfung fehlgeschlagen");
        setUpdateState("error");
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error("Update check failed:", err);
      setError("Update-Prüfung fehlgeschlagen");
      setUpdateState("error");
    }
  };

  const handleStartDownload = async () => {
    if (!window.rawalite?.updater) {
      setError("Update-Funktionalität nicht verfügbar");
      return;
    }

    try {
      setError(null);
      setInstallInitiated(false); // Reset installation tracking
      const result = await window.rawalite.updater.startDownload();
      if (!result.success) {
        setError(result.error || "Download fehlgeschlagen");
        setUpdateState("error");
      }
      // State wird durch Event-Handler gesetzt
    } catch (err) {
      console.error("Update download failed:", err);
      setError("Download fehlgeschlagen");
      setUpdateState("error");
    }
  };

  const handleInstallAndRestart = async () => {
    if (!window.rawalite?.updater) {
      setError("Update-Funktionalität nicht verfügbar");
      return;
    }

    try {
      setError(null);

      // 🔧 CRITICAL FIX: Mark installation as initiated
      setInstallInitiated(true);
      console.log("Installation initiated - app should quit and restart");

      const result = await window.rawalite.updater.installAndRestart();
      if (!result.success) {
        setError(result.error || "Installation fehlgeschlagen");
        setUpdateState("error");
        setInstallInitiated(false); // Reset on error
      } else {
        console.log("Install command successful - waiting for app restart");
        // installInitiated bleibt true bis App neu startet
      }
    } catch (err) {
      console.error("Update install failed:", err);
      setError("Installation fehlgeschlagen");
      setUpdateState("error");
      setInstallInitiated(false); // Reset on error
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + "/s";
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
            <strong>Aktuelle Version:</strong>{" "}
            {currentVersion || "Wird geladen..."}
          </div>

          {/* Update State Content */}
          {updateState === "idle" && (
            <div className="auto-updater-idle">
              <p>
                Klicken Sie auf "Nach Updates suchen", um zu prüfen, ob eine
                neue Version verfügbar ist.
              </p>
              <button
                className="auto-updater-button primary"
                onClick={handleCheckForUpdates}
              >
                Nach Updates suchen
              </button>
            </div>
          )}

          {updateState === "checking" && (
            <div className="auto-updater-checking">
              <div className="auto-updater-spinner"></div>
              <p>Prüfe auf verfügbare Updates...</p>
            </div>
          )}

          {updateState === "not-available" && (
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

          {updateState === "available" && updateInfo && (
            <div className="auto-updater-available">
              <div className="auto-updater-update-icon">📦</div>
              <h3>Update verfügbar</h3>
              <div className="auto-updater-version-info">
                <p>
                  <strong>Neue Version:</strong> {updateInfo.version}
                </p>
                {updateInfo.releaseDate && (
                  <p>
                    <strong>Veröffentlicht:</strong>{" "}
                    {new Date(updateInfo.releaseDate).toLocaleDateString(
                      "de-DE"
                    )}
                  </p>
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
                <button className="auto-updater-button" onClick={onClose}>
                  Später
                </button>
              </div>
            </div>
          )}

          {updateState === "downloading" && progress && (
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
                  <span>
                    {formatBytes(progress.transferred)} /{" "}
                    {formatBytes(progress.total)}
                  </span>
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
                  <p>
                    🔐 Checksummen werden validiert... (Bitte warten, dies kann
                    etwas dauern)
                  </p>
                )}
                {progress.percent >= 90 && progress.percent < 100 && (
                  <p>✅ Download wird abgeschlossen...</p>
                )}
                {progress.percent >= 100 && (
                  <p>
                    🎉 Download erfolgreich! Installation wird vorbereitet...
                  </p>
                )}
              </div>

              <p className="auto-updater-note">
                <strong>Hinweis:</strong> Bei ~74% kann es zu einer längeren
                Pause kommen (Checksum-Validierung).
              </p>
            </div>
          )}

          {updateState === "downloaded" && (
            <div className="auto-updater-downloaded">
              {!installInitiated ? (
                // 🔧 CRITICAL FIX: Show "Ready to install" BEFORE install button click
                <>
                  <div className="auto-updater-download-icon">📦</div>
                  <h3>Update bereit zur Installation</h3>
                  <p>
                    Das Update wurde erfolgreich heruntergeladen und ist bereit
                    zur Installation.
                  </p>
                  <p>
                    <strong>Hinweis:</strong> Die Anwendung wird für die
                    Installation neu gestartet.
                  </p>

                  <div className="auto-updater-actions">
                    <button
                      className="auto-updater-button primary"
                      onClick={handleInstallAndRestart}
                    >
                      Jetzt installieren und neu starten
                    </button>
                    <button className="auto-updater-button" onClick={onClose}>
                      Später installieren
                    </button>
                  </div>
                </>
              ) : (
                // 🔧 CRITICAL FIX: Show different UI AFTER install button clicked
                <>
                  <div className="auto-updater-spinner"></div>
                  <h3>Update wird installiert...</h3>
                  <p>Die Anwendung wird neu gestartet. Bitte warten...</p>
                  <div className="auto-updater-install-progress">
                    <p>🚀 Installer wird gestartet...</p>
                    <p>⏳ App wird automatisch neu gestartet</p>
                    <p>✨ Nach dem Neustart ist die neue Version verfügbar</p>
                  </div>
                </>
              )}
            </div>
          )}

          {updateState === "error" && (
            <div className="auto-updater-error">
              <div className="auto-updater-error-icon">⚠️</div>
              <h3>Fehler beim Update</h3>
              <p>{error || "Ein unbekannter Fehler ist aufgetreten."}</p>

              <div className="auto-updater-actions">
                <button
                  className="auto-updater-button primary"
                  onClick={handleCheckForUpdates}
                >
                  Erneut versuchen
                </button>
                <button className="auto-updater-button" onClick={onClose}>
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
