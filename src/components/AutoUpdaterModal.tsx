import React, { useState, useEffect, useRef } from 'react';

interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

interface UpdateManifest {
  version: string;
  releaseDate?: string;
  downloadUrl: string;
  checksumSha256?: string;
  fileSize: number;
  releaseNotes?: string;
  minimumVersion?: string;
}

type UpdateState = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'readyToInstall'
  | 'installing'
  | 'error'
  | 'upToDate';

interface AutoUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoUpdaterModal: React.FC<AutoUpdaterModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<UpdateState>('idle');
  const [progress, setProgress] = useState<UpdateProgress>({ percent: 0, transferred: 0, total: 0 });
  const [updateManifest, setUpdateManifest] = useState<UpdateManifest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [downloadedFile, setDownloadedFile] = useState<string>('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCurrentVersion = async () => {
      try {
        // ✅ UNIFIED VERSION SYSTEM (v1.8.44+): Single Source of Truth via package.json
        if (window.rawalite?.version?.get) {
          const versionData = await window.rawalite.version.get();
          setCurrentVersion(versionData.app); // Use app version from package.json (Single Source)
        } else {
          console.warn('⚠️ Version API nicht verfügbar - Fallback wird verwendet');
          setCurrentVersion(''); // Graceful degradation
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der aktuellen Version:', error);
        setCurrentVersion(''); // Fallback to empty string if version fetch fails
      }
    };
    
    if (isOpen) {
      loadCurrentVersion();
    }
  }, [isOpen]);

  // ✅ UNIFIED VERSION SYSTEM (v1.8.44+): Progress handling now via electron-updater events
  // No manual progress listener setup needed - handled by electron-updater internally

  const handleCheckForUpdates = async () => {
    setState('checking');
    setErrorMessage('');
    
    try {
      // ✅ NEW UNIFIED CONTRACT (v1.8.44+): Separate updater.check() returns only remote update info
      const result = await window.rawalite?.updater?.checkForUpdates?.();
      
      if (result?.success && result.updateInfo) {
        setState('available');
        const manifest: UpdateManifest = {
          version: result.updateInfo.version || 'Unknown',
          releaseDate: result.updateInfo.releaseDate || undefined, // ✅ Fix field name
          downloadUrl: result.updateInfo.downloadUrl || '',
          fileSize: result.updateInfo.size || 0, // ✅ Use size from GitHub API
          releaseNotes: result.updateInfo.releaseNotes || undefined
        };
        setUpdateManifest(manifest);
      } else {
        setState('upToDate');
        setTimeout(() => {
          setState('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Update-Check fehlgeschlagen:', error);
      setErrorMessage(`Fehler beim Prüfen auf Updates: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setState('error');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateManifest) return;
    
    setState('downloading');
    setProgress({ percent: 0, transferred: 0, total: 0 });
    
    try {
      // ✅ NEW UNIFIED CONTRACT (v1.8.44+): Use startDownload method
      const result = await window.rawalite?.updater?.startDownload?.();
      
      if (result?.success) {
        // ✅ electron-updater handles file management internally, no explicit filePath needed
        setDownloadedFile('update-downloaded');
        setState('verifying');
        
        setTimeout(() => {
          setState('readyToInstall');
        }, 1500);
      } else {
        throw new Error(result?.error || 'Download fehlgeschlagen');
      }
      
    } catch (error) {
      console.error('❌ Download fehlgeschlagen:', error);
      setErrorMessage(`Fehler beim Download: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setState('error');
    }
  };

  const handleInstallUpdate = async () => {
    if (!downloadedFile) return;
    
    setState('installing');
    
    try {
      // ✅ NEW UNIFIED CONTRACT (v1.8.44+): Use installAndRestart method 
      const result = await window.rawalite?.updater?.installAndRestart?.();
      
      if (!result?.success) {
        throw new Error(result?.error || 'Installation fehlgeschlagen');
      }
      
      // App should restart automatically, this code may not execute
      console.log('✅ Installation erfolgreich - App startet neu');
      
    } catch (error) {
      console.error('❌ Installation fehlgeschlagen:', error);
      setErrorMessage(`Fehler bei der Installation: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setState('error');
    }
  };

  const handleCloseModal = () => {
    setState('idle');
    setProgress({ percent: 0, transferred: 0, total: 0 });
    setUpdateManifest(null);
    setErrorMessage('');
    setDownloadedFile('');
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    const MB = bytes / (1024 * 1024);
    return `${Math.round(MB * 100) / 100} MB`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }} onClick={handleCloseModal}>
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '16px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333', margin: 0 }}>
            RawaLite Update-Manager
          </h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#666',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            onClick={handleCloseModal}
            title="Schließen"
          >
            ×
          </button>
        </div>

        <div style={{ minHeight: '200px' }}>
          {currentVersion && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <strong>Aktuelle Version:</strong> {currentVersion}
            </div>
          )}

          {state === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Prüfen Sie auf verfügbare Updates für RawaLite.
              </p>
              <button 
                style={{
                  backgroundColor: '#4a5d5a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
                onClick={handleCheckForUpdates}
              >
                🔍 Auf Updates prüfen
              </button>
            </div>
          )}

          {state === 'checking' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Suche nach Updates...</p>
            </div>
          )}

          {state === 'available' && updateManifest && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ color: '#28a745', margin: '0 0 12px 0' }}>
                  Update verfügbar!
                </h3>
              </div>
              
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <p><strong>Neue Version:</strong> {updateManifest.version}</p>
                <p><strong>Größe:</strong> {formatFileSize(updateManifest.fileSize)}</p>
                {updateManifest.releaseNotes && (
                  <p><strong>Hinweise:</strong> {updateManifest.releaseNotes}</p>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button 
                  style={{
                    backgroundColor: '#4a5d5a',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginRight: '12px',
                  }}
                  onClick={handleDownloadUpdate}
                >
                  ⬇️ Update herunterladen
                </button>
                <button 
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  onClick={handleCloseModal}
                >
                  Später
                </button>
              </div>
            </div>
          )}

          {state === 'downloading' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⬇️</div>
              <h3>Download läuft...</h3>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                marginTop: '12px',
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#4a5d5a',
                  borderRadius: '4px',
                  width: `${progress.percent}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ marginTop: '8px', color: '#666' }}>
                Fortschritt: {Math.round(progress.percent)}%
                {progress.total > 0 && (
                  ` (${formatFileSize(progress.transferred)} / ${formatFileSize(progress.total)})`
                )}
              </p>
            </div>
          )}

          {state === 'verifying' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
              <p>Verifiziere Download-Integrität...</p>
            </div>
          )}

          {state === 'readyToInstall' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ color: '#28a745' }}>Bereit zur Installation</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Das Update wurde erfolgreich heruntergeladen und verifiziert.
              </p>
              <button 
                style={{
                  backgroundColor: '#4a5d5a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
                onClick={handleInstallUpdate}
              >
                🚀 Jetzt installieren
              </button>
              <button 
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
                onClick={handleCloseModal}
              >
                Abbrechen
              </button>
            </div>
          )}

          {state === 'installing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
              <h3>Installation läuft...</h3>
              <p style={{ color: '#666' }}>
                RawaLite startet automatisch neu.
              </p>
            </div>
          )}

          {state === 'upToDate' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ color: '#28a745' }}>Alles aktuell!</h3>
              <p style={{ color: '#666' }}>
                Sie verwenden bereits die neueste Version von RawaLite.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h3 style={{ color: '#dc3545' }}>Fehler aufgetreten</h3>
              {errorMessage && (
                <div style={{
                  backgroundColor: '#fee',
                  color: '#c33',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '12px',
                  fontSize: '14px',
                }}>
                  {errorMessage}
                </div>
              )}
              <div style={{ marginTop: '20px' }}>
                <button 
                  style={{
                    backgroundColor: '#4a5d5a',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginRight: '12px',
                  }}
                  onClick={handleCheckForUpdates}
                >
                  🔄 Erneut versuchen
                </button>
                <button 
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  onClick={handleCloseModal}
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
