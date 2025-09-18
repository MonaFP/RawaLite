import React from 'react';
import { useMigration } from '../hooks/useMigration';
import { useVersion } from '../hooks/useVersion';
import './MigrationManager.css';

interface MigrationManagerProps {
  onClose?: () => void;
}

export const MigrationManager: React.FC<MigrationManagerProps> = ({ onClose }) => {
  const {
    isChecking,
    needsMigration,
    isUpdating,
    progress,
    error,
    backups,
    checkMigrationNeeded,
    runMigration,
    runUpdate,
    createBackup,
    cleanupBackups
  } = useMigration();

  const {
    displayVersion,
    versionInfo,
    updateAvailable,
    updateInfo,
    isCheckingUpdates,
    isUpdating: isVersionUpdating,
    updateProgress,
    updateMessage,
    error: versionError,
    checkForUpdates,
    performUpdate: performVersionUpdate
  } = useVersion();

  if (isChecking) {
    return (
      <div className="migration-manager">
        <div className="migration-status checking">
          <h3>Migrationsstatus wird geprüft...</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-manager">
      <div className="migration-header">
        <h2>🔧 Database Migration Manager</h2>
        {onClose && (
          <button onClick={onClose} className="close-btn">✕</button>
        )}
      </div>

      {(error || versionError) && (
        <div className="error-message">
          <strong>Fehler:</strong> {error || versionError}
          <button onClick={checkMigrationNeeded} className="retry-btn">
            Erneut versuchen
          </button>
        </div>
      )}

      {(progress || (isVersionUpdating && updateProgress > 0)) && (
        <div className="migration-progress">
          <h4>{updateMessage || progress?.message}</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${updateProgress || progress?.progress || 0}%` }}
            ></div>
          </div>
          <small>
            {isVersionUpdating 
              ? `Version Update - ${updateProgress}%` 
              : `Stage: ${progress?.stage} - ${progress?.progress}%`
            }
          </small>
        </div>
      )}

      <div className="migration-sections">
        {/* App Version Status */}
        <section className="version-status">
          <h3>App-Version</h3>
          <div className="version-info">
            <div className="current-version">
              <span className="version-label">Aktuelle Version:</span>
              <span className="version-number">{displayVersion}</span>
              {versionInfo?.isDevelopment && (
                <span className="dev-badge">DEV</span>
              )}
            </div>
            
            {updateAvailable ? (
              <div className="update-available">
                <p>🔔 Update verfügbar: {updateInfo?.latestVersion}</p>
                <p className="update-notes">{updateInfo?.updateNotes}</p>
                <button 
                  onClick={performVersionUpdate} 
                  disabled={isVersionUpdating || isUpdating}
                  className="update-btn primary"
                >
                  {isVersionUpdating ? 'Update wird installiert...' : 'Update installieren'}
                </button>
              </div>
            ) : (
              <div className="up-to-date">
                <p>✅ App ist auf dem neuesten Stand</p>
                <button 
                  onClick={checkForUpdates} 
                  disabled={isCheckingUpdates}
                  className="check-btn secondary"
                >
                  {isCheckingUpdates ? 'Prüfe...' : 'Nach Updates suchen'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Migration Status */}
        <section className="migration-status">
          <h3>Migrationsstatus</h3>
          {needsMigration ? (
            <div className="status-warning">
              <p>⚠️ Datenbank-Migration erforderlich</p>
              <button 
                onClick={runMigration} 
                disabled={isUpdating || isVersionUpdating}
                className="migrate-btn primary"
              >
                {isUpdating ? 'Migration läuft...' : 'Migration ausführen'}
              </button>
            </div>
          ) : (
            <div className="status-good">
              <p>✅ Datenbank ist auf dem neuesten Stand</p>
            </div>
          )}
        </section>

        {/* Combined Update Management */}
        <section className="update-management">
          <h3>Komplettes System-Update</h3>
          <p className="update-description">
            Führt App-Update und Datenbank-Migration in einem Zug durch.
          </p>
          <div className="update-actions">
            <button 
              onClick={runUpdate} 
              disabled={isUpdating || isVersionUpdating}
              className="update-btn primary"
            >
              {(isUpdating || isVersionUpdating) ? 'System-Update läuft...' : 'Vollständiges System-Update'}
            </button>
          </div>
        </section>

        {/* Backup Management */}
        <section className="backup-management">
          <h3>Backup-Verwaltung</h3>
          
          <div className="backup-actions">
            <button 
              onClick={() => createBackup('Manuelles Backup')} 
              disabled={isUpdating}
              className="backup-btn secondary"
            >
              Manuelles Backup erstellen
            </button>
            
            <button 
              onClick={() => cleanupBackups(3)} 
              disabled={isUpdating}
              className="cleanup-btn secondary"
            >
              Alte Backups löschen (3 behalten)
            </button>
          </div>

          {backups.length > 0 && (
            <div className="backup-list">
              <h4>Verfügbare Backups ({backups.length})</h4>
              <div className="backup-items">
                {backups.map((backup) => (
                  <div key={backup.id} className="backup-item">
                    <div className="backup-info">
                      <div className="backup-name">
                        {backup.description}
                      </div>
                      <div className="backup-meta">
                        Version {backup.version} • {backup.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
