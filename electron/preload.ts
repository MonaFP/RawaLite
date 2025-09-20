// ============================================================
// FILE: electron/preload.ts
// ============================================================
import { contextBridge, ipcRenderer } from "electron";

// 🔧 CRITICAL FIX: Unified IPC API for electron-updater integration
// Match main.ts IPC handlers and global.d.ts expectations

type CheckResult = { success: boolean; updateInfo?: any; error?: string };
type DownloadResult = { success: boolean; error?: string };
type InstallResult = { success: boolean; error?: string };

type UpdaterEvents = {
  "update-message": (payload: { type: string; data?: any }) => void;
};

const updater = {
  // ✅ UNIFIED VERSION SYSTEM (v1.8.44+): New API contract matching AutoUpdaterModal expectations
  
  checkForUpdates: (): Promise<{ success: boolean; updateInfo?: any; error?: string }> =>
    ipcRenderer.invoke("updater:check-for-updates"),
    
  startDownload: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("updater:start-download"),
    
  installAndRestart: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("updater:quit-and-install"),
  
  // 🧪 Development testing utility
  forceTestUpdate: (): Promise<{ success: boolean; testUpdate?: any }> =>
    ipcRenderer.invoke("updater:force-test-update"),
  
  // 📡 Event listener for update messages
  onUpdateMessage: (callback: (message: {
    type: 'update-available' | 'update-not-available' | 'update-downloaded' | 'download-progress' | 'error';
    data?: any;
  }) => void): (() => void) => {
    const handler = (_: any, message: any) => callback(message);
    ipcRenderer.on("updater:message", handler);
    return () => ipcRenderer.removeListener("updater:message", handler);
  },
  
  // 🚨 DEPRECATED: Legacy methods for backward compatibility
  getVersion: (): Promise<{ current: string; target?: string }> => {
    console.warn("⚠️ DEPRECATED: updater.getVersion() - use version.get() + updater.checkForUpdates() instead");
    // Backward compatibility wrapper combining both new APIs
    return Promise.all([
      ipcRenderer.invoke("version:get"), 
      ipcRenderer.invoke("updater:check-for-updates")
    ]).then(([versionData, updateData]) => ({
      current: versionData.app,
      target: updateData.updateInfo?.version || versionData.app
    }));
  },
  
  check: (): Promise<{
    hasUpdate: boolean;
    current: string;
    target?: any;
  }> => {
    console.warn("⚠️ DEPRECATED: updater.check() - use updater.checkForUpdates() instead");
    return ipcRenderer.invoke("updater:check");
  },
  
  download: (url: string): Promise<string> => {
    console.warn("⚠️ DEPRECATED: updater.download() - use updater.startDownload() instead");
    return ipcRenderer.invoke("updater:download", url);
  },
    
  install: (exePath: string): Promise<void> => {
    console.warn("⚠️ DEPRECATED: updater.install() - use updater.installAndRestart() instead");
    return ipcRenderer.invoke("updater:install", exePath);
  },
    
  onProgress: (callback: (progress: {
    percent: number;
    transferred: number;
    total: number;
    speed?: number;
    etaSec?: number;
  }) => void): (() => void) => {
    const handler = (_: any, progress: any) => callback(progress);
    ipcRenderer.on("updater:progress", handler);
    return () => ipcRenderer.removeListener("updater:progress", handler);
  },
};

const app = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("app:getVersion"),
  restart: (): Promise<void> => ipcRenderer.invoke("app:restart"),
  exportLogs: (): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> => ipcRenderer.invoke("app:exportLogs"),
};

// 🆕 UNIFIED VERSION API - Single source of truth for all version queries
const version = {
  get: (): Promise<{
    app: string;
    electron: string;
    chrome: string;
  }> => ipcRenderer.invoke("version:get"),
};

// 🔧 CRITICAL FIX: PDF Service IPC handlers
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

// 🔧 UNIFIED: All APIs under window.rawalite namespace + direct updater access + version API
contextBridge.exposeInMainWorld("rawalite", { 
  // Keep existing rawalite APIs (defined in main.ts)
  updater, 
  app,
  pdf,  // Add PDF service to unified namespace
  version  // 🆕 Add unified version API
});

// Direct updater access for the new Modal
contextBridge.exposeInMainWorld("updater", updater);

declare global {
  interface Window {
    rawalite: {
      updater: typeof updater;
      app: typeof app;
      pdf: typeof pdf;
      version: typeof version;
    };
    updater: typeof updater;
  }
}
