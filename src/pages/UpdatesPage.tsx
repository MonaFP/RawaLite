import { useState } from 'react';
import { useUpdateOrchestrator } from '../hooks/useUpdateOrchestrator';
import AutoUpdaterModal from '../components/AutoUpdaterModal';

export default function UpdatesPage() {
  const [showUpdaterModal, setShowUpdaterModal] = useState(false);

  // Verwende das neue einheitliche Update-System
  const [orchestratedState, orchestratedActions] = useUpdateOrchestrator();

  const {
    checkForUpdates,
    startDownload,
    prepareInstallation,
    installAndRestart,
    reset
  } = orchestratedActions;

  const {
    electronUpdate,
    migration,
    backup,
    overall
  } = orchestratedState;

  const handleElectronUpdate = () => {
    setShowUpdaterModal(true);
  };

  // Computed states
  const isChecking = electronUpdate.state === 'checking';
  const isDownloading = electronUpdate.state === 'downloading';
  const canDownload = electronUpdate.state === 'available';
  const canInstall = overall.canInstall;
  const hasError = electronUpdate.error || migration.error || backup.error;

  const getProgressColor = (phase: string) => {
    switch (phase) {
      case 'checking': return '#3498db';
      case 'available': return '#2ecc71';
      case 'preparing': return '#f39c12';
      case 'downloading': return '#9b59b6';
      case 'downloaded': return '#27ae60';
      case 'installing': return '#e74c3c';
      case 'complete': return '#2ecc71';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const isElectron = typeof window !== 'undefined' && window.rawalite?.updater;

  return (
    <div className="page" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <h2 style={{ margin: 0, color: "var(--accent)" }}>🔄 Updates</h2>
        <div style={{
          background: "var(--accent)",
          color: "white",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          ORCHESTRATOR-SYSTEM
        </div>
      </div>

      <div style={{ 
        background: "rgba(30, 58, 138, 0.1)", 
        border: "1px solid var(--accent)", 
        borderRadius: "8px", 
        padding: "16px", 
        marginBottom: "20px" 
      }}>
        <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
          ℹ️ Einheitliches Update-System
        </h4>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
          Dieses System kombiniert <strong>electron-updater</strong> (Standard) mit 
          <strong> Custom Orchestrator-Hooks</strong> für Backup & Migration. 
          Ein Transport, eine State-Machine, robuste Hooks.
        </p>
      </div>

      {/* electron-updater Section */}
      {isElectron && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "var(--accent)" }}>🔄 Update-System</h3>
            <button
              onClick={handleElectronUpdate}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--accent)",
                borderRadius: "6px",
                background: "transparent",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              📱 Update-Modal öffnen
            </button>
          </div>

          {/* Current State Display */}
          <div style={{
            background: hasError ? "rgba(231, 76, 60, 0.1)" : "rgba(46, 204, 113, 0.1)",
            border: `1px solid ${hasError ? '#e74c3c' : '#2ecc71'}`,
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: getProgressColor(electronUpdate.state)
              }}></div>
              <strong style={{ color: "var(--text)" }}>
                Status: {electronUpdate.state.charAt(0).toUpperCase() + electronUpdate.state.slice(1)}
              </strong>
            </div>
            
            <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
              Aktuelle Version: {overall.currentVersion || 'Wird geladen...'}
              {electronUpdate.updateInfo && (
                <span style={{ marginLeft: "8px", color: "#3b82f6" }}>
                  → Update auf v{electronUpdate.updateInfo.version} verfügbar
                </span>
              )}
            </div>

            {electronUpdate.progress && isDownloading && (
              <div style={{
                background: "rgba(0,0,0,0.1)",
                borderRadius: "4px",
                height: "6px",
                overflow: "hidden",
                marginBottom: "8px"
              }}>
                <div style={{
                  background: getProgressColor(electronUpdate.state),
                  width: `${electronUpdate.progress.percent}%`,
                  height: "100%",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            )}

            {hasError && (
              <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "8px" }}>
                ❌ {hasError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={checkForUpdates}
              disabled={isChecking || isDownloading}
              style={{
                padding: "10px 20px",
                background: isChecking ? "#95a5a6" : "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isChecking ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {isChecking ? "🔄 Prüfe..." : "🔍 Nach Updates suchen"}
            </button>

            {canDownload && (
              <button
                onClick={startDownload}
                disabled={isDownloading}
                style={{
                  padding: "10px 20px",
                  background: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {isDownloading ? "⬇️ Lädt..." : "⬇️ Download starten"}
              </button>
            )}

            {electronUpdate.state === 'not-available' && (
              <div style={{
                padding: "10px 16px",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid #22c55e",
                borderRadius: "6px",
                color: "#22c55e",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                ✅ App ist aktuell (v{overall.currentVersion})
              </div>
            )}

            {canInstall && (
              <button
                onClick={installAndRestart}
                style={{
                  padding: "10px 20px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                🔄 Installieren & Neustarten
              </button>
            )}

            {electronUpdate.state === 'error' && (
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  background: "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                🔄 Zurücksetzen
              </button>
            )}
          </div>

          {/* Update Info */}
          {electronUpdate.updateInfo && (
            <div style={{
              background: "rgba(52, 152, 219, 0.1)",
              border: "1px solid #3498db",
              borderRadius: "6px",
              padding: "12px",
              marginTop: "16px"
            }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#3498db" }}>
                📦 Update verfügbar
              </h4>
              <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                <strong>Version:</strong> {electronUpdate.updateInfo.version || 'Unbekannt'}<br />
                {electronUpdate.updateInfo.releaseNotes && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Release Notes:</strong>
                    <pre style={{ margin: "4px 0", fontSize: "12px", whiteSpace: "pre-wrap" }}>
                      {electronUpdate.updateInfo.releaseNotes}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Development Mode Warning */}
      {!isElectron && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, color: "#f39c12" }}>⚠️ Development Mode</h3>
          </div>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Update-Funktionalität ist nur in der Desktop-Version (Electron) verfügbar.
            In der Entwicklungsumgebung sind Updates deaktiviert.
          </p>
        </div>
      )}

      {/* Changelog Section */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--accent)" }}>📝 Changelog</h3>
        </div>

        {/* Version 1.7.1 - Update System Redesign */}
        <div style={{
          background: "rgba(30, 58, 46, 0.1)",
          border: "1px solid var(--accent)",
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "16px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--accent)" }}>
            🔄 Version 1.7.1 - Update System Redesign
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li><strong>Neu:</strong> Einheitliches Update-System mit UpdateOrchestrator</li>
            <li><strong>Neu:</strong> electron-updater + Custom Backup/Migration-Hooks</li>
            <li><strong>Fix:</strong> Release-Assets werden korrekt mit latest.yml publiziert</li>
            <li><strong>Fix:</strong> Logo-Upload BufferParameter-Fehler behoben</li>
            <li><strong>Verbessert:</strong> Eine State-Machine für alle Update-Flows</li>
          </ul>
        </div>

        {/* Version 1.7.0 - Logo System */}
        <div style={{
          background: "rgba(30, 58, 46, 0.1)",
          border: "1px solid var(--accent)",
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "16px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--accent)" }}>
            🖼️ Version 1.7.0 - Logo System Release
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li><strong>Neu:</strong> Vollständiges Logo-Upload und Management-System</li>
            <li><strong>Neu:</strong> Automatische Bildoptimierung mit Größenanpassung</li>
            <li><strong>Neu:</strong> Logo-Integration in PDF-Exports (Angebote, Rechnungen)</li>
            <li><strong>Security:</strong> File-Validation und sichere Buffer-Verarbeitung</li>
          </ul>
        </div>

        {/* Version 1.6.1 - Audit System */}
        <div style={{
          background: "rgba(30, 58, 46, 0.1)",
          border: "1px solid var(--accent)",
          borderRadius: "6px",
          padding: "16px",
          marginBottom: "16px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--accent)" }}>
            🔍 Version 1.6.1 - Universal App-Audit Implementation
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li><strong>Neu:</strong> Vollständiges Audit-System für alle Geschäftsobjekte</li>
            <li><strong>Neu:</strong> Aktivitäts-Timeline mit Benutzer-Tracking</li>
            <li><strong>Neu:</strong> Export-Funktionalität für Audit-Logs</li>
            <li><strong>Verbessert:</strong> Performance-Optimierungen bei großen Datenmengen</li>
          </ul>
        </div>
      </div>

      {/* Auto-Updater Modal */}
      <AutoUpdaterModal
        isOpen={showUpdaterModal}
        onClose={() => setShowUpdaterModal(false)}
        autoCheck={true}
      />
    </div>
  );
}