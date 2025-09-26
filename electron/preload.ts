// electron/preload.ts
// Unified Preload Script for RawaLite Custom Updater

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Custom Updater API
const updater = {
  check: () => ipcRenderer.invoke("updater:check"),
  download: (fileUrl?: string) => ipcRenderer.invoke("updater:download", fileUrl),
  install: (exePath?: string) => ipcRenderer.invoke("updater:install", exePath),
  installCustom: (options: any) => ipcRenderer.invoke("updater:install-custom", options),
  checkResults: () => ipcRenderer.invoke("updater:check-results"),
  
  // Progress event listeners
  onProgress: (callback: (progress: any) => void) => {
    const handler = (_: IpcRendererEvent, progress: any) => callback(progress);
    ipcRenderer.on("updater:progress", handler);
    return () => ipcRenderer.removeListener("updater:progress", handler);
  },
  offProgress: () => {
    ipcRenderer.removeAllListeners("updater:progress");
  },
  
  // Status event listeners
  onStatus: (callback: (status: any) => void) => {
    const handler = (_: IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on("updater:status", handler);
    return () => ipcRenderer.removeListener("updater:status", handler);
  },
  offStatus: () => {
    ipcRenderer.removeAllListeners("updater:status");
  },
  
  // Launcher event listeners
  onLauncherStarted: (callback: (data: any) => void) => {
    const handler = (_: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on("updater:launcher-started", handler);
    return () => ipcRenderer.removeListener("updater:launcher-started", handler);
  },
  onRestartRequired: (callback: (data: any) => void) => {
    const handler = (_: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on("updater:restart-required", handler);
    return () => ipcRenderer.removeListener("updater:restart-required", handler);
  },
  onInstallCompleted: (callback: (data: any) => void) => {
    const handler = (_: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on("updater:install-completed", handler);
    return () => ipcRenderer.removeListener("updater:install-completed", handler);
  },
  offLauncherEvents: () => {
    ipcRenderer.removeAllListeners("updater:launcher-started");
    ipcRenderer.removeAllListeners("updater:restart-required");
    ipcRenderer.removeAllListeners("updater:install-completed");
  }
};

// Version API (unified version system)
const version = {
  get: () => ipcRenderer.invoke("version:get")
};

// App API
const app = {
  getVersion: () => ipcRenderer.invoke("app:getVersion"), // Legacy, use version.get()
  restart: () => ipcRenderer.invoke("app:restart"),
  restartAfterUpdate: () => ipcRenderer.invoke("app:restart-after-update"),
  exportLogs: () => ipcRenderer.invoke("app:exportLogs")
};

// Database API
const db = {
  load: () => ipcRenderer.invoke("db:load"),
  save: (data: Uint8Array) => ipcRenderer.invoke("db:save", data)
};

// PDF API
const pdf = {
  generate: (options: any) => ipcRenderer.invoke("pdf:generate", options),
  getStatus: () => ipcRenderer.invoke("pdf:getStatus")
};

// Backup API
const backup = {
  create: (options: any) => ipcRenderer.invoke("backup:create", options),
  list: () => ipcRenderer.invoke("backup:list"),
  prune: (options: any) => ipcRenderer.invoke("backup:prune", options)
};

// Logo API
const logo = {
  upload: (options: any) => ipcRenderer.invoke("logo:upload", options),
  get: (filePath: string) => ipcRenderer.invoke("logo:get", filePath),
  getUrl: (filePath: string) => ipcRenderer.invoke("logo:getUrl", filePath),
  delete: (filePath: string) => ipcRenderer.invoke("logo:delete", filePath)
};

// Expose unified API to renderer
contextBridge.exposeInMainWorld("rawalite", {
  updater,
  version,
  app,
  db,
  pdf,
  backup,
  logo
});