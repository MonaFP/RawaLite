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
});
