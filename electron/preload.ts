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
});
