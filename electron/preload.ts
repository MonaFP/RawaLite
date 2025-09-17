// ============================================================
// FILE: electron/preload.ts - 🔧 CRITICAL FIX: IPC Consistency
// ============================================================
import { contextBridge, ipcRenderer } from 'electron';

// 🔧 CRITICAL FIX: Proper typing for update system
interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface UpdateResult {
  success: boolean;
  updateInfo?: UpdateInfo;
  error?: string;
}

interface VersionInfo {
  current: string;
  appName: string;
}

// Update message handler for renderer communication
let updateMessageCallback: ((event: any, data: any) => void) | null = null;

const updater = {
  // 🔧 CRITICAL FIX: Match IPC handler names exactly
  checkForUpdates: (): Promise<UpdateResult> => ipcRenderer.invoke('updater:check-for-updates'),
  startDownload: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('updater:start-download'),
  installAndRestart: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('updater:install-and-restart'),
  getVersion: (): Promise<VersionInfo> => ipcRenderer.invoke('updater:get-version'),
  
  // 🔧 CRITICAL FIX: Proper event handling for update messages
  onUpdateMessage: (callback: (event: any, data: any) => void) => {
    updateMessageCallback = callback;
    ipcRenderer.on('update-message', callback);
  },
  
  removeUpdateMessageListener: (callback: (event: any, data: any) => void) => {
    ipcRenderer.removeListener('update-message', callback);
    updateMessageCallback = null;
  }
};

const app = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke('app:isPackaged'),
  restart: (): Promise<void> => ipcRenderer.invoke('app:restart'),
  exportLogs: (): Promise<{success: boolean; filePath?: string; error?: string}> => ipcRenderer.invoke('app:exportLogs')
};

// 🔧 CRITICAL FIX: Match global.d.ts interface exactly - use 'rawalite' not 'api'
contextBridge.exposeInMainWorld('rawalite', { updater, app });

declare global {
  interface Window {
    rawalite: {
      updater: typeof updater;
      app: typeof app;
    };
  }
}