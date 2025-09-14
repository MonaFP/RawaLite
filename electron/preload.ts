// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { 
  RawaliteAPI, 
  ElectronAPI, 
  PDFGenerateOptions, 
  UpdateMessage 
} from '../src/types/ipc';
import type { IpcRendererEvent } from 'electron';

const rawaliteAPI: RawaliteAPI = {
  db: {
    load: () => ipcRenderer.invoke('db:load'),
    save: (data: Uint8Array) => ipcRenderer.invoke('db:save', data),
  },
  app: {
    restart: () => ipcRenderer.invoke('app:restart'),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    startDownload: () => ipcRenderer.invoke('updater:start-download'),
    installAndRestart: () => ipcRenderer.invoke('updater:install-and-restart'),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    
    // Event listeners for update messages
    onUpdateMessage: (callback: (event: IpcRendererEvent, data: UpdateMessage) => void) => {
      ipcRenderer.on('update-message', callback)
    },
    
    removeUpdateMessageListener: (callback: (event: IpcRendererEvent, data: UpdateMessage) => void) => {
      ipcRenderer.removeListener('update-message', callback)
    }
  }
};

const electronAPI: ElectronAPI = {
  pdf: {
    generate: (options: PDFGenerateOptions) => ipcRenderer.invoke('pdf:generate', options),
    getStatus: () => ipcRenderer.invoke('pdf:getStatus'),
  }
};

contextBridge.exposeInMainWorld('rawalite', rawaliteAPI);
contextBridge.exposeInMainWorld('electronAPI', electronAPI);