import React, { useState, useEffect, useRef } from 'react';
import type { UpdateManifest, UpdateProgress } from '../types/updater';

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
          if (versionData.ok && versionData.app) {
            setCurrentVersion(versionData.app); // Use app version from package.json (Single Source)
          } else {
            setCurrentVersion(''); // Fallback if version not available
          }
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

  // ✅ Custom Update System: Progress handling via IPC events

  const handleCheckForUpdates = async () => {
    setState('checking');
    setErrorMessage('');
    
    try {
      // ✅ NEW CUSTOM UPDATER API: Use new check method
      const result = await window.rawalite?.updater?.check?.();
      
      if (result?.hasUpdate && result.target) {
        setState('available');
        setUpdateManifest(result.target);
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
    
    // Set up progress listener
    const removeProgressListener = window.rawalite?.updater?.onProgress?.((progress: UpdateProgress) => {
      setProgress(progress);
    });
    
    try {
      // Find the NSIS x64 file to download
      const nsisFile = updateManifest.files?.find(
        file => file.kind === 'nsis' && file.arch === 'x64'
      );
      
      if (!nsisFile) {
        throw new Error('Keine kompatible Installer-Datei gefunden');
      }
      
      // ✅ NEW CUSTOM UPDATER API: Download (manifest already selected)
      const downloadResult = await window.rawalite?.updater?.download?.();
      
      if (downloadResult?.ok && downloadResult?.file) {
        setDownloadedFile(downloadResult.file);
        setState('verifying');
        
        setTimeout(() => {
          setState('readyToInstall');
        }, 1500);
      } else {
        throw new Error(downloadResult?.error || 'Download fehlgeschlagen');
      }
      
    } catch (error) {
      console.error('❌ Download fehlgeschlagen:', error);
      setErrorMessage(`Fehler beim Download: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setState('error');
    } finally {
      // Clean up progress listener
      removeProgressListener?.();
    }
  };

  const handleInstallUpdate = async () => {
    if (!downloadedFile) return;
    
    setState('installing');
    
    try {
      console.log('🚀 [LAUNCHER-INSTALL] Starting UAC-resistant launcher with file:', downloadedFile);
      
      // ✅ LAUNCHER-BASED: Use new launcher-based installation API for UAC-resistance
      const result = await window.rawalite?.updater?.installCustom?.({
        filePath: downloadedFile,
        elevate: true,               // Enable UAC elevation for proper admin rights
        quitDelayMs: 1000,          // Launcher delay (not installer delay)
      });
      
      if (!result?.ok) {
        throw new Error(result?.error || 'Launcher-Start fehlgeschlagen');
      }
      
      console.log('✅ [LAUNCHER-STARTED] UAC-resistant launcher started successfully:', {
        launcherStarted: result.launcherStarted,
        exitCode: result.exitCode,
        message: result.message,
        output: result.output
      });
      
      // Show launcher success message
      setErrorMessage(''); // Clear any previous errors
      
      // Set up completion monitoring
      setTimeout(() => {
        checkInstallationResults();
      }, 2000); // Check results after 2 seconds
      
    } catch (error) {
      console.error('❌ [LAUNCHER-ERROR] Launcher-Start fehlgeschlagen:', error);
      setErrorMessage(`Fehler beim Starten des Launchers: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setState('error');
    }
  };

  const checkInstallationResults = async () => {
    try {
      const resultCheck = await window.rawalite?.updater?.checkResults?.();
      
      if (resultCheck?.ok && resultCheck.hasResults && resultCheck.results) {
        const results = resultCheck.results;
        console.log('📊 Installation results found:', results);
        
        if (results.success) {
          console.log('✅ Installation completed successfully');
          setState('idle');
          setErrorMessage('');
          
          // Show success message and restart option
          if (window.confirm('Installation erfolgreich abgeschlossen! Möchten Sie die App jetzt neu starten?')) {
            try {
              await window.rawalite?.app?.restartAfterUpdate?.();
            } catch (restartError) {
              console.error('Restart failed:', restartError);
              alert('Bitte starten Sie die App manuell neu.');
            }
          }
          
          handleCloseModal();
        } else {
          console.error('❌ Installation failed:', results.message);
          setErrorMessage(`Installation fehlgeschlagen: ${results.message}`);
          setState('error');
        }
      } else {
        // No results yet - installation might still be running
        console.log('⏳ No installation results yet - retrying in 5 seconds');
        setTimeout(() => {
          checkInstallationResults();
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error checking installation results:', error);
      // Continue checking - this might be a temporary error
      setTimeout(() => {
        checkInstallationResults();
      }, 5000);
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
    // 🔧 0MB FIX: Show "wird ermittelt..." instead of "0 MB"
    if (!bytes || bytes === 0) {
      return "wird ermittelt...";
    }
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
                <p><strong>Größe:</strong> {formatFileSize(updateManifest.files?.[0]?.size || 0)}</p>
                {updateManifest.notes && (
                  <p><strong>Hinweise:</strong> {updateManifest.notes}</p>
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
                <br />
                <strong>Interactive Installation:</strong> Der Windows-Installer wird sichtbar gestartet.
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
                disabled={!downloadedFile} // Safety: Only enable if file path is available
              >
                🚀 Interactive Installation starten
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
              <h3>Interactive Installation gestartet</h3>
              <p style={{ color: '#666' }}>
                Der <strong>sichtbare Windows-Installer</strong> wurde geöffnet. 
                <br />
                Klicken Sie durch die Installation (Next → Install → Finish).
                <br />
                Die App startet nach Abschluss <strong>automatisch neu</strong>.
              </p>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                marginTop: '16px',
                fontSize: '14px',
                color: '#666'
              }}>
                💡 <strong>Interactive System:</strong> Sie können die Installation überwachen und steuern.
              </div>
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
