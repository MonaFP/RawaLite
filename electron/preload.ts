// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('rawalite', {
  db: {
    load: () => ipcRenderer.invoke('db:load') as Promise<Uint8Array | null>,
    save: (data: Uint8Array) => ipcRenderer.invoke('db:save', data) as Promise<boolean>,
  },
  app: {
    restart: () => ipcRenderer.invoke('app:restart') as Promise<void>,
    getVersion: () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url) as Promise<void>,
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    startDownload: () => ipcRenderer.invoke('updater:start-download'),
    installAndRestart: () => ipcRenderer.invoke('updater:install-and-restart'),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    
    // Event listeners for update messages
    onUpdateMessage: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('update-message', callback)
    },
    
    removeUpdateMessageListener: (callback: (event: any, data: any) => void) => {
      ipcRenderer.removeListener('update-message', callback)
    }
  }
});

// PDF API for new PDF generation system
contextBridge.exposeInMainWorld('electronAPI', {
  pdf: {
    generate: (options: any) => ipcRenderer.invoke('pdf:generate', options),
    getStatus: () => ipcRenderer.invoke('pdf:getStatus'),
  }
});

// Erweitere das globale Window-Interface für TypeScript
declare global {
  interface Window {
    rawalite: {
      db: {
        load: () => Promise<Uint8Array | null>;
        save: (data: Uint8Array) => Promise<boolean>;
      };
      app: {
        restart: () => Promise<void>;
        getVersion: () => Promise<string>;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
      updater: {
        checkForUpdates: () => Promise<{success: boolean; updateInfo?: any; error?: string}>;
        startDownload: () => Promise<{success: boolean; error?: string}>;
        installAndRestart: () => Promise<{success: boolean; error?: string}>;
        getVersion: () => Promise<{current: string; appName: string}>;
        onUpdateMessage: (callback: (event: any, data: any) => void) => void;
        removeUpdateMessageListener: (callback: (event: any, data: any) => void) => void;
      };
    };
    electronAPI: {
      pdf: {
        generate: (options: any) => Promise<any>;
        getStatus: () => Promise<{
          electronAvailable: boolean;
          ghostscriptAvailable: boolean;
          veraPDFAvailable: boolean;
          pdfa2bSupported: boolean;
        }>;
      };
    };
  }
}