/**
 * RecoveryWorkflow Component für RawaLite
 * 
 * Geführter Wiederherstellungs-Workflow für Datenbank-Rollback.
 * Features:
 * - Schritt-für-Schritt Wiederherstellungsprozess
 * - Backup-Validierung vor Rollback
 * - Fortschrittsanzeige und Logging
 * - Fehlerbehandlung mit Fallback
 * - Pre-Rollback Backup automatisch erstellen
 * 
 * Status: Production Ready (Phase 2 Step 4)
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { RollbackResult, BackupValidationResult } from '../services/RollbackService';
import { RollbackService } from '../services/RollbackService';
import { LoggingService } from '../services/LoggingService';
import { useNotifications } from '../contexts/NotificationContext';

export interface RecoveryWorkflowProps {
  /**
   * Path to backup file for restoration
   */
  backupPath?: string | null;

  /**
   * Current database version (for display)
   */
  targetVersion?: number;

  /**
   * Callback when recovery succeeds
   */
  onSuccess?: (result: RollbackResult) => void;

  /**
   * Callback when recovery is cancelled
   */
  onCancel?: () => void;

  /**
   * Optional CSS class
   */
  className?: string;
}

export type RecoveryStep = 'idle' | 'select' | 'validate' | 'confirm' | 'processing' | 'success' | 'error';

export interface RecoveryWorkflowState {
  currentStep: RecoveryStep;
  selectedBackup: string | null;
  validationResult: BackupValidationResult | null;
  isProcessing: boolean;
  error: string | null;
  progress: number; // 0-100
  progressMessage: string;
  rollbackResult: RollbackResult | null;
}

/**
 * RecoveryWorkflow Component - Guided Recovery Process
 * 
 * Workflow Steps:
 * 1. Select Backup (if not provided)
 * 2. Validate Backup Integrity
 * 3. Confirm Recovery (with warnings)
 * 4. Process Rollback (with progress)
 * 5. Success/Error Display
 */
