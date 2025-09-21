// ============================================================
// FILE: electron/preload.ts - 🚀 Custom In-App Updater
// ============================================================
import { contextBridge, ipcRenderer } from "electron";

// Import custom updater types
import type { UpdateCheckResponse, UpdateDownloadResponse, UpdateInstallResponse, UpdateProgress } from "../src/types/updater";

// 🔄 CUSTOM UPDATER API - Pure IPC Implementation
const updater = {
  
  check: (): Promise<UpdateCheckResponse> =>
    ipcRenderer.invoke("updater:check"),
    
  download: (): Promise<{ ok: boolean; file?: string; error?: string; size?: number }> =>
    ipcRenderer.invoke("updater:download"),
    
  install: (exePath?: string): Promise<{ ok: boolean; used?: string; error?: string }> =>
    ipcRenderer.invoke("updater:install", exePath),
  
  // 📡 Progress event listener
  onProgress: (callback: (progress: UpdateProgress) => void): (() => void) => {
    const handler = (_: any, progress: UpdateProgress) => callback(progress);
    ipcRenderer.on("updater:progress", handler);
    return () => ipcRenderer.removeListener("updater:progress", handler);
  },
  
  offProgress: () => {
    ipcRenderer.removeAllListeners("updater:progress");
  }
};

// 🆕 UNIFIED VERSION API - Single source of truth for all version queries
const version = {
  get: (): Promise<{
    ok: boolean;
    app?: string;
    electron?: string;
    chrome?: string;
  }> => ipcRenderer.invoke("version:get"),
};

const appApi = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("app:getVersion"),
  restart: (): Promise<void> => ipcRenderer.invoke("app:restart"),
  exportLogs: (): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> => ipcRenderer.invoke("app:exportLogs"),
};

// 🔧 DATABASE & PDF APIs (existing)
const db = {
  load: (): Promise<Uint8Array | null> => ipcRenderer.invoke("db:load"),
  save: (data: Uint8Array): Promise<boolean> => ipcRenderer.invoke("db:save", data),
};

const pdf = {
  generate: (options: any): Promise<{
    success: boolean;
    filePath?: string;
    previewUrl?: string;
    fileSize?: number;
    error?: string;
  }> => ipcRenderer.invoke("pdf:generate", options),
  getStatus: (): Promise<{
    electronAvailable: boolean;
    ghostscriptAvailable: boolean;
    veraPDFAvailable: boolean;
    pdfa2bSupported: boolean;
  }> => ipcRenderer.invoke("pdf:getStatus"),
};

// Backup and logo APIs (existing)
const backup = {
  create: (options: any) => ipcRenderer.invoke("backup:create", options),
  list: () => ipcRenderer.invoke("backup:list"),
  prune: (options: any) => ipcRenderer.invoke("backup:prune", options),
};

const logo = {
  upload: (options: any) => ipcRenderer.invoke("logo:upload", options),
  get: (filePath: string) => ipcRenderer.invoke("logo:get", filePath),
  getUrl: (filePath: string) => ipcRenderer.invoke("logo:getUrl", filePath),
  delete: (filePath: string) => ipcRenderer.invoke("logo:delete", filePath),
};

// 🔧 UNIFIED: All APIs under window.rawalite namespace
contextBridge.exposeInMainWorld("rawalite", { 
  updater, 
  app: appApi,
  db,
  pdf,
  backup,
  logo,
  version
});

// No global types needed - they are in global.d.ts
