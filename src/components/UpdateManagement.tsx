import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { UpdateCheckResult } from '../types/ipc';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadSize?: number;
}

interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error' | 'dev-mode';

export function UpdateManagement() {
  const { showSuccess, showError, showInfo } = useNotifications();
  
  // Update State
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Get current app version
  useEffect(() => {
    const getCurrentVersion = async () => {
      try {
        if (window.electronAPI?.updater) {
          const versionData = await window.electronAPI.updater.getVersion();
          setCurrentVersion(versionData.current);
        }
      } catch (error) {
        console.error('Failed to get current version:', error);
      }
    };

    getCurrentVersion();
  }, []);

  // Listen to update events
  useEffect(() => {
    if (!window.electronAPI?.on) return;

    const handleUpdateMessage = (event: any, data: { type: string; data?: any }) => {
      console.log('Update message received:', data);

      switch (data.type) {
        case 'checking-for-update':
          setUpdateStatus('checking');
          setErrorMessage('');
          setUpdateProgress(null);
          break;

        case 'update-available':
          setUpdateStatus('available');
          setUpdateInfo({
            version: data.data?.version || 'Unbekannt',
            releaseNotes: data.data?.releaseNotes || '',
            releaseDate: data.data?.releaseDate || ''
          });
          showInfo(`Update verfügbar: Version ${data.data?.version}`);
          break;

        case 'update-not-available':
          setUpdateStatus('idle');
          setUpdateInfo(null);
          setLastCheckTime(new Date());
          if (updateStatus === 'checking') {
            showSuccess('Ihre App ist bereits auf dem neuesten Stand');
          }
          break;

        case 'download-progress':
          setUpdateStatus('downloading');
          setUpdateProgress({
            percent: data.data?.percent || 0,
            transferred: data.data?.transferred || 0,
            total: data.data?.total || 0,
            bytesPerSecond: data.data?.bytesPerSecond || 0
          });
          break;

        case 'update-downloaded':
          setUpdateStatus('downloaded');
          setUpdateProgress(null);
          showSuccess(`Update heruntergeladen: Version ${data.data?.version}. Bereit zur Installation.`);
          break;

        case 'update-error':
          setUpdateStatus('error');
          setErrorMessage(data.data?.message || 'Unbekannter Update-Fehler');
          setUpdateProgress(null);
          showError(`Update-Fehler: ${data.data?.message || 'Unbekannter Fehler'}`);
          break;
        case 'dev-mode':
          setUpdateStatus('dev-mode');
          setErrorMessage('');
          setUpdateProgress(null);
          showInfo('Development-Modus: Update-System ist deaktiviert');
          break;
      }
    };

    window.electronAPI.on('update-message', handleUpdateMessage);

    return () => {
      if (window.electronAPI?.removeListener) {
        window.electronAPI.removeListener('update-message', handleUpdateMessage);
      }
    };
  }, [showSuccess, showError, showInfo, updateStatus]);

  // Check for updates
  const handleCheckForUpdates = async () => {
    try {
      setUpdateStatus('checking');
      setErrorMessage('');
      
      if (!window.electronAPI?.updater) {
        throw new Error('Update-System nicht verfügbar');
      }

      const result = await window.electronAPI.updater.checkForUpdates() as UpdateCheckResult;
      
      if (!result.success) {
        // Check if this is development mode (special case)
        if (result.devMode) {
          setUpdateStatus('dev-mode');
          setErrorMessage('');
          showInfo('Development-Modus: Update-System ist deaktiviert');
          return;
        }
        throw new Error(result.error || 'Update-Prüfung fehlgeschlagen');
      }

      // Status wird über Event-Handler aktualisiert
    } catch (error) {
      setUpdateStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Update-Prüfung fehlgeschlagen';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    }
  };

  // Download update
  const handleDownloadUpdate = async () => {
    try {
      if (!window.electronAPI?.updater) {
        throw new Error('Update-System nicht verfügbar');
      }

      setUpdateStatus('downloading');
      setErrorMessage('');

      const result = await window.electronAPI.updater.startDownload();
      
      if (!result.success) {
        throw new Error(result.error || 'Download fehlgeschlagen');
      }

      // Progress wird über Event-Handler aktualisiert
    } catch (error) {
      setUpdateStatus('available');
      const errorMsg = error instanceof Error ? error.message : 'Download fehlgeschlagen';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    }
  };

  // Install update
  const handleInstallUpdate = async () => {
    try {
      if (!window.electronAPI?.updater) {
        throw new Error('Update-System nicht verfügbar');
      }

      setUpdateStatus('installing');
      setErrorMessage('');

      // Show confirmation dialog
      const confirmed = confirm(
        'Die App wird jetzt geschlossen und das Update installiert. ' +
        'Alle ungespeicherten Änderungen gehen verloren.\n\n' +
        'Möchten Sie fortfahren?'
      );

      if (!confirmed) {
        setUpdateStatus('downloaded');
        return;
      }

      showInfo('Update wird installiert... Die App wird automatisch neu gestartet.');

      const result = await window.electronAPI.updater.installAndRestart();
      
      if (!result.success) {
        throw new Error(result.error || 'Installation fehlgeschlagen');
      }

      // App sollte sich jetzt schließen und neu starten
    } catch (error) {
      setUpdateStatus('downloaded');
      const errorMsg = error instanceof Error ? error.message : 'Installation fehlgeschlagen';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Current Version Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, color: '#374151' }}>Aktuelle Version</h4>
          <span style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            v{currentVersion}
          </span>
        </div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          RawaLite Professional Business Management Solution
        </p>
        {lastCheckTime && (
          <p style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
            Letzte Prüfung: {lastCheckTime.toLocaleString('de-DE')}
          </p>
        )}
      </div>

      {/* Update Check Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleCheckForUpdates}
          disabled={updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing'}
          style={{
            backgroundColor: updateStatus === 'checking' ? '#9ca3af' : 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: updateStatus === 'checking' ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {updateStatus === 'checking' ? (
            <>
              <span>⏳</span>
              Prüfe Updates...
            </>
          ) : (
            <>
              <span>🔍</span>
              Auf Updates prüfen
            </>
          )}
        </button>
      </div>

      {/* Update Available */}
      {updateStatus === 'available' && updateInfo && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <h4 style={{ margin: 0, color: '#92400e' }}>Update verfügbar</h4>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
              Version {updateInfo.version}
            </p>
            {updateInfo.releaseDate && (
              <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                Veröffentlicht: {new Date(updateInfo.releaseDate).toLocaleDateString('de-DE')}
              </p>
            )}
            {updateInfo.releaseNotes && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#374151' }}>Release Notes:</p>
                <div style={{
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {updateInfo.releaseNotes}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleDownloadUpdate}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⬇️</span>
            Update herunterladen
          </button>
        </div>
      )}

      {/* Download Progress */}
      {updateStatus === 'downloading' && updateProgress && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⬇️</span>
            <h4 style={{ margin: 0, color: '#1e40af' }}>Download läuft...</h4>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#3b82f6',
                height: '100%',
                width: `${updateProgress.percent}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
            <span>{updateProgress.percent.toFixed(1)}%</span>
            <span>
              {formatFileSize(updateProgress.transferred)} / {formatFileSize(updateProgress.total)}
              {updateProgress.bytesPerSecond > 0 && ` • ${formatSpeed(updateProgress.bytesPerSecond)}`}
            </span>
          </div>
        </div>
      )}

      {/* Update Downloaded */}
      {updateStatus === 'downloaded' && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <h4 style={{ margin: 0, color: '#047857' }}>Update bereit zur Installation</h4>
          </div>
          
          <p style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px' }}>
            Das Update wurde erfolgreich heruntergeladen und ist bereit zur Installation.
            Die App wird während der Installation automatisch neu gestartet.
          </p>
          
          <button
            onClick={handleInstallUpdate}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🚀</span>
            Jetzt installieren und neu starten
          </button>
        </div>
      )}

      {/* Installing Status */}
      {updateStatus === 'installing' && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔄</span>
            <h4 style={{ margin: 0, color: '#92400e' }}>Installation läuft...</h4>
          </div>
          
          <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
            Das Update wird installiert. Die App wird automatisch neu gestartet.
          </p>
        </div>
      )}

      {/* Error Status */}
      {updateStatus === 'error' && errorMessage && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>❌</span>
            <h4 style={{ margin: 0, color: '#dc2626' }}>Update-Fehler</h4>
          </div>
          
          <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Development Mode Status */}
      {updateStatus === 'dev-mode' && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔧</span>
            <h4 style={{ margin: 0, color: '#2563eb' }}>Development-Modus</h4>
          </div>
          
          <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>
            Update-System ist im Development-Modus deaktiviert. Automatische Updates sind nur in der produktiven Version verfügbar.
          </p>
        </div>
      )}

      {/* Help Section */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>ℹ️ Update-Informationen</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Updates werden automatisch von GitHub heruntergeladen</li>
          <li>Vor jedem Update wird automatisch ein Backup Ihrer Daten erstellt</li>
          <li>Die Installation erfordert einen Neustart der Anwendung</li>
          <li>Alle Ihre Daten bleiben während des Updates erhalten</li>
          <li>Bei Problemen können Sie zur vorherigen Version zurückkehren</li>
        </ul>
      </div>
    </div>
  );
}