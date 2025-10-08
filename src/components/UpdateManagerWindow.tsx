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

function ProgressBar({ progress, color = '#3b82f6', height = 8 }: ProgressBarProps) {
  return (
    <div 
      className="bg-gray-200 rounded-full overflow-hidden"
      style={{ height }}
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
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Fehler aufgetreten</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                clearError();
                checkForUpdates();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
            >
              Erneut versuchen
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
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
          <div className="animate-spin text-blue-500 text-3xl mb-4">⟳</div>
          <h3 className="text-lg font-semibold mb-2">Nach Updates suchen...</h3>
          <p className="text-gray-600 text-sm">Prüfe GitHub für neue Versionen</p>
          <div className="mt-4">
            <ProgressBar progress={50} color="#3b82f6" height={4} />
          </div>
        </div>
      );
    }

    // Priority 3: Installing State
    if (isInstalling) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin text-green-500 text-3xl mb-4">⟳</div>
          <h3 className="text-lg font-semibold mb-2">Update wird installiert...</h3>
          <p className="text-gray-600 text-sm">Bitte warten Sie einen Moment</p>
          <div className="mt-4">
            <ProgressBar progress={75} color="#10b981" height={4} />
          </div>
        </div>
      );
    }

    // Priority 4: Needs Restart
    if (needsRestart) {
      return (
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">Update erfolgreich installiert!</h3>
          <p className="text-gray-600 mb-4">
            Die Anwendung muss neu gestartet werden, um das Update zu verwenden.
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={restartApp}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
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
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-semibold mb-2">Download abgeschlossen</h3>
          <p className="text-gray-600 mb-4">Das Update kann jetzt installiert werden.</p>
          <button
            onClick={installUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
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
            <h3 className="text-lg font-semibold">Update wird heruntergeladen...</h3>
          </div>
          <div className="space-y-2">
            <ProgressBar progress={downloadProgress.percentage} />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total)}</span>
              <span>{downloadProgress.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
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
            <div className="text-green-500 text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-green-600">
              Update verfügbar: Version {updateInfo.version}
            </h3>
            <p className="text-sm text-gray-600">
              Veröffentlicht am {new Date(updateInfo.publishedAt).toLocaleDateString('de-DE')}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">{updateInfo.name}</p>
                <p className="text-sm text-blue-700">
                  Größe: {formatBytes(updateInfo.fileSize)}
                </p>
              </div>
              {updateInfo.isPrerelease && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  Pre-Release
                </span>
              )}
            </div>
          </div>

          {updateInfo.releaseNotes && (
            <div className="mb-4">
              <details className="bg-gray-50 border rounded p-3">
                <summary className="cursor-pointer font-medium text-gray-700">Release Notes anzeigen</summary>
                <div className="mt-2 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {updateInfo.releaseNotes}
                </div>
              </details>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={startDownload}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Update herunterladen
            </button>
            <button
              onClick={() => setHasUpdate(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
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
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">Version ist aktuell</h3>
          <p className="text-gray-600 mb-4">
            Sie verwenden bereits die neueste Version ({currentVersion}).
          </p>
          <button
            onClick={checkForUpdates}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            🔄 Erneut prüfen
          </button>
        </div>
      );
    }

    // Default: Initial State
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Update-Manager</h3>
        <p className="text-gray-600 mb-4">
          Aktuelle Version: {currentVersion}
        </p>
        <button
          onClick={checkForUpdates}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          🔄 Nach Updates suchen
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RawaLite</h1>
                <p className="text-sm text-gray-500">Update Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Aktuelle Version: {currentVersion}
          </p>
        </div>
      </div>
    </div>
  );
}