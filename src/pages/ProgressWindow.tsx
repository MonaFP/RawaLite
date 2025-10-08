import React, { useEffect, useState } from 'react';
import './ProgressWindow.css';

interface ProgressData {
  percentage: number;
  downloaded: number;
  total: number;
  speed: number;
  eta: number;
}

export default function ProgressWindow() {
  const [progress, setProgress] = useState<ProgressData>({
    percentage: 0,
    downloaded: 0,
    total: 0,
    speed: 0,
    eta: 0
  });
  const [status, setStatus] = useState<'downloading' | 'completed' | 'error'>('downloading');
  const [updateVersion, setUpdateVersion] = useState<string>('');

  useEffect(() => {
    // Listen for progress updates from main process via IPC
    const handleProgressUpdate = (data: ProgressData) => {
      setProgress(data);
      if (data.percentage >= 100) {
        setStatus('completed');
      }
    };

    const handleUpdateInfo = (info: { version: string }) => {
      setUpdateVersion(info.version);
    };

    const handleError = (error: string) => {
      setStatus('error');
      console.error('Download error:', error);
    };

    // Subscribe to progress updates via rawalite API
    if (window.rawalite && window.rawalite.updates) {
      // Request initial update info
      window.rawalite.updates.getUpdateInfo().then((info) => {
        if (info) {
          handleUpdateInfo({ version: info.version });
        }
      }).catch(console.error);
      
      // Set up progress listener - check every 500ms for progress updates
      const progressInterval = setInterval(async () => {
        try {
          const progressData = await window.rawalite.updates.getProgressStatus();
          if (progressData) {
            handleProgressUpdate({
              percentage: progressData.percentage,
              downloaded: progressData.downloaded,
              total: progressData.total,
              speed: progressData.speed,
              eta: progressData.eta
            });
            
            // Update status based on backend status
            if (progressData.status === 'completed') {
              setStatus('completed');
            } else if (progressData.status === 'error') {
              setStatus('error');
            } else if (progressData.status === 'downloading') {
              setStatus('downloading');
            }
          }
        } catch (error) {
          console.error('Progress check failed:', error);
        }
      }, 500); // Check every 500ms

      return () => {
        clearInterval(progressInterval);
      };
    }

    return () => {
      // Cleanup handled by interval clear
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)}MB/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="progress-window">
      <div className="progress-header">
        <h2>RawaLite Update Download</h2>
        {updateVersion && (
          <p className="update-version">Version {updateVersion}</p>
        )}
      </div>

      <div className="progress-content">
        {status === 'downloading' && (
          <>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${progress.percentage}%` }}
              />
              <div className="progress-text">
                {progress.percentage.toFixed(1)}%
              </div>
            </div>

            <div className="progress-details">
              <div className="progress-row">
                <span>Downloaded:</span>
                <span>{formatBytes(progress.downloaded)} / {formatBytes(progress.total)}</span>
              </div>
              <div className="progress-row">
                <span>Speed:</span>
                <span>{formatSpeed(progress.speed)}</span>
              </div>
              <div className="progress-row">
                <span>Time remaining:</span>
                <span>{formatTime(progress.eta)}</span>
              </div>
            </div>
          </>
        )}

        {status === 'completed' && (
          <div className="status-completed">
            <div className="success-icon">✅</div>
            <h3>Download Complete!</h3>
            <p>Update downloaded successfully</p>
          </div>
        )}

        {status === 'error' && (
          <div className="status-error">
            <div className="error-icon">❌</div>
            <h3>Download Failed</h3>
            <p>Please try again later</p>
          </div>
        )}
      </div>

      <div className="progress-footer">
        {status === 'downloading' && (
          <button 
            className="cancel-button"
            onClick={() => window.close()}
          >
            Cancel
          </button>
        )}
        {status !== 'downloading' && (
          <button 
            className="close-button"
            onClick={() => window.close()}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}