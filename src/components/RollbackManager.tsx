/**
 * RollbackManager Component für RawaLite
 * 
 * Hauptoberfläche für Datenbank-Rollback und Wiederherstellungsoperationen.
 * Integriert:
 * - RollbackService (Frontend IPC Wrapper)
 * - BackupBrowser (Backup-Verwaltung)
 * - RecoveryWorkflow (Geführter Wiederherstellungsprozess)
 * 
 * Status: Production Ready (Phase 2 Step 4)
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { MigrationStatus, BackupListResult, RollbackResult } from '../services/RollbackService';
import { RollbackService } from '../services/RollbackService';
import { LoggingService } from '../services/LoggingService';
import { useNotifications } from '../contexts/NotificationContext';

export interface RollbackManagerProps {
  /**
   * Callback when rollback is completed successfully
   */
  onRollbackComplete?: (result: RollbackResult) => void;

  /**
   * Callback when manager is closed or cancelled
   */
  onClose?: () => void;

  /**
   * Optional CSS class for styling
   */
  className?: string;
}

export interface RollbackManagerState {
  migrationStatus: MigrationStatus | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'status' | 'browser' | 'workflow';
  selectedBackupPath: string | null;
}

/**
 * RollbackManager - Main UI Component for Rollback Operations
 * 
 * Provides:
 * 1. Migration Status Display (current/target versions)
 * 2. Backup Browser (file selection and management)
 * 3. Recovery Workflow (guided step-by-step process)
 * 4. Error Handling and Logging
 */
