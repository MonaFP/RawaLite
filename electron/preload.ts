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
  // 🔧 FIXED: Match main.ts IPC handler names exactly
  checkForUpdates: (): Promise<CheckResult> =>
    ipcRenderer.invoke("updater:check-for-updates"),
  startDownload: (): Promise<DownloadResult> =>
    ipcRenderer.invoke("updater:start-download"),
  installAndRestart: (): Promise<InstallResult> =>
    ipcRenderer.invoke("updater:quit-and-install"),
  installManual: (installerPath?: string): Promise<InstallResult> =>
    ipcRenderer.invoke("updater:quit-and-install", installerPath),
  getVersion: (): Promise<{ current: string; appName: string }> =>
    ipcRenderer.invoke("updater:get-version"),

  // 🧪 DEVELOPMENT TEST: Force-simulate update for testing
  forceTestUpdate: (): Promise<{ success: boolean; testUpdate?: any; message?: string }> =>
    ipcRenderer.invoke("updater:force-test-update"),

  // 🔧 CRITICAL FIX: Event bridging for electron-updater events
  onUpdateMessage: (
    callback: (event: any, data: { type: string; data?: any }) => void
  ): void => {
    ipcRenderer.on("update-message", callback);
  },
  removeUpdateMessageListener: (
    callback: (event: any, data: { type: string; data?: any }) => void
  ): void => {
    ipcRenderer.removeListener("update-message", callback);
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

// 🔧 UNIFIED: All APIs under window.rawalite namespace  
contextBridge.exposeInMainWorld("rawalite", { 
  // Keep existing rawalite APIs (defined in main.ts)
  updater, 
  app,
  pdf  // Add PDF service to unified namespace
});

declare global {
  interface Window {
    rawalite: {
      updater: typeof updater;
      app: typeof app;
      pdf: typeof pdf;
    };
  }
}