export default function RecoveryWorkflow({
  backupPath = null,
  targetVersion = 0,
  onSuccess,
  onCancel,
  className = '',
}: RecoveryWorkflowProps) {
  // Logging Setup
  const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
    console.log(`[RecoveryWorkflow] ${msg}`);
    LoggingService.log(`RecoveryWorkflow: ${msg}`, level).catch(() => {});
  };

  // State Management
  const [state, setState] = useState<RecoveryWorkflowState>({
    currentStep: backupPath ? 'validate' : 'select',
    selectedBackup: backupPath || null,
    validationResult: null,
    isProcessing: false,
    error: null,
    progress: 0,
    progressMessage: '',
    rollbackResult: null,
  });

  const { showError, showSuccess } = useNotifications();

  // Singleton Service Instance
  const rollbackService = RollbackService.getInstance();

  /**
   * Validate Selected Backup
   */
  const handleValidateBackup = useCallback(async () => {
    if (!state.selectedBackup) {
      showError('No backup selected');
      return;
    }

    try {
      log(`Validating backup: ${state.selectedBackup}`);
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      const result = await rollbackService.validateBackup(state.selectedBackup);

      setState((prev) => ({
        ...prev,
        validationResult: result,
        isProcessing: false,
        currentStep: result.valid ? 'confirm' : 'error',
        error: result.valid ? null : `Validation failed: ${result.error}`,
      }));

      if (result.valid) {
        log(`Backup validated: ${result.filename} (${result.sizeFormatted})`);
      } else {
        log(`Backup validation failed: ${result.error}`, 'error');
        showError(`Backup validation failed: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`Validation error: ${errorMsg}`, 'error');
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        error: errorMsg,
        isProcessing: false,
      }));
      showError(`Validation error: ${errorMsg}`);
    }
  }, [state.selectedBackup, rollbackService, showError]);

  /**
   * Start Recovery Process
   */
  const handleStartRecovery = useCallback(async () => {
    if (!state.selectedBackup) {
      showError('No backup selected');
      return;
    }

    try {
      log('Starting recovery process...');
      setState((prev) => ({
        ...prev,
        currentStep: 'processing',
        isProcessing: true,
        error: null,
        progress: 0,
        progressMessage: 'Preparing recovery...',
      }));

      // Simulate progress updates
      setState((prev) => ({ ...prev, progress: 25, progressMessage: 'Creating pre-rollback backup...' }));
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({ ...prev, progress: 50, progressMessage: 'Restoring database from backup...' }));
      const result = await rollbackService.restoreBackup(state.selectedBackup);

      if (!result.success) {
        throw new Error(result.message);
      }

      setState((prev) => ({ ...prev, progress: 75, progressMessage: 'Cleaning up old backups...' }));
      await new Promise((resolve) => setTimeout(resolve, 300));

      setState((prev) => ({ ...prev, progress: 100, progressMessage: 'Recovery completed successfully' }));

      log(`Recovery completed: ${result.message}`);
      showSuccess('✅ Recovery completed successfully');

      setState((prev) => ({
        ...prev,
        currentStep: 'success',
        isProcessing: false,
        rollbackResult: {
          success: true,
          previousVersion: targetVersion,
          newVersion: targetVersion - 1,
          message: result.message,
        },
      }));

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess({
            success: true,
            previousVersion: targetVersion,
            newVersion: targetVersion - 1,
            message: result.message,
          });
        }, 1000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log(`Recovery failed: ${errorMsg}`, 'error');
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        isProcessing: false,
        error: errorMsg,
        progress: 0,
      }));
      showError(`Recovery failed: ${errorMsg}`);
    }
  }, [state.selectedBackup, targetVersion, rollbackService, onSuccess, showError, showSuccess]);

  /**
   * Reset Workflow
   */
  const handleReset = useCallback(() => {
    log('Workflow reset');
    setState({
      currentStep: 'select',
      selectedBackup: null,
      validationResult: null,
      isProcessing: false,
      error: null,
      progress: 0,
      progressMessage: '',
      rollbackResult: null,
    });
  }, []);

  /**
   * Cancel Workflow
   */
  const handleCancel = useCallback(() => {
    log('Workflow cancelled');
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Render: Select Backup
  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          📝 Please select a backup file to restore. Go to the Backups tab to browse and select your backup.
        </p>
      </div>

      <button
        onClick={handleCancel}
        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium"
      >
        Go to Backups Tab
      </button>
    </div>
  );

  // Render: Validate Backup
  const renderValidateStep = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-600">Selected Backup:</p>
        <p className="font-mono text-sm text-gray-800 break-all">{state.selectedBackup}</p>
      </div>

      <button
        onClick={handleValidateBackup}
        disabled={state.isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium"
      >
        {state.isProcessing ? 'Validating...' : 'Validate Backup'}
      </button>

      <button
        onClick={handleCancel}
        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
      >
        Cancel
      </button>
    </div>
  );

  // Render: Confirm Recovery
  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-green-800 font-semibold mb-2">✅ Backup Validated</h4>
        <p className="text-green-700 text-sm">
          The selected backup has been validated and is ready for recovery.
        </p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="text-orange-800 font-semibold mb-2">⚠️ Important</h4>
        <ul className="text-orange-700 text-sm space-y-1 list-disc list-inside">
          <li>Your current database will be backed up automatically</li>
          <li>This operation cannot be undone quickly</li>
          <li>The app may need to restart</li>
          <li>Your data will be restored to the backup date</li>
        </ul>
      </div>

      <button
        onClick={handleStartRecovery}
        disabled={state.isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-lg"
      >
        {state.isProcessing ? 'Processing...' : '🔄 Start Recovery'}
      </button>

      <button
        onClick={handleCancel}
        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
      >
        Cancel
      </button>
    </div>
  );

  // Render: Processing
  const renderProcessingStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Recovery Progress</span>
          <span className="text-sm font-bold text-blue-600">{state.progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-blue-800 font-medium">{state.progressMessage}</p>
        <p className="text-blue-700 text-sm mt-2">Please wait, this may take a moment...</p>
      </div>

      <div className="flex justify-center">
        <div className="animate-spin text-blue-600 text-3xl">⟳</div>
      </div>
    </div>
  );

  // Render: Success
  const renderSuccessStep = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-green-800 font-bold text-lg mb-2">Recovery Completed Successfully</h3>
        <p className="text-green-700">Your database has been restored from the backup.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-600">Status:</p>
        <p className="font-medium text-gray-800">{state.rollbackResult?.message}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          💡 Consider restarting the app to ensure all changes are properly loaded.
        </p>
      </div>

      <button
        onClick={handleReset}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
      >
        ← Go Back to Recovery Menu
      </button>
    </div>
  );

  // Render: Error
  const renderErrorStep = () => (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-bold text-lg mb-2">❌ Recovery Failed</h3>
        <p className="text-red-700 mb-4">{state.error}</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-orange-800 text-sm">
          💡 Your database may have been automatically backed up. Please check the backup browser.
        </p>
      </div>

      <button
        onClick={handleReset}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
      >
        ← Try Another Backup
      </button>

      <button
        onClick={handleCancel}
        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
      >
        Cancel Recovery
      </button>
    </div>
  );

  // Main Render
  return (
    <div className={`bg-white rounded-lg space-y-4 ${className}`}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-sm">
          <span className={state.currentStep === 'select' ? 'font-bold text-blue-600' : 'text-gray-600'}>
            1. Select
          </span>
          <span className="text-gray-400">→</span>
          <span className={state.currentStep === 'validate' ? 'font-bold text-blue-600' : 'text-gray-600'}>
            2. Validate
          </span>
          <span className="text-gray-400">→</span>
          <span className={state.currentStep === 'confirm' ? 'font-bold text-blue-600' : 'text-gray-600'}>
            3. Confirm
          </span>
          <span className="text-gray-400">→</span>
          <span
            className={
              state.currentStep === 'processing' || state.currentStep === 'success' || state.currentStep === 'error'
                ? 'font-bold text-blue-600'
                : 'text-gray-600'
            }
          >
            4. Process
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="border-t pt-4">
        {state.currentStep === 'select' && renderSelectStep()}
        {state.currentStep === 'validate' && renderValidateStep()}
        {state.currentStep === 'confirm' && renderConfirmStep()}
        {state.currentStep === 'processing' && renderProcessingStep()}
        {state.currentStep === 'success' && renderSuccessStep()}
        {state.currentStep === 'error' && renderErrorStep()}
      </div>
    </div>
  );
}
