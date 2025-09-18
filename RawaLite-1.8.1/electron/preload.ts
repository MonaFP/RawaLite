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
  getVersion: (): Promise<{ current: string; appName: string }> =>
    ipcRenderer.invoke("updater:get-version"),

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

const system = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("system:getVersion"),
};

contextBridge.exposeInMainWorld("api", { updater, system });

declare global {
  interface Window {
    api: {
      updater: typeof updater;
      system: typeof system;
    };
  }
}