export default function RollbackManager({
  onRollbackComplete,
  onClose,
  className = '',
}: RollbackManagerProps) {
  // Logging Setup
  const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
    console.log(`[RollbackManager] ${msg}`);
    LoggingService.log(`RollbackManager: ${msg}`, level).catch(() => {});
  };

  // State Management
  const [state, setState] = useState<RollbackManagerState>({
    migrationStatus: null,
    isLoading: true,
    error: null,
    activeTab: 'status',
    selectedBackupPath: null,
  });

  const { showError, showSuccess } = useNotifications();

  // Singleton Service Instance
  const rollbackService = RollbackService.getInstance();

  /**
   * Load Initial Migration Status
   */
  const loadMigrationStatus = useCallback(async () => {
    try {
      log('Loading migration status...');
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const status = await rollbackService.getMigrationStatus();
      log(`Status loaded: v${status.currentVersion} (target: v${status.targetVersion}, pending: ${status.pendingCount})`);

      setState((prev) => ({
        ...prev,
        migrationStatus: status,
        isLoading: false,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`Failed to load status: ${errorMsg}`, 'error');
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      showError(`Migration status error: ${errorMsg}`);
    }
  }, [rollbackService, showError]);

  /**
   * Refresh Migration Status (manual refresh button)
   */
  const handleRefreshStatus = useCallback(async () => {
    await loadMigrationStatus();
    showSuccess('Migration status refreshed');
  }, [loadMigrationStatus, showSuccess]);

  /**
   * Handle Backup Selection from BackupBrowser
   */
  const handleBackupSelected = useCallback((backupPath: string) => {
    log(`Backup selected: ${backupPath}`);
    setState((prev) => ({
      ...prev,
      selectedBackupPath: backupPath,
      activeTab: 'workflow',
    }));
  }, []);

  /**
   * Handle Successful Rollback
   */
  const handleRollbackSuccess = useCallback(
    (result: RollbackResult) => {
      log(`Rollback completed: v${result.previousVersion} → v${result.newVersion}`, 'info');
      showSuccess(`✅ Database rolled back to v${result.newVersion}`);

      // Reload migration status
      loadMigrationStatus();

      // Call parent callback if provided
      if (onRollbackComplete) {
        onRollbackComplete(result);
      }

      // Reset selected backup
      setState((prev) => ({
        ...prev,
        selectedBackupPath: null,
        activeTab: 'status',
      }));
    },
    [loadMigrationStatus, onRollbackComplete, showSuccess]
  );

  /**
   * Handle Rollback Cancellation
   */
  const handleCancel = useCallback(() => {
    log('Rollback cancelled');
    setState((prev) => ({
      ...prev,
      selectedBackupPath: null,
      activeTab: 'status',
    }));
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * Load status on mount
   */
  useEffect(() => {
    loadMigrationStatus();
  }, [loadMigrationStatus]);

  // Render: Status Tab
  const renderStatusTab = () => {
    if (!state.migrationStatus) {
      return <div className="text-center py-8 text-gray-500">Loading status...</div>;
    }

    const { currentVersion, targetVersion, pendingCount } = state.migrationStatus;
    const canRollback = pendingCount > 0 || currentVersion > targetVersion;

    return (
      <div className="space-y-4">
        {/* Version Display */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Current Version:</span>
            <span className="text-lg font-bold text-blue-600">v{currentVersion}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Target Version:</span>
            <span className="text-lg font-bold text-green-600">v{targetVersion}</span>
          </div>

          <div className="border-t pt-3 mt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Pending Migrations:</span>
            <span className={`text-lg font-bold ${pendingCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {pendingCount}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {canRollback ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-700">
              ⚠️ Rollback available. Your database can be rolled back to a previous version.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ Your database is up to date. No rollback needed.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={handleRefreshStatus}
          disabled={state.isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          {state.isLoading ? 'Refreshing...' : 'Refresh Status'}
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    );
  };

  // Render: Backup Browser Tab
  const renderBrowserTab = () => {
    // Dynamisches Import mit Fallback
    const [BackupBrowserComponent, setBackupBrowserComponent] = React.useState<any>(null);
    
    React.useEffect(() => {
      import('./BackupBrowser').then(module => {
        setBackupBrowserComponent(() => module.default);
      }).catch(() => {
        console.error('Failed to load BackupBrowser');
      });
    }, []);

    if (!BackupBrowserComponent) {
      return <div className="text-center py-8 text-gray-500">Loading BackupBrowser...</div>;
    }

    return (
      <BackupBrowserComponent
        onSelectBackup={handleBackupSelected}
        selectedBackupPath={state.selectedBackupPath}
      />
    );
  };

  // Render: Recovery Workflow Tab
  const renderWorkflowTab = () => {
    // Dynamisches Import mit Fallback
    const [RecoveryWorkflowComponent, setRecoveryWorkflowComponent] = React.useState<any>(null);
    
    React.useEffect(() => {
      import('./RecoveryWorkflow').then(module => {
        setRecoveryWorkflowComponent(() => module.default);
      }).catch(() => {
        console.error('Failed to load RecoveryWorkflow');
      });
    }, []);

    if (!RecoveryWorkflowComponent) {
      return <div className="text-center py-8 text-gray-500">Loading RecoveryWorkflow...</div>;
    }

    return (
      <RecoveryWorkflowComponent
        backupPath={state.selectedBackupPath}
        targetVersion={state.migrationStatus?.currentVersion || 0}
        onSuccess={handleRollbackSuccess}
        onCancel={handleCancel}
      />
    );
  };

  // Render: Error State
  if (state.error && !state.migrationStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">⚠️ Error Loading Status</h3>
          <p className="text-red-700 text-sm mb-4">{state.error}</p>
          <button
            onClick={handleRefreshStatus}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">🔄 Database Rollback Manager</h2>
            <p className="text-blue-100 text-sm mt-1">Restore your database to a previous state</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b flex">
        {(['status', 'browser', 'workflow'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setState((prev) => ({ ...prev, activeTab: tab }))}
            className={`flex-1 py-4 px-4 font-medium transition-colors ${
              state.activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab === 'status' && '📊 Status'}
            {tab === 'browser' && '📁 Backups'}
            {tab === 'workflow' && '🔧 Recover'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6">
        {state.isLoading && state.activeTab === 'status' ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin text-blue-600 text-3xl">⟳</div>
          </div>
        ) : state.activeTab === 'status' ? (
          renderStatusTab()
        ) : state.activeTab === 'browser' ? (
          renderBrowserTab()
        ) : (
          renderWorkflowTab()
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border-t px-6 py-3 text-xs text-gray-500 flex justify-between">
        <span>Database Rollback & Recovery System</span>
        <span>Phase 2 Step 4 - Production Ready</span>
      </div>
    </div>
  );
}
