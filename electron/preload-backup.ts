// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

// 🔧 CRITICAL FIX: Unified IPC API for electron-updater integration
// Match main.ts IPC handlers and global.d.ts expectations

type CheckResult = { success: boolean; updateInfo?: any; error?: string };
type DownloadResult = { success: boolean; error?: string };
type InstallResult = { success: boolean; error?: string };

type UpdaterEvents = {
  "update-message": (payload: { type: string; data?: any }) => void;
};

// 🔧 UNIFIED VERSION API - Single Source of Truth für App-Version (v1.8.44+)
const version = {
  /**
   * Get unified version information from package.json + debug data
   * @returns Promise with app version from package.json + electron/chrome versions
   */
  get: (): Promise<{ app: string; electron: string; chrome: string }> =>
    ipcRenderer.invoke("version:get"),
};

// 🔧 NATIVE UPDATER API - Full electron-updater integration (v1.8.38+)
const updater = {
  // Native update check via electron-updater
  check: (): Promise<{
    available: boolean;
    latest: {
      version: string;
      releaseDate: string;
      releaseNotes: string;
    };
    current: string;
    error?: string;
  }> => ipcRenderer.invoke("updater:check"),

  // Native update download via electron-updater
  download: (): Promise<DownloadResult> => ipcRenderer.invoke("updater:download"),

  // Native update install via electron-updater
  install: (): Promise<InstallResult> => ipcRenderer.invoke("updater:install"),

  // Get current version (unified with version.get())
  getVersion: (): Promise<{ current: string; appName: string }> =>
    ipcRenderer.invoke("updater:get-version"),

  // Event listeners for updater events
  onUpdateMessage: (callback: UpdaterEvents["update-message"]) => {
    ipcRenderer.on("update-message", (event, payload) => callback(payload));
  },

  removeUpdateListener: (callback: UpdaterEvents["update-message"]) => {
    ipcRenderer.removeListener("update-message", callback);
  },

  // Legacy GitHub API fallback (kept for compatibility)
  checkViaGitHub: (): Promise<CheckResult> => ipcRenderer.invoke("updater:check-github"),
};

// Database operations
const persistence = {
  execute: (sql: string, params: any[] = []): Promise<any> =>
    ipcRenderer.invoke("db:execute", sql, params),
  load: (): Promise<Uint8Array | null> => ipcRenderer.invoke("db:load"),
  save: (data: Uint8Array): Promise<boolean> => ipcRenderer.invoke("db:save", data),
};

// PDF operations
const pdf = {
  generate: (options: {
    templateType: "offer" | "invoice" | "timesheet";
    data: any;
    companyData: any;
    outputPath?: string;
    convertToPDFA?: boolean;
  }): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke("pdf:generate", options),
};

// File operations
const fileSystem = {
  openDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke("fs:openDirectory"),
  saveFile: (
    defaultPath: string,
    data: Uint8Array,
    filters?: { name: string; extensions: string[] }[]
  ): Promise<string | null> =>
    ipcRenderer.invoke("fs:saveFile", defaultPath, data, filters),
};

// Platform information
const platform = {
  getInfo: (): Promise<{
    platform: string;
    arch: string;
    version: string;
    isPackaged: boolean;
    appPath: string;
    userDataPath: string;
  }> => ipcRenderer.invoke("platform:getInfo"),
};

// App operations
const app = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("app:getVersion"),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("app:openExternal", url),
  showItemInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke("app:showItemInFolder", path),
  quit: (): Promise<void> => ipcRenderer.invoke("app:quit"),
  restart: (): Promise<void> => ipcRenderer.invoke("app:restart"),
  getPath: (
    name: "userData" | "documents" | "downloads" | "pictures" | "desktop"
  ): Promise<string> => ipcRenderer.invoke("app:getPath", name),
};

// Expose APIs to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  version,      // 🔧 NEW: Unified version system
  updater,      // 🔧 ENHANCED: Native electron-updater integration
  persistence,
  pdf,
  fileSystem,
  platform,
  app,
});

// Export types for TypeScript
export type { CheckResult, DownloadResult, InstallResult, UpdaterEvents };