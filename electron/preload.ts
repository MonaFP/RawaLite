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
  // � Rollback & Migration API (Phase 2)
  rollback: {
    status: () => 
      ipcRenderer.invoke('rollback:status') as Promise<{
        success: boolean;
        currentVersion: number;
        targetVersion: number;
        pendingCount: number;
        pendingMigrations: Array<{ version: number; name: string; type: string }>;
      }>,
    migrate: (targetVersion: number) => 
      ipcRenderer.invoke('rollback:migrate', targetVersion) as Promise<{
        success: boolean;
        message: string;
        previousVersion: number;
        newVersion: number;
        timestamp?: string;
      }>,
    listBackups: (backupDir: string) => 
      ipcRenderer.invoke('rollback:listBackups', backupDir) as Promise<{
        success: boolean;
        backups: Array<{
          filename: string;
          path: string;
          size: number;
          created: string;
          type: 'pre-migration' | 'hot' | 'vacuum' | 'unknown';
          sizeFormatted: string;
        }>;
        directory: string;
        count: number;
      }>,
    restore: (backupPath: string, targetPath: string) => 
      ipcRenderer.invoke('rollback:restore', backupPath, targetPath) as Promise<{
        success: boolean;
        message: string;
        backupPath: string;
        targetPath: string;
        size: number;
        sizeFormatted: string;
        timestamp: string;
      }>,
    validateBackup: (backupPath: string) => 
      ipcRenderer.invoke('rollback:validateBackup', backupPath) as Promise<{
        success: boolean;
        valid: boolean;
        size?: number;
        sizeFormatted?: string;
        created?: string;
        errors: string[];
      }>,
    cleanupBackups: (backupDir: string, keepCount?: number) => 
      ipcRenderer.invoke('rollback:cleanupBackups', backupDir, keepCount) as Promise<{
        success: boolean;
        deletedCount: number;
        deletedFiles: string[];
        remainingCount: number;
      }>,
  },
  // �🗂️ Pfad-Management API (Phase 2)
  paths: {
    get: (pathType: 'userData' | 'documents' | 'downloads') => 
      ipcRenderer.invoke('paths:get', pathType) as Promise<string>,
    getAppPath: () => 
      ipcRenderer.invoke('paths:getAppPath') as Promise<string>,
    getCwd: () => 
      ipcRenderer.invoke('paths:getCwd') as Promise<string>,
    getPackageJsonPath: () => 
      ipcRenderer.invoke('paths:getPackageJsonPath') as Promise<string>,
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
    appendFile: (filePath: string, data: string | Uint8Array, encoding?: string) =>
      ipcRenderer.invoke('fs:appendFile', filePath, data, { encoding }) as Promise<boolean>,
  },
  // 📁 File Management API for Attachments
  files: {
    saveImage: (imageData: string, filename: string, subDir?: string) => 
      ipcRenderer.invoke('files:saveImage', imageData, filename, subDir) as Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>,
    deleteFile: (filePath: string) => 
      ipcRenderer.invoke('files:deleteFile', filePath) as Promise<{
        success: boolean;
        error?: string;
      }>,
    getImageAsBase64: (filePath: string) => 
      ipcRenderer.invoke('files:getImageAsBase64', filePath) as Promise<{
        success: boolean;
        base64Data?: string;
        error?: string;
      }>,
  },
  // 🔢 Numbering Circles API
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
    
    // Update Manager Window
    openManager: () =>
      ipcRenderer.invoke('updates:openManager') as Promise<{
        success: boolean;
        windowId?: number;
      }>,
    
    // Download operations
    startDownload: (updateInfo: any) => 
      ipcRenderer.invoke('updates:startDownload', updateInfo) as Promise<string>,
    cancelDownload: () => 
      ipcRenderer.invoke('updates:cancelDownload') as Promise<void>,
    
    // Progress tracking for dedicated progress window
    getProgressStatus: () =>
      ipcRenderer.invoke('updates:getProgressStatus') as Promise<{
        percentage: number;
        downloaded: number;
        total: number;
        speed: number;
        eta: number;
        status: 'idle' | 'downloading' | 'completed' | 'error';
      } | null>,
    getUpdateInfo: () =>
      ipcRenderer.invoke('updates:getUpdateInfo') as Promise<{
        version: string;
        name: string;
        releaseNotes: string;
        publishedAt: string;
        downloadUrl: string;
        assetName: string;
        fileSize: number;
        isPrerelease: boolean;
      } | null>,
    
    // Installation operations
    installUpdate: (filePath: string, options?: { silent?: boolean; restartAfter?: boolean }) => 
      ipcRenderer.invoke('updates:installUpdate', filePath, options) as Promise<void>,
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
    
    // Legacy v1.0.41 Support - Manual File Selection
    selectUpdateFile: () =>
      ipcRenderer.invoke('updates:selectUpdateFile') as Promise<string | null>,
    validateUpdateFile: (filePath: string) =>
      ipcRenderer.invoke('updates:validateUpdateFile', filePath) as Promise<{
        isValid: boolean;
        size?: number;
        version?: string;
        fileName?: string;
        error?: string;
      }>,
    
    // === Phase 4: AutoUpdateService Security & Monitoring Extensions ===
    
    // Service Status Monitoring
    getServiceStatus: () =>
      ipcRenderer.invoke('updates:getServiceStatus') as Promise<{
        isRunning: boolean;
        lastCheck: number | null;
        currentDownload: any | null;
        securityLevel: string;
      }>,
    
    // Security Validation
    validateSecurity: (updateInfo: any) =>
      ipcRenderer.invoke('updates:validateSecurity', updateInfo) as Promise<{
        isValid: boolean;
        securityChecks: {
          hasValidSignature: boolean;
          isFromTrustedSource: boolean;
          hasValidChecksum: boolean;
          virusScanClean: boolean;
        };
        recommendation: 'safe_to_download' | 'security_risk';
      }>,
    
    // Service Preferences Management
    updateServicePreferences: (preferences: any) =>
      ipcRenderer.invoke('updates:updateServicePreferences', preferences) as Promise<{
        success: boolean;
        message?: string;
      }>,
  },
  // 🔄 Status Update System API
  status: {
    // Update status for different entity types
    updateOfferStatus: (params: { id: number; status: string; expectedVersion: number }) =>
      ipcRenderer.invoke('status:updateOfferStatus', params) as Promise<{
        id: number;
        status: string;
        version: number;
        updated_at: string;
        sent_at?: string | null;
        accepted_at?: string | null;
        rejected_at?: string | null;
      }>,
    updateInvoiceStatus: (params: { id: number; status: string; expectedVersion: number }) =>
      ipcRenderer.invoke('status:updateInvoiceStatus', params) as Promise<{
        id: number;
        status: string;
        version: number;
        updated_at: string;
        sent_at?: string | null;
        paid_at?: string | null;
        overdue_at?: string | null;
        cancelled_at?: string | null;
      }>,
    updateTimesheetStatus: (params: { id: number; status: string; expectedVersion: number }) =>
      ipcRenderer.invoke('status:updateTimesheetStatus', params) as Promise<{
        id: number;
        status: string;
        version: number;
        updated_at: string;
        sent_at?: string | null;
        accepted_at?: string | null;
        rejected_at?: string | null;
      }>,
    
    // Get status history for an entity
    getHistory: (params: { entityType: 'offers' | 'invoices' | 'timesheets'; entityId: number }) =>
      ipcRenderer.invoke('status:getHistory', params) as Promise<Array<{
        id: number;
        old_status: string | null;
        new_status: string;
        changed_at: string;
        changed_by: string;
      }>>,
    
    // Get entity with version for optimistic locking
    getEntityForUpdate: (params: { entityType: 'offers' | 'invoices' | 'timesheets'; entityId: number }) =>
      ipcRenderer.invoke('status:getEntityForUpdate', params) as Promise<{
        id: number;
        status: string;
        version: number;
      } | null>,
  },
  // 🎨 Theme Management API
  themes: {
    getAllThemes: () => 
      ipcRenderer.invoke('themes:get-all') as Promise<any[]>,
    getThemeByKey: (themeKey: string) => 
      ipcRenderer.invoke('themes:get-by-key', themeKey) as Promise<any | null>,
    getThemeById: (id: number) => 
      ipcRenderer.invoke('themes:get-by-id', id) as Promise<any | null>,
    getUserActiveTheme: (userId?: string) => 
      ipcRenderer.invoke('themes:get-user-active', userId) as Promise<any | null>,
    setUserTheme: (userId: string, themeId: number, themeKey: string) => 
      ipcRenderer.invoke('themes:set-user-theme', userId, themeId, themeKey) as Promise<boolean>,
    createTheme: (themeData: any, colors: Record<string, string>) => 
      ipcRenderer.invoke('themes:create', themeData, colors) as Promise<any | null>,
    updateTheme: (id: number, updates: any) => 
      ipcRenderer.invoke('themes:update', id, updates) as Promise<boolean>,
    updateThemeColors: (themeId: number, colors: Record<string, string>) => 
      ipcRenderer.invoke('themes:update-colors', themeId, colors) as Promise<boolean>,
    deleteTheme: (id: number) => 
      ipcRenderer.invoke('themes:delete', id) as Promise<boolean>,
    // Header-specific theme methods (FIX-018 compliant)
    getHeaderConfig: (userId?: string) => 
      ipcRenderer.invoke('themes:get-header-config', userId) as Promise<any | null>,
    setHeaderConfig: (userId: string, headerConfig: any) => 
      ipcRenderer.invoke('themes:set-header-config', userId, headerConfig) as Promise<boolean>,
    resetHeader: (userId?: string) => 
      ipcRenderer.invoke('themes:reset-header', userId) as Promise<boolean>,
  },
  // 🧭 Navigation Management API
  navigation: {
    getUserPreferences: (userId?: string) => 
      ipcRenderer.invoke('navigation:get-user-preferences', userId) as Promise<any>,
    setUserPreferences: (userId: string, preferences: any) => 
      ipcRenderer.invoke('navigation:set-user-preferences', userId, preferences) as Promise<boolean>,
    setNavigationMode: (userId: string, navigationMode: string, sessionId?: string) => 
      ipcRenderer.invoke('navigation:set-navigation-mode', userId, navigationMode, sessionId) as Promise<boolean>,
    updateLayoutDimensions: (userId: string, headerHeight?: number, sidebarWidth?: number) => 
      ipcRenderer.invoke('navigation:update-layout-dimensions', userId, headerHeight, sidebarWidth) as Promise<boolean>,
    getLayoutConfig: (userId?: string) => 
      ipcRenderer.invoke('navigation:get-layout-config', userId) as Promise<any>,
    getModeHistory: (userId?: string, limit?: number) => 
      ipcRenderer.invoke('navigation:get-mode-history', userId, limit) as Promise<any[]>,
    getStatistics: (userId?: string) => 
      ipcRenderer.invoke('navigation:get-statistics', userId) as Promise<Record<string, number>>,
    resetPreferences: (userId?: string) => 
      ipcRenderer.invoke('navigation:reset-preferences', userId) as Promise<boolean>,
    validateSchema: () => 
      ipcRenderer.invoke('navigation:validate-schema') as Promise<boolean>,
  },
  // 🦶 Footer Management API (Enhanced Focus-Bar Approach)
  footer: {
    getContentPreferences: (userId?: string, navigationMode?: string) => 
      ipcRenderer.invoke('footer:get-content-preferences', userId, navigationMode) as Promise<any>,
    updateContentPreferences: (preferences: any) => 
      ipcRenderer.invoke('footer:update-content-preferences', preferences) as Promise<boolean>,
    getFocusModePreferences: (userId?: string) => 
      ipcRenderer.invoke('footer:get-focus-mode-preferences', userId) as Promise<any>,
    updateFocusModePreferences: (preferences: any) => 
      ipcRenderer.invoke('footer:update-focus-mode-preferences', preferences) as Promise<boolean>,
    getConfiguration: (userId?: string) => 
      ipcRenderer.invoke('footer:get-configuration', userId) as Promise<any>,
    getStatusInfo: () => 
      ipcRenderer.invoke('footer:get-status-info') as Promise<any>,
    executeQuickAction: (actionId: string) => 
      ipcRenderer.invoke('footer:execute-quick-action', actionId) as Promise<boolean>,
    getQuickActions: () => 
      ipcRenderer.invoke('footer:get-quick-actions') as Promise<any[]>,
    validateSystem: () => 
      ipcRenderer.invoke('footer:validate-system') as Promise<boolean>,
  },
  
  // 🔧 Central Configuration Management API
  configuration: {
    getActiveConfig: (userId: string, theme: string, navigationMode: string, focusMode?: boolean) =>
      ipcRenderer.invoke('configuration:get-active-config', userId, theme, navigationMode, focusMode) as Promise<any>,
    updateActiveConfig: (userId: string, updates: any) =>
      ipcRenderer.invoke('configuration:update-active-config', userId, updates) as Promise<boolean>,
    validateConsistency: (userId: string) =>
      ipcRenderer.invoke('configuration:validate-consistency', userId) as Promise<{
        isConsistent: boolean;
        issues: string[];
        recommendations: string[];
      }>,
    resetToDefaults: (userId: string) =>
      ipcRenderer.invoke('configuration:reset-to-defaults', userId) as Promise<boolean>,
  },
  
  // Development tools
  dev: {
    triggerCSSReload: () => 
      ipcRenderer.send('dev:trigger-css-reload'),
    isDevelopment: () => 
      ipcRenderer.invoke('dev:is-development') as Promise<boolean>,
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
