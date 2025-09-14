import { useState } from 'react';
import { useUpdateOrchestrator } from '../hooks/useUpdateOrchestrator';
import AutoUpdaterModal from '../components/AutoUpdaterModal';

export default function UpdatesPage() {
  const [updateService] = useState(() => new UpdateService());
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdaterModal, setShowUpdaterModal] = useState(false);

  // Use new auto-updater hook
  const [autoUpdaterState, autoUpdaterActions] = useAutoUpdater({
    autoCheckOnStart: false, // Manual control on this page
    checkInterval: undefined  // No automatic checks
  });

  useEffect(() => {
    updateService.setProgressCallback(setProgress);
    checkForUpdates();
  }, [updateService]);

  const checkForUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await updateService.checkForUpdates();
      setUpdateInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Prüfen auf Updates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo?.updateAvailable) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateService.performUpdate();
      // Update erfolgreich - Neustart anbieten
      if (window.confirm('Update erfolgreich installiert! Möchten Sie die Anwendung neu starten?')) {
        await updateService.restartApplication();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update fehlgeschlagen');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleElectronUpdate = () => {
    setShowUpdaterModal(true);
  };

  const getProgressColor = (stage: UpdateProgress['stage']) => {
    switch (stage) {
      case 'error': return '#ef4444';
      case 'complete': return 'var(--accent)';
      default: return '#3b82f6';
    }
  };

  const isElectron = typeof window !== 'undefined' && window.rawalite?.updater;

  return (
    <div className="page" style={{ padding: "20px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, color: "var(--accent)", fontSize: "24px", fontWeight: "600" }}>
          Updates & Changelog
        </h1>
        <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
          Neue Funktionen, Verbesserungen und Fehlerbehebungen
        </p>
      </div>

      {/* Electron Auto-Updater Section */}
      {isElectron && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "var(--accent)" }}>🔄 Automatische Updates</h3>
            <button 
              onClick={handleElectronUpdate}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--accent)",
                borderRadius: "6px",
                background: "var(--accent)",
                color: "white",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Update-Manager öffnen
            </button>
          </div>

          <div style={{ 
            background: "rgba(59, 130, 246, 0.1)", 
            border: "1px solid #3b82f6", 
            borderRadius: "8px", 
            padding: "16px" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>✨</span>
              <div>
                <h4 style={{ margin: 0, color: "#3b82f6" }}>Automatische Updates verfügbar</h4>
                <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
                  Aktuelle Version: {autoUpdaterState.currentVersion || 'Wird geladen...'}
                </p>
              </div>
            </div>
            
            <p style={{ margin: "0 0 12px 0", color: "var(--muted)", fontSize: "14px" }}>
              RawaLite kann automatisch nach Updates suchen und diese im Hintergrund herunterladen. 
              Sie werden benachrichtigt, wenn ein Update zur Installation bereit ist.
            </p>

            {autoUpdaterState.state === 'available' && (
              <div style={{
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid #22c55e",
                borderRadius: "6px",
                padding: "12px",
                marginTop: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#22c55e" }}>🎉</span>
                  <strong style={{ color: "#22c55e" }}>Update verfügbar: v{autoUpdaterState.updateInfo?.version}</strong>
                </div>
              </div>
            )}

            {autoUpdaterState.state === 'not-available' && (
              <div style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid #22c55e",
                borderRadius: "6px",
                padding: "12px",
                marginTop: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#22c55e" }}>✅</span>
                  <span style={{ color: "#22c55e" }}>Ihre App ist auf dem neuesten Stand</span>
                </div>
              </div>
            )}

            {autoUpdaterState.error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                padding: "12px",
                marginTop: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#ef4444" }}>⚠️</span>
                  <span style={{ color: "#ef4444", fontSize: "14px" }}>{autoUpdaterState.error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Update Status Card */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--accent)" }}>
            {isElectron ? '📋 Update-Status (Legacy)' : '📋 Update-Status'}
          </h3>
          <button 
            onClick={checkForUpdates}
            disabled={loading || isUpdating}
            style={{
              padding: "8px 16px",
              border: "1px solid var(--accent)",
              borderRadius: "6px",
              background: "transparent",
              color: "var(--accent)",
              cursor: loading || isUpdating ? "not-allowed" : "pointer",
              opacity: loading || isUpdating ? 0.6 : 1
            }}
          >
            {loading ? "Prüfe..." : "Aktualisieren"}
          </button>
        </div>

        {updateInfo && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Aktuelle Version:</strong> {updateInfo.currentVersion}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Verfügbare Version:</strong> {updateInfo.latestVersion}
            </div>
            
            {updateInfo.updateAvailable ? (
              <div style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ color: "#3b82f6", margin: "0 0 8px 0" }}>
                      🆕 Update verfügbar!
                    </h4>
                    <p style={{ margin: 0, color: "var(--muted)" }}>
                      Version {updateInfo.latestVersion} ist verfügbar
                    </p>
                  </div>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    style={{
                      padding: "12px 24px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      opacity: isUpdating ? 0.6 : 1,
                      fontWeight: "600"
                    }}
                  >
                    {isUpdating ? "Wird aktualisiert..." : "Jetzt aktualisieren"}
                  </button>
                </div>
                
                {updateInfo.releaseNotes && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.1)", borderRadius: "6px" }}>
                    <strong>Release Notes:</strong>
                    <pre style={{ 
                      margin: "8px 0 0 0", 
                      whiteSpace: "pre-wrap", 
                      fontSize: "14px", 
                      color: "var(--muted)" 
                    }}>
                      {updateInfo.releaseNotes}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid #22c55e",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "16px"
              }}>
                <h4 style={{ color: "#22c55e", margin: "0 0 8px 0" }}>
                  ✅ Aktuell
                </h4>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Sie verwenden die neueste Version von RawaLite
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "16px"
          }}>
            <h4 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>
              ❌ Fehler
            </h4>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Update Progress */}
        {progress && isUpdating && (
          <div style={{
            background: "rgba(0,0,0,0.05)",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "600", textTransform: "capitalize" }}>
                {progress.stage}
              </span>
              <span>{progress.progress}%</span>
            </div>
            <div style={{
              width: "100%",
              height: "8px",
              background: "rgba(0,0,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${progress.progress}%`,
                height: "100%",
                background: getProgressColor(progress.stage),
                transition: "width 0.3s ease"
              }} />
            </div>
            <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--muted)" }}>
              {progress.message}
            </div>
            {progress.error && (
              <div style={{ marginTop: "8px", fontSize: "14px", color: "#ef4444" }}>
                Fehler: {progress.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Version History */}
      <div className="card">
        <h3 style={{ margin: "0 0 16px 0", color: "var(--accent)" }}>
          Changelog
        </h3>
        
        {/* Version 1.6.0 - Auto-Updater */}
        <div style={{ 
          background: "rgba(30, 58, 46, 0.1)", 
          border: "1px solid var(--accent)", 
          borderRadius: "8px", 
          padding: "16px",
          marginBottom: "16px"
        }}>
          <h4 style={{ color: "var(--accent)", margin: "0 0 12px 0" }}>
            🚀 Version 1.6.0 - Automatische Updates
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li><strong>Neu:</strong> Vollautomatisches Update-System mit electron-updater</li>
            <li><strong>Neu:</strong> Update-Prüfung beim App-Start und im Menü</li>
            <li><strong>Neu:</strong> Download-Fortschritt und Installationsbestätigung</li>
            <li><strong>Verbessert:</strong> Deutsche UI für alle Update-Vorgänge</li>
            <li><strong>Verbessert:</strong> Robuste Fehlerbehandlung bei Updates</li>
            <li><strong>Entfernt:</strong> Manueller GitHub-Download-Workflow</li>
          </ul>
        </div>

        <div style={{ 
          background: "rgba(30, 58, 46, 0.1)", 
          border: "1px solid var(--accent)", 
          borderRadius: "8px", 
          padding: "16px"
        }}>
          <h4 style={{ color: "var(--accent)", margin: "0 0 12px 0" }}>
            🆕 Version 1.5.1 - Dashboard & Logo Fixes
          </h4>
          <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "20px" }}>
            <li>Dashboard-Routing optimiert</li>
            <li>Logo-Anzeige-Probleme behoben</li>
            <li>Verbesserte Navigation</li>
            <li>Stabilität erhöht</li>
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
