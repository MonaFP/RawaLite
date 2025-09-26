// preload-for-update-handler.ts
// Beispiel für ein Preload-Skript zur Kommunikation mit dem Update-Handler

import { contextBridge, ipcRenderer } from 'electron';

// Typdefinitionen für bessere IDE-Unterstützung
interface InstallCustomOptions {
  filePath: string;
  args?: string[];
  expectedSha256?: string;
  elevate?: boolean;
  unblock?: boolean;
  quitDelayMs?: number;
}

interface UpdaterStatus {
  status: 'checking' | 'downloading' | 'preparing-installer' | 'install-started' | 'error';
  message: string;
  progress?: number;
  error?: string;
}

// Sichere IPC-Kommunikation über die contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Update-Installer starten
  installCustomUpdate: (options: InstallCustomOptions) => {
    return ipcRenderer.invoke('updater:install-custom', options);
  },
  
  // Status-Updates vom Hauptprozess empfangen
  onUpdaterStatus: (callback: (status: UpdaterStatus) => void) => {
    const wrappedCallback = (_event: any, status: UpdaterStatus) => callback(status);
    ipcRenderer.on('updater:status', wrappedCallback);
    
    // Funktion zum Entfernen des Event-Listeners zurückgeben
    return () => {
      ipcRenderer.removeListener('updater:status', wrappedCallback);
    };
  }
});

// TypeScript-Deklarationen für die exponierten Funktionen
// Dies wird in einer separaten d.ts-Datei definiert
/*
declare global {
  interface Window {
    electronAPI: {
      installCustomUpdate: (options: InstallCustomOptions) => Promise<{
        ok: boolean;
        error?: string;
        installerStarted?: boolean;
        pid?: number | null;
        filePath?: string;
        args?: string[];
        runId?: string;
        alreadyInProgress?: boolean;
      }>;
      onUpdaterStatus: (callback: (status: UpdaterStatus) => void) => () => void;
    }
  }
}
*/