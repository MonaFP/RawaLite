/**
 * 🔄 Update Orchestrator Hook
 * 
 * Vereint electron-updater (Transport) mit UpdateService (Migration/Backup-Orchestration)
 * 
 * KANONISCHER WEG für Updates ab v1.7.1:
 * - electron-updater für App-Downloads/Installation
 * - UpdateService für Migration/Backup-Koordination
 * - Automatischer Backup vor Installation
 * - Migration nach erfolgreichem App-Neustart
 * 
 * Ersetzt die fragmentierten Update-Wege durch eine einheitliche API.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAutoUpdater } from './useAutoUpdater';
import { UpdateService } from '../services/UpdateService';
import { backupService } from '../services/BackupService';
import { LoggingService } from '../services/LoggingService';

export interface OrchestratedUpdateState {
  // electron-updater Status
  electronUpdate: {
    state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
    progress?: { percent: number; transferred: number; total: number };
    updateInfo?: { version: string; releaseNotes?: string };
    error?: string;
  };
  
  // Migration/Backup Status
  migration: {
    required: boolean;
    inProgress: boolean;
    completed: boolean;
    error?: string;
  };
  
  // Backup Status
  backup: {
    inProgress: boolean;
    completed: boolean;
    location?: string;
    error?: string;
  };
  
  // Gesamtstatus
  overall: {
    canInstall: boolean;
    readyToRestart: boolean;
    currentVersion: string;
  };
}

export interface OrchestratedUpdateActions {
  checkForUpdates: () => Promise<void>;
  startDownload: () => Promise<void>;
  prepareInstallation: () => Promise<void>; // Backup + Pre-checks
  installAndRestart: () => Promise<void>;
  runMigrations: () => Promise<void>; // Nach Neustart
  reset: () => void;
}

export function useUpdateOrchestrator(): [OrchestratedUpdateState, OrchestratedUpdateActions] {
  const [electronState, electronActions] = useAutoUpdater({ autoCheckOnStart: false });
  const [updateService] = useState(() => new UpdateService());
  
  const [migrationState, setMigrationState] = useState({
    required: false,
    inProgress: false,
    completed: false,
    error: undefined as string | undefined
  });
  
  const [backupState, setBackupState] = useState({
    inProgress: false,
    completed: false,
    location: undefined as string | undefined,
    error: undefined as string | undefined
  });

  // Prüfe Migration-Status beim Hook-Start
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const updateInfo = await updateService.checkForUpdates();
      setMigrationState(prev => ({
        ...prev,
        required: updateInfo.migrationRequired
      }));
    } catch (error) {
      LoggingService.log(`[UpdateOrchestrator] Migration check failed: ${error}`);
    }
  };

  const checkForUpdates = useCallback(async () => {
    await electronActions.checkForUpdates();
    await checkMigrationStatus();
  }, [electronActions]);

  const startDownload = useCallback(async () => {
    // VALIDATION: Prüfe ob Update verfügbar ist vor Download
    if (electronState.state !== 'available') {
      LoggingService.log(`[UpdateOrchestrator] Download rejected: state is '${electronState.state}', expected 'available'`);
      return;
    }
    
    LoggingService.log('[UpdateOrchestrator] Starting download - state validated as available');
    await electronActions.startDownload();
  }, [electronActions, electronState.state]);

  const prepareInstallation = useCallback(async () => {
    if (backupState.inProgress || backupState.completed) {
      LoggingService.log('[UpdateOrchestrator] Backup already in progress/completed');
      return;
    }

    try {
      setBackupState(prev => ({ ...prev, inProgress: true, error: undefined }));
      
      LoggingService.log('[UpdateOrchestrator] Creating pre-update backup');
      const backupResult = await backupService.createPreUpdateBackup(electronState.currentVersion);

      if (backupResult.success && backupResult.filePath) {
        setBackupState({
          inProgress: false,
          completed: true,
          location: backupResult.filePath,
          error: undefined
        });
        LoggingService.log(`[UpdateOrchestrator] Pre-update backup created: ${backupResult.filePath}`);
      } else {
        throw new Error(backupResult.error || 'Backup creation failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setBackupState({
        inProgress: false,
        completed: false,
        location: undefined,
        error: errorMsg
      });
      LoggingService.log(`[UpdateOrchestrator] Backup failed: ${errorMsg}`);
      throw error;
    }
  }, [backupState.inProgress, backupState.completed]);

  const installAndRestart = useCallback(async () => {
    if (!backupState.completed) {
      await prepareInstallation();
    }
    
    // Installation via electron-updater
    await electronActions.installAndRestart();
  }, [backupState.completed, prepareInstallation, electronActions]);

  const runMigrations = useCallback(async () => {
    if (!migrationState.required || migrationState.completed) {
      LoggingService.log('[UpdateOrchestrator] No migrations required or already completed');
      return;
    }

    try {
      setMigrationState(prev => ({ ...prev, inProgress: true, error: undefined }));
      
      LoggingService.log('[UpdateOrchestrator] Running post-update migrations');
      
      // Lass UpdateService die Migrationen durchführen
      await updateService.performUpdate();
      
      setMigrationState({
        required: false,
        inProgress: false,
        completed: true,
        error: undefined
      });
      
      LoggingService.log('[UpdateOrchestrator] Migrations completed successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMigrationState(prev => ({
        ...prev,
        inProgress: false,
        error: errorMsg
      }));
      LoggingService.log(`[UpdateOrchestrator] Migration failed: ${errorMsg}`);
      throw error;
    }
  }, [migrationState.required, migrationState.completed, updateService]);

  const reset = useCallback(() => {
    electronActions.reset();
    setMigrationState({
      required: false,
      inProgress: false,
      completed: false,
      error: undefined
    });
    setBackupState({
      inProgress: false,
      completed: false,
      location: undefined,
      error: undefined
    });
  }, [electronActions]);

  // Konstruiere orchestrierten State
  const orchestratedState: OrchestratedUpdateState = {
    electronUpdate: {
      state: electronState.state,
      progress: electronState.progress ? {
        percent: electronState.progress.percent,
        transferred: electronState.progress.transferred,
        total: electronState.progress.total
      } : undefined,
      updateInfo: electronState.updateInfo ? {
        version: electronState.updateInfo.version,
        releaseNotes: electronState.updateInfo.releaseNotes
      } : undefined,
      error: electronState.error || undefined
    },
    migration: migrationState,
    backup: backupState,
    overall: {
      canInstall: electronState.state === 'downloaded' && backupState.completed,
      readyToRestart: electronState.state === 'downloaded',
      currentVersion: electronState.currentVersion
    }
  };

  const orchestratedActions: OrchestratedUpdateActions = {
    checkForUpdates,
    startDownload,
    prepareInstallation,
    installAndRestart,
    runMigrations,
    reset
  };

  return [orchestratedState, orchestratedActions];
}