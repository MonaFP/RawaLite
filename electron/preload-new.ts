// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

// 🔧 UNIFIED VERSION API - Single Source of Truth für App-Version (package.json)
const version = {
  /**
   * Get unified version information from package.json + debug data
   * @returns Promise with app version from package.json + electron/chrome versions
   */
  get: (): Promise<{ app: string; electron: string; chrome: string }> =>
    ipcRenderer.invoke("version:get"),
};

// 🚀 Custom Updater API Bridge (No electron-updater) 
const updater = {
  check: (): Promise<{
    available: boolean;
    latest: {
      version: string;
      releaseDate: string;
      releaseNotes: string;
    } | null;
    current: string;
    error?: string;
  }> => ipcRenderer.invoke("updater:check"),

  download: (url: string): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke("updater:download", url),

  install: (exePath: string): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke("updater:install", exePath),

  onProgress: (callback: (progress: {
    percent: number; 
    transferred: number; 
    total: number; 
    speed?: number; 
    etaSec?: number;
  }) => void) => {
    ipcRenderer.on("updater:progress", (_event, progress) => callback(progress));
  },

  // @deprecated - use version.get() and updater.check() separately
  getVersion: async (): Promise<{ current: string; target: string }> => {
    const v = await ipcRenderer.invoke("version:get");
    const u = await ipcRenderer.invoke("updater:check");
    return { 
      current: v.app, 
      target: u.latest?.version ?? v.app 
    };
  },

  // Legacy compatibility methods
  checkViaGitHub: (): Promise<{ success: boolean; updateInfo?: any; error?: string }> => 
    ipcRenderer.invoke("updater:check-github"),
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

// Expose APIs to renderer - unified window.rawalite namespace
contextBridge.exposeInMainWorld("rawalite", {
  version,      // 🔧 NEW: Unified version system
  updater,      // 🔧 ENHANCED: Custom updater integration
  persistence,
  pdf,
  fileSystem,
  platform,
  app,
});

// Legacy compatibility - keep existing electronAPI for backwards compatibility
contextBridge.exposeInMainWorld("electronAPI", {
  version,
  updater,
  persistence,
  pdf,
  fileSystem,  
  platform,
  app,
});