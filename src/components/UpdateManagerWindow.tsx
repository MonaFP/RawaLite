/**
 * UpdateManagerWindow Component für RawaLite
 * 
 * Separates Update-Manager-Fenster für bessere UX.
 * Ersetzt das alte Dialog-System mit einem dedizierten Fenster.
 * 
 * Basiert auf der alten Update-Manager-Architektur.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { UpdateInfo, DownloadProgress } from '../types/update.types';
import { debugLogger, logClick, logApiCall, logApiResponse, logStateChange, logError } from '../services/DebugLogger';

interface UpdateManagerWindowProps {
  autoCheckOnMount?: boolean;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format seconds to human readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

function ProgressBar({ progress, color = 'var(--accent, var(--sidebar-green))', height = 8 }: ProgressBarProps) {
  return (
    <div 
      className="rounded-full overflow-hidden"
      style={{ 
        height,
        background: 'rgba(0,0,0,0.1)'
      }}
    >
      <div
        className="transition-all duration-300 ease-out rounded-full h-full"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color
        }}
      />
    </div>
  );
}

/**
 * Main UpdateManagerWindow Component
 */
export function UpdateManagerWindow({ autoCheckOnMount = true }: UpdateManagerWindowProps) {
  // State management
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('1.0.20');
  const [latestVersion, setLatestVersion] = useState<string | undefined>();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: 1000,
    percentage: 0,
    speed: 0,
    eta: 0
  });
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [needsRestart, setNeedsRestart] = useState(false);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheckOnMount && window.rawalite?.updates) {
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoCheckOnMount]);

  // Progress polling for downloads
  useEffect(() => {
    if (!isDownloading || !window.rawalite?.updates) return;

    const pollProgress = async () => {
      try {
        // @ts-ignore - TypeScript types sind nicht aktuell, aber API existiert in preload.ts
        const progressStatus = await window.rawalite.updates.getProgressStatus();
        if (progressStatus && progressStatus.status === 'downloading') {
          console.log('UpdateManagerWindow: Progress update:', progressStatus);
          setDownloadProgress({
            downloaded: progressStatus.downloaded,
            total: progressStatus.total, 
            percentage: progressStatus.percentage,
            speed: progressStatus.speed,
            eta: progressStatus.eta
          });
        } else if (progressStatus && progressStatus.status === 'completed') {
          console.log('UpdateManagerWindow: Download completed via progress poll');
          setIsDownloading(false);
        }
      } catch (err) {
        console.error('UpdateManagerWindow: Failed to get progress status:', err);
      }
    };

    // Poll progress every 500ms during downloads
    const progressInterval = setInterval(pollProgress, 500);
    
    // Initial poll
    pollProgress();

    return () => {
      clearInterval(progressInterval);
    };
  }, [isDownloading]);

  // Update functions using window.rawalite.updates API
  const checkForUpdates = async () => {
    logClick('UpdateManagerWindow', 'checkForUpdates', { trigger: 'user_action' });
    
    if (!window.rawalite?.updates) {
      const errorMsg = 'Update API nicht verfügbar';
      logError('UpdateManagerWindow', 'checkForUpdates', errorMsg, { apiAvailable: false });
      setError(errorMsg);
      return;
    }
    
    setIsChecking(true);
    setError(null);
    setHasUpdate(false);
    
    try {
      logApiCall('UpdateManagerWindow', 'checkForUpdates');
      const result = await window.rawalite.updates.checkForUpdates();
      logApiResponse('UpdateManagerWindow', 'checkForUpdates', result);
      
      if (result.hasUpdate && result.latestVersion) {
        setHasUpdate(true);
        setLatestVersion(result.latestVersion);
        
        // Use latestRelease data for updateInfo
        if (result.latestRelease) {
          const updateInfoData = {
            version: result.latestVersion,
            name: result.latestRelease.name || `RawaLite v${result.latestVersion}`,
            releaseNotes: result.latestRelease.body || '',
            publishedAt: result.latestRelease.published_at || new Date().toISOString(),
            downloadUrl: result.latestRelease.assets?.[0]?.browser_download_url || '',
            assetName: result.latestRelease.assets?.[0]?.name || 'RawaLite.Setup.exe',
            fileSize: result.latestRelease.assets?.[0]?.size || 0,
            isPrerelease: result.latestRelease.prerelease || false
          };
          setUpdateInfo(updateInfoData);
        }
      } else {
        setHasUpdate(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update-Prüfung fehlgeschlagen';
      logError('UpdateManagerWindow', 'checkForUpdates', err as Error, { step: 'api_call' });
      setError(errorMsg);
    } finally {
      setIsChecking(false);
    }
  };

  const startDownload = async () => {
    if (!window.rawalite?.updates || !updateInfo) {
      setError('Download nicht möglich');
      return;
    }
    
    setIsDownloading(true);
    setError(null);
    
    try {
      const filePath = await window.rawalite.updates.startDownload(updateInfo);
      
      if (typeof filePath === 'string') {
        setDownloadedFilePath(filePath);
      }
      setIsDownloading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Download fehlgeschlagen';
      setError(errorMsg);
      setIsDownloading(false);
    }
  };

  const installUpdate = async () => {
    if (!window.rawalite?.updates || !downloadedFilePath) {
      setError('Installation nicht möglich - Keine Datei heruntergeladen');
      return;
    }
    
    setIsInstalling(true);
    
    try {
      await window.rawalite.updates.installUpdate(downloadedFilePath);
      setNeedsRestart(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Installation fehlgeschlagen';
      setError(errorMsg);
      setIsInstalling(false);
    }
  };

  const restartApp = async () => {
    if (window.rawalite?.updates) {
      try {
        await window.rawalite.updates.restartApp();
      } catch (err) {
        logError('UpdateManagerWindow', 'restartApp', err as Error);
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Get current version on mount
  useEffect(() => {
    if (window.rawalite?.updates) {
      console.log('UpdateManagerWindow: Loading current version...');
      window.rawalite.updates.getCurrentVersion().then(version => {
        console.log('UpdateManagerWindow: Version loaded successfully:', version);
        setCurrentVersion(version);
      }).catch(err => {
        console.error('UpdateManagerWindow: Failed to get current version:', err);
        console.log('UpdateManagerWindow: Using fallback version 1.0.20');
      });
    } else {
      console.warn('UpdateManagerWindow: window.rawalite.updates not available');
    }
  }, []);

  // Render helpers
  const renderContent = () => {
    // Priority 1: Error State
    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4" style={{ color: 'var(--danger, #ef4444)' }}>⚠</div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--danger, #ef4444)' }}
          >
            Fehler aufgetreten
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            {error}
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                clearError();
                checkForUpdates();
              }}
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                background: 'var(--danger, #ef4444)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              Erneut versuchen
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 rounded-lg"
              style={{
                color: 'var(--text-secondary, #374151)',
                border: '1px solid rgba(0,0,0,.2)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-primary, #1e293b)';
                (e.target as HTMLElement).style.borderColor = 'var(--accent, var(--sidebar-green))';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary, #374151)';
                (e.target as HTMLElement).style.borderColor = 'rgba(0,0,0,.2)';
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      );
    }

    // Priority 2: Checking State
    if (isChecking) {
      return (
        <div className="text-center py-8">
          <div 
            className="animate-spin text-3xl mb-4"
            style={{ color: 'var(--accent, var(--sidebar-green))' }}
          >
            ⟳
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--text-primary, #1e293b)' }}
          >
            Nach Updates suchen...
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            Prüfe GitHub für neue Versionen
          </p>
          <div className="mt-4">
            <ProgressBar progress={50} color="var(--accent, var(--sidebar-green))" height={4} />
          </div>
        </div>
      );
    }

    // Priority 3: Installing State
    if (isInstalling) {
      return (
        <div className="text-center py-8">
          <div 
            className="animate-spin text-3xl mb-4"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            ⟳
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--text-primary, #1e293b)' }}
          >
            Update wird installiert...
          </h3>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            Bitte warten Sie einen Moment
          </p>
          <div className="mt-4">
            <ProgressBar progress={75} color="var(--ok, #22c55e)" height={4} />
          </div>
        </div>
      );
    }

    // Priority 4: Needs Restart
    if (needsRestart) {
      return (
        <div className="text-center py-8">
          <div 
            className="text-4xl mb-4"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            ✓
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            Update erfolgreich installiert!
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            Die Anwendung muss neu gestartet werden, um das Update zu verwenden.
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={restartApp}
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                background: 'var(--ok, #22c55e)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              Jetzt neu starten
            </button>
          </div>
        </div>
      );
    }

    // Priority 5: Download Completed
    if (downloadedFilePath && !isDownloading) {
      return (
        <div className="text-center py-8">
          <div 
            className="text-4xl mb-4"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            ✓
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--text-primary, #1e293b)' }}
          >
            Download abgeschlossen
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            Das Update kann jetzt installiert werden.
          </p>
          <button
            onClick={installUpdate}
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              background: 'var(--ok, #22c55e)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
          >
            Update installieren
          </button>
        </div>
      );
    }

    // Priority 6: Downloading State
    if (isDownloading) {
      return (
        <div className="py-8">
          <div className="flex justify-between items-center mb-4">
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary, #1e293b)' }}
            >
              Update wird heruntergeladen...
            </h3>
          </div>
          <div className="space-y-2">
            <ProgressBar 
              progress={downloadProgress.percentage} 
              color="var(--accent, var(--sidebar-green))" 
            />
            <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary, #374151)' }}>
              <span>{formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total)}</span>
              <span>{downloadProgress.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary, #374151)', opacity: 0.8 }}>
              <span>Geschwindigkeit: {formatBytes(downloadProgress.speed)}/s</span>
              <span>Verbleibend: {formatTime(downloadProgress.eta)}</span>
            </div>
          </div>
        </div>
      );
    }

    // Priority 7: Update Available
    if (hasUpdate && updateInfo) {
      return (
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'var(--ok, #22c55e)' }}
            >
              Update verfügbar: Version {updateInfo.version}
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary, #374151)' }}
            >
              Veröffentlicht am {new Date(updateInfo.publishedAt).toLocaleDateString('de-DE')}
            </p>
          </div>

          <div 
            className="border rounded-lg p-4 mb-4"
            style={{ 
              background: 'rgba(var(--accent-rgb, 30, 58, 46), 0.1)',
              borderColor: 'var(--accent, var(--sidebar-green))'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="font-medium"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  {updateInfo.name}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary, #374151)' }}
                >
                  Größe: {formatBytes(updateInfo.fileSize)}
                </p>
              </div>
              {updateInfo.isPrerelease && (
                <span 
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: 'var(--warn, #f59e0b)',
                    color: 'white'
                  }}
                >
                  Pre-Release
                </span>
              )}
            </div>
          </div>

          {updateInfo.releaseNotes && (
            <div className="mb-4">
              <details 
                className="border rounded p-3"
                style={{ 
                  background: 'rgba(0,0,0,0.02)',
                  borderColor: 'rgba(0,0,0,.12)'
                }}
              >
                <summary 
                  className="cursor-pointer font-medium"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  Release Notes anzeigen
                </summary>
                <div 
                  className="mt-2 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto"
                  style={{ color: 'var(--text-secondary, #374151)' }}
                >
                  {updateInfo.releaseNotes}
                </div>
              </details>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={startDownload}
              className="flex-1 px-4 py-2 rounded-lg font-medium"
              style={{
                background: 'var(--accent, var(--sidebar-green))',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              Update herunterladen
            </button>
            <button
              onClick={() => setHasUpdate(false)}
              className="px-4 py-2 rounded-lg"
              style={{
                color: 'var(--text-secondary, #374151)',
                border: '1px solid rgba(0,0,0,.2)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-primary, #1e293b)';
                (e.target as HTMLElement).style.borderColor = 'var(--accent, var(--sidebar-green))';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = 'var(--text-secondary, #374151)';
                (e.target as HTMLElement).style.borderColor = 'rgba(0,0,0,.2)';
              }}
            >
              Überspringen
            </button>
          </div>
        </div>
      );
    }

    // Priority 8: No Update Available
    if (!hasUpdate && !isChecking) {
      return (
        <div className="text-center py-8">
          <div 
            className="text-4xl mb-4"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            ✓
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--ok, #22c55e)' }}
          >
            Version ist aktuell
          </h3>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary, #374151)' }}
          >
            Sie verwenden bereits die neueste Version ({currentVersion}).
          </p>
          <button
            onClick={checkForUpdates}
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              background: 'var(--accent, var(--sidebar-green))',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
          >
            🔄 Erneut prüfen
          </button>
        </div>
      );
    }

    // Default: Initial State
    return (
      <div className="text-center py-8">
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary, #1e293b)' }}
        >
          Update-Manager
        </h3>
        <p 
          className="mb-4"
          style={{ color: 'var(--text-secondary, #374151)' }}
        >
          Aktuelle Version: {currentVersion}
        </p>
        <button
          onClick={checkForUpdates}
          className="px-4 py-2 rounded-lg font-medium"
          style={{
            background: 'var(--accent, var(--sidebar-green))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '1'}
        >
          🔄 Nach Updates suchen
        </button>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen p-6" 
      style={{ 
        background: 'var(--main-bg, linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%))',
        color: 'var(--text-primary, #1e293b)'
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div 
          className="rounded-lg shadow-sm p-6 mb-6"
          style={{ 
            background: 'var(--card-bg, rgba(255,255,255,0.98))',
            boxShadow: '0 10px 30px rgba(0,0,0,.15), 0 1px 8px rgba(0,0,0,.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,.12)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mr-3 overflow-hidden"
                style={{ 
                  background: 'var(--accent, var(--sidebar-green))',
                  color: 'white'
                }}
              >
                <img 
                  src="/rawalite-logo.png" 
                  alt="RawaLite Logo" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    // Fallback zum Lightning-Symbol wenn Logo nicht lädt
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.textContent = '⚡';
                  }}
                />
                <span className="text-xl" style={{ display: 'none' }}>⚡</span>
              </div>
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary, #1e293b)' }}
                >
                  RawaLite
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary, #374151)' }}
                >
                  Update Manager
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="rounded-lg shadow-sm p-6"
          style={{ 
            background: 'var(--card-bg, rgba(255,255,255,0.98))',
            boxShadow: '0 10px 30px rgba(0,0,0,.15), 0 1px 8px rgba(0,0,0,.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,.12)',
            color: 'var(--text-primary, #1e293b)'
          }}
        >
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p 
            className="text-xs"
            style={{ color: 'var(--text-secondary, #374151)', opacity: 0.7 }}
          >
            Aktuelle Version: {currentVersion}
          </p>
        </div>
      </div>
    </div>
  );
}