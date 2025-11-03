/**
 * BackupBrowser Component für RawaLite
 * 
 * Backup-Verwaltung und Datei-Browser für Rollback-Operationen.
 * Features:
 * - Liste aller verfügbaren Backups mit Metadaten
 * - Validierung von Backup-Integrität
 * - Dateigrößen und Zeitstempel
 * - Markierung automatischer vs. manueller Backups
 * - Cleanup-Verwaltung (alte Backups löschen)
 * 
 * Status: Production Ready (Phase 2 Step 4)
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { BackupListResult, BackupMetadata, BackupValidationResult, BackupCleanupResult } from '../services/RollbackService';
import { RollbackService } from '../services/RollbackService';
import { LoggingService } from '../services/LoggingService';
import { useNotifications } from '../contexts/NotificationContext';

export interface BackupBrowserProps {
  /**
   * Callback when a backup is selected
   */
  onSelectBackup: (backupPath: string) => void;

  /**
   * Currently selected backup path
   */
  selectedBackupPath?: string | null;

  /**
   * Optional custom backup directory
   */
  backupDirectory?: string;

  /**
   * Optional CSS class
   */
  className?: string;
}

export interface BackupBrowserState {
  backups: BackupMetadata[];
  isLoading: boolean;
  error: string | null;
  validatingPath: string | null;
  validationResults: Map<string, BackupValidationResult>;
  showCleanupConfirm: boolean;
  cleanupInProgress: boolean;
}

/**
 * BackupBrowser Component - Browse and Manage Backups
 * 
 * Provides:
 * 1. List of available backups with metadata
 * 2. Backup validation (integrity check)
 * 3. File selection for rollback
 * 4. Cleanup management (delete old backups)
 * 5. Size formatting and timestamps
 */
export default function BackupBrowser({
  onSelectBackup,
  selectedBackupPath = null,
  backupDirectory,
  className = '',
}: BackupBrowserProps) {
  // Logging Setup
  const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
    console.log(`[BackupBrowser] ${msg}`);
    LoggingService.log(`BackupBrowser: ${msg}`, level).catch(() => {});
  };

  // State Management
  const [state, setState] = useState<BackupBrowserState>({
    backups: [],
    isLoading: true,
    error: null,
    validatingPath: null,
    validationResults: new Map(),
    showCleanupConfirm: false,
    cleanupInProgress: false,
  });

  const { showError, showSuccess } = useNotifications();

  // Singleton Service Instance
  const rollbackService = RollbackService.getInstance();

  /**
   * Load List of Backups
   */
  const loadBackups = useCallback(async () => {
    try {
      log('Loading backup list...');
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await rollbackService.listBackups(backupDirectory);
      log(`Loaded ${result.count} backups (${result.totalSizeFormatted})`);

      setState((prev) => ({
        ...prev,
        backups: result.backups,
        isLoading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`Failed to load backups: ${errorMsg}`, 'error');
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      showError(`Failed to load backups: ${errorMsg}`);
    }
  }, [rollbackService, backupDirectory, showError]);

  /**
   * Validate Single Backup File
   */
  const handleValidateBackup = useCallback(
    async (backupPath: string) => {
      try {
        log(`Validating backup: ${backupPath}`);
        setState((prev) => ({ ...prev, validatingPath: backupPath }));

        const result = await rollbackService.validateBackup(backupPath);

        setState((prev) => {
          const newMap = new Map(prev.validationResults);
          newMap.set(backupPath, result);
          return {
            ...prev,
            validatingPath: null,
            validationResults: newMap,
          };
        });

        if (result.valid) {
          log(`Backup valid: ${result.filename} (${result.sizeFormatted})`);
          showSuccess(`✅ Backup is valid: ${result.filename}`);
        } else {
          log(`Backup invalid: ${result.error}`, 'warn');
          showError(`❌ Backup is invalid: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        log(`Validation failed: ${errorMsg}`, 'error');
        setState((prev) => ({ ...prev, validatingPath: null }));
        showError(`Validation failed: ${errorMsg}`);
      }
    },
    [rollbackService, showError, showSuccess]
  );

  /**
   * Cleanup Old Backups
   */
  const handleCleanupBackups = useCallback(async () => {
    try {
      log('Starting cleanup of old backups...');
      setState((prev) => ({ ...prev, cleanupInProgress: true }));

      const result = await rollbackService.cleanupBackups(backupDirectory, 10);

      if (result.deletedCount > 0) {
        log(`Deleted ${result.deletedCount} old backup(s), freed ${result.freedSpaceFormatted}`);
        showSuccess(`✅ Cleaned up ${result.deletedCount} backups, freed ${result.freedSpaceFormatted}`);

        // Reload backup list
        await loadBackups();
      } else {
        log('No backups needed cleanup');
        showSuccess('No old backups to clean up');
      }

      setState((prev) => ({
        ...prev,
        showCleanupConfirm: false,
        cleanupInProgress: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`Cleanup failed: ${errorMsg}`, 'error');
      setState((prev) => ({
        ...prev,
        cleanupInProgress: false,
      }));
      showError(`Cleanup failed: ${errorMsg}`);
    }
  }, [rollbackService, backupDirectory, loadBackups, showError, showSuccess]);

  /**
   * Load backups on mount
   */
  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Render: Error State
  if (state.error && state.backups.length === 0) {
    return (
      <div className={`bg-white rounded-lg ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">⚠️ Error Loading Backups</h3>
          <p className="text-red-700 text-sm mb-4">{state.error}</p>
          <button
            onClick={loadBackups}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render: Empty State
  if (state.backups.length === 0 && !state.isLoading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="text-4xl mb-3">📁</div>
        <h3 className="text-gray-700 font-semibold mb-2">No Backups Found</h3>
        <p className="text-gray-600 text-sm">
          No backup files are available. Create a backup first before performing a rollback.
        </p>
        <button
          onClick={loadBackups}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Refresh & Cleanup */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">
            📁 Available Backups ({state.backups.length})
          </h3>
          <p className="text-sm text-gray-600">
            Select a backup to restore your database to a previous state
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBackups}
            disabled={state.isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, showCleanupConfirm: true }))}
            disabled={state.backups.length === 0 || state.cleanupInProgress}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium text-sm"
          >
            🗑️ Cleanup
          </button>
        </div>
      </div>

      {/* Loading State */}
      {state.isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin text-blue-600 text-3xl">⟳</div>
        </div>
      )}

      {/* Cleanup Confirmation Modal */}
      {state.showCleanupConfirm && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800 font-semibold mb-3">
            ⚠️ Cleanup old backups? Keep 10 most recent.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCleanupBackups}
              disabled={state.cleanupInProgress}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
            >
              {state.cleanupInProgress ? 'Cleaning...' : 'Confirm Cleanup'}
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, showCleanupConfirm: false }))}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backups List */}
      {!state.isLoading && state.backups.length > 0 && (
        <div className="space-y-2">
          {state.backups.map((backup) => {
            const validation = state.validationResults.get(backup.path);
            const isSelected = selectedBackupPath === backup.path;

            return (
              <div
                key={backup.path}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left Side: Backup Info */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectBackup(backup.path)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => onSelectBackup(backup.path)}
                        className="w-4 h-4"
                      />
                      <h4 className="font-semibold text-gray-800">{backup.filename}</h4>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {formatTimestamp(backup.created)}</p>
                      <p>📦 {backup.sizeFormatted}</p>
                      <p className="text-xs text-gray-500">📍 {backup.path}</p>
                    </div>
                  </div>

                  {/* Right Side: Validate Button */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleValidateBackup(backup.path)}
                      disabled={state.validatingPath === backup.path}
                      className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400 text-gray-700 py-1 px-3 rounded text-sm font-medium whitespace-nowrap"
                    >
                      {state.validatingPath === backup.path ? 'Validating...' : 'Validate'}
                    </button>

                    {/* Validation Result */}
                    {validation && (
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded text-center ${
                          validation.valid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {validation.valid ? '✅ Valid' : '❌ Invalid'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Error Message */}
                {validation && !validation.valid && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {validation.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
        💡 Tip: Validate backups before selecting them to ensure integrity
      </div>
    </div>
  );
}
