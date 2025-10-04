// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('rawalite', {
  db: {
    // 🗄️ SQLite Database API (Phase 4)
    query: (sql: string, params?: any[]) => 
      ipcRenderer.invoke('db:query', sql, params) as Promise<any[]>,
    exec: (sql: string, params?: any[]) => 
      ipcRenderer.invoke('db:exec', sql, params) as Promise<any>,
    transaction: (queries: Array<{ sql: string; params?: any[] }>) => 
      ipcRenderer.invoke('db:transaction', queries) as Promise<any[]>,
  },
  // 💾 Backup API
  backup: {
    hot: (backupPath?: string) => 
      ipcRenderer.invoke('backup:hot', backupPath) as Promise<{
        success: boolean;
        backupPath: string;
        size: number;
        checksum: string;
        timestamp: string;
      }>,
    vacuumInto: (backupPath: string) => 
      ipcRenderer.invoke('backup:vacuumInto', backupPath) as Promise<{
        success: boolean;
        backupPath: string;
        size: number;
        checksum: string;
        timestamp: string;
      }>,
    integrityCheck: () => 
      ipcRenderer.invoke('backup:integrityCheck') as Promise<{
        valid: boolean;
        errors: string[];
        checksums: { pragma: string; custom: string };
      }>,
    restore: (backupPath: string) => 
      ipcRenderer.invoke('backup:restore', backupPath) as Promise<{
        success: boolean;
        restoredPath: string;
        timestamp: string;
      }>,
    cleanup: (backupDir: string, keepCount: number) => 
      ipcRenderer.invoke('backup:cleanup', backupDir, keepCount) as Promise<{
        success: boolean;
        deletedCount: number;
        deletedFiles: string[];
      }>,
  },
  // 🗂️ Pfad-Management API (Phase 2)
  paths: {
    get: (pathType: 'userData' | 'documents' | 'downloads') => 
      ipcRenderer.invoke('paths:get', pathType) as Promise<string>,
  },
  // 🔧 Filesystem API für PATHS + SQLite/Dexie Support
  fs: {
    // PATHS-kritische Operationen
    ensureDir: (dirPath: string) => 
      ipcRenderer.invoke('fs:ensureDir', dirPath) as Promise<boolean>,
    getCwd: () => 
      ipcRenderer.invoke('fs:getCwd') as Promise<string>,
    readDir: (dirPath: string) => 
      ipcRenderer.invoke('fs:readDir', dirPath) as Promise<string[]>,
    stat: (filePath: string) => 
      ipcRenderer.invoke('fs:stat', filePath) as Promise<{
        isFile: boolean;
        isDirectory: boolean;
        size: number;
        mtime: number;
        atime: number;
        ctime: number;
      }>,
    unlink: (filePath: string) => 
      ipcRenderer.invoke('fs:unlink', filePath) as Promise<boolean>,
    
    // Zukünftige SQLite/Dexie Support APIs
    exists: (filePath: string) => 
      ipcRenderer.invoke('fs:exists', filePath) as Promise<boolean>,
    copy: (src: string, dest: string) => 
      ipcRenderer.invoke('fs:copy', src, dest) as Promise<boolean>,
    readFile: (filePath: string, encoding?: string) => 
      ipcRenderer.invoke('fs:readFile', filePath, encoding) as Promise<string | Uint8Array>,
    writeFile: (filePath: string, data: string | Uint8Array, encoding?: string) => 
      ipcRenderer.invoke('fs:writeFile', filePath, data, encoding) as Promise<boolean>,
  },
  // � Numbering Circles API
  nummernkreis: {
    getAll: () => 
      ipcRenderer.invoke('nummernkreis:getAll') as Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>,
    update: (id: string, circle: any) => 
      ipcRenderer.invoke('nummernkreis:update', id, circle) as Promise<{
        success: boolean;
        error?: string;
      }>,
    create: (id: string, circle: any) => 
      ipcRenderer.invoke('nummernkreis:create', id, circle) as Promise<{
        success: boolean;
        error?: string;
      }>,
    getNext: (circleId: string) => 
      ipcRenderer.invoke('nummernkreis:getNext', circleId) as Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>,
  },
  // �🔄 Update API (Custom Updater)
  updates: {
    // Check operations
    checkForUpdates: () => 
      ipcRenderer.invoke('updates:check') as Promise<{
        hasUpdate: boolean;
        currentVersion: string;
        latestVersion?: string;
        latestRelease?: any;
        error?: string;
      }>,
    getCurrentVersion: () => 
      ipcRenderer.invoke('updates:getCurrentVersion') as Promise<string>,
    
    // Download operations
    startDownload: (updateInfo: any) => 
      ipcRenderer.invoke('updates:startDownload', updateInfo) as Promise<void>,
    cancelDownload: () => 
      ipcRenderer.invoke('updates:cancelDownload') as Promise<void>,
    
    // Installation operations
    installUpdate: (filePath: string) => 
      ipcRenderer.invoke('updates:installUpdate', filePath) as Promise<void>,
    restartApp: () => 
      ipcRenderer.invoke('updates:restartApp') as Promise<void>,
    
    // Configuration
    getUpdateConfig: () => 
      ipcRenderer.invoke('updates:getConfig') as Promise<any>,
    setUpdateConfig: (config: any) => 
      ipcRenderer.invoke('updates:setConfig', config) as Promise<void>,
    
    // Event subscription
    onUpdateEvent: (listener: (event: any) => void) => {
      const wrappedListener = (_event: any, ...args: any[]) => listener(args[0]);
      ipcRenderer.on('updates:event', wrappedListener);
      return () => ipcRenderer.removeListener('updates:event', wrappedListener);
    },
    
    // Utility
    openDownloadFolder: () => 
      ipcRenderer.invoke('updates:openDownloadFolder') as Promise<void>,
    verifyUpdateFile: (filePath: string) => 
      ipcRenderer.invoke('updates:verifyFile', filePath) as Promise<boolean>,
  },
});

// 📄 PDF API (v1.7.5 Rollback) - Separate namespace for compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  pdf: {
    generate: (options: {
      templateType: 'offer' | 'invoice' | 'timesheet';
      data: {
        offer?: any;
        invoice?: any;
        timesheet?: any;
        customer: any;
        settings: any;
        currentDate?: string;
        logo?: string | null;
      };
      theme?: any;
      options: {
        filename: string;
        previewOnly: boolean;
        enablePDFA: boolean;
        validateCompliance: boolean;
      };
    }) => 
      ipcRenderer.invoke('pdf:generate', options) as Promise<{
        success: boolean;
        filePath?: string;
        previewUrl?: string;
        fileSize?: number;
        error?: string;
      }>,
    getStatus: () => 
      ipcRenderer.invoke('pdf:getStatus') as Promise<{
        electronAvailable: boolean;
        ghostscriptAvailable: boolean;
        veraPDFAvailable: boolean;
        pdfa2bSupported: boolean;
      }>,
  },
});
