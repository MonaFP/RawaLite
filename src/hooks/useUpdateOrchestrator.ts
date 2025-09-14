/**
 * 🔄 React Hook für UpdateOrchestrator
 * 
 * Vereinfacht die Nutzung des UpdateOrchestrators in React-Komponenten:
 * - State-Management für Update-Prozess
 * - Event-Handler für electron-updater Events
 * - UI-freundliche Progress-Updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UpdateOrchestrator, UpdateState, UpdateHooks } from '../services/UpdateOrchestrator';

export interface UseUpdateOrchestratorOptions {
  autoCheckOnStart?: boolean;
  checkInterval?: number; // in ms
}

export interface UseUpdateOrchestratorReturn {
  // State
  state: UpdateState;
  isChecking: boolean;
  isDownloading: boolean;
  canDownload: boolean;
  canInstall: boolean;
  
  // Actions
  checkForUpdates: () => Promise<void>;
  startDownload: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  reset: () => void;
  
  // Orchestrator instance (for advanced usage)
  orchestrator: UpdateOrchestrator;
}

export function useUpdateOrchestrator(
  options: UseUpdateOrchestratorOptions = {}
): UseUpdateOrchestratorReturn {
  const { autoCheckOnStart = false, checkInterval } = options;
  
  // State
  const [state, setState] = useState<UpdateState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready'
  });
  
  // Orchestrator instance (singleton per hook)
  const orchestratorRef = useRef<UpdateOrchestrator | null>(null);
  
  // Initialize orchestrator
  if (!orchestratorRef.current) {
    orchestratorRef.current = new UpdateOrchestrator();
  }
  
  const orchestrator = orchestratorRef.current;

  // Hook registration
  useEffect(() => {
    const hooks: UpdateHooks = {
      onStateChange: (newState: UpdateState) => {
        setState(newState);
      },
      onProgress: (progress: number, message: string) => {
        setState(prevState => ({
          ...prevState,
          progress,
          message
        }));
      },
      onError: (error: string) => {
        setState(prevState => ({
          ...prevState,
          phase: 'error',
          error
        }));
      }
    };

    orchestrator.registerHooks(hooks);

    // Cleanup function
    return () => {
      // Orchestrator cleanup if needed
    };
  }, [orchestrator]);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheckOnStart) {
      checkForUpdates();
    }
  }, [autoCheckOnStart]);

  // Periodic check interval
  useEffect(() => {
    if (checkInterval && checkInterval > 0) {
      const interval = setInterval(() => {
        if (state.phase === 'idle') {
          checkForUpdates();
        }
      }, checkInterval);

      return () => clearInterval(interval);
    }
  }, [checkInterval, state.phase]);

  // IPC Event Listeners für electron-updater Events
  useEffect(() => {
    // NOTE: electron-updater Events werden direkt vom Main-Process
    // über die IPC-Handler abgewickelt. Progress-Updates kommen
    // über die orchestrator.handleDownloadProgress() Calls.
    
    // Placeholder für zukünftige Event-Integration
    const cleanup = () => {
      // Event cleanup wenn nötig
    };

    return cleanup;
  }, [orchestrator]);

  // Action handlers
  const checkForUpdates = useCallback(async () => {
    try {
      await orchestrator.checkForUpdates();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }, [orchestrator]);

  const startDownload = useCallback(async () => {
    try {
      await orchestrator.startDownload();
    } catch (error) {
      console.error('Update download failed:', error);
    }
  }, [orchestrator]);

  const installAndRestart = useCallback(async () => {
    try {
      await orchestrator.installAndRestart();
    } catch (error) {
      console.error('Update installation failed:', error);
    }
  }, [orchestrator]);

  const reset = useCallback(() => {
    orchestrator.reset();
  }, [orchestrator]);

  // Computed state
  const isChecking = state.phase === 'checking';
  const isDownloading = state.phase === 'downloading';
  const canDownload = state.phase === 'available';
  const canInstall = state.phase === 'downloaded';

  return {
    // State
    state,
    isChecking,
    isDownloading,
    canDownload,
    canInstall,
    
    // Actions
    checkForUpdates,
    startDownload,
    installAndRestart,
    reset,
    
    // Orchestrator
    orchestrator
  };
}