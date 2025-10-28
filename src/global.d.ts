declare interface Window {
  // 🗂️ Modern RawaLite API (Phase 2 + Phase 4)
  rawalite: {
    // SQLite Database API (Phase 4)
    db: {
      query: (sql: string, params?: any[]) => Promise<any[]>;
      exec: (sql: string, params?: any[]) => Promise<any>;
      transaction: (queries: Array<{ sql: string; params?: any[] }>) => Promise<any[]>;
    };
    // Backup API (Phase 4)
    backup: {
      hot: (backupPath?: string) => Promise<{
        success: boolean;
        backupPath: string;
        size: number;
        checksum: string;
        timestamp: string;
      }>;
      vacuumInto: (backupPath: string) => Promise<{
        success: boolean;
        backupPath: string;
        size: number;
        checksum: string;
        timestamp: string;
      }>;
      integrityCheck: () => Promise<{
        valid: boolean;
        errors: string[];
        checksums: { pragma: string; custom: string };
      }>;
      restore: (backupPath: string) => Promise<{
        success: boolean;
        restoredPath: string;
        timestamp: string;
      }>;
      cleanup: (backupDir: string, keepCount: number) => Promise<{
        success: boolean;
        deletedCount: number;
        deletedFiles: string[];
      }>;
    };
    // Filesystem API für PATHS Support
    fs: {
      ensureDir: (dirPath: string) => Promise<boolean>;
      getCwd: () => Promise<string>;
      readDir: (dirPath: string) => Promise<string[]>;
      stat: (filePath: string) => Promise<{
        isFile: boolean;
        isDirectory: boolean;
        size: number;
        mtime: number;
        atime: number;
        ctime: number;
      }>;
      unlink: (filePath: string) => Promise<boolean>;
      exists: (filePath: string) => Promise<boolean>;
      copy: (src: string, dest: string) => Promise<boolean>;
      readFile: (filePath: string, encoding?: string) => Promise<string | Uint8Array>;
      writeFile: (filePath: string, data: string | Uint8Array, encoding?: string) => Promise<boolean>;
    };
    // File Management API for Attachments
    files: {
      saveImage: (imageData: string, filename: string, subDir?: string) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
      deleteFile: (filePath: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      getImageAsBase64: (filePath: string) => Promise<{
        success: boolean;
        base64Data?: string;
        error?: string;
      }>;
    };
    // Pfad-Management API (Phase 2)
    paths: {
      get(pathType: 'userData' | 'documents' | 'downloads'): Promise<string>;
    };
    // 🔢 Numbering Circles API
    nummernkreis: {
      getAll(): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      update(id: string, circle: any): Promise<{
        success: boolean;
        error?: string;
      }>;
      create(id: string, circle: any): Promise<{
        success: boolean;
        error?: string;
      }>;
      getNext(circleId: string): Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>;
    };
    // Update API (Custom Updater)
    updates: {
      // Check operations
      checkForUpdates(): Promise<{
        hasUpdate: boolean;
        currentVersion: string;
        latestVersion?: string;
        latestRelease?: any;
        error?: string;
      }>;
      getCurrentVersion(): Promise<string>;
      getUpdateInfo(): Promise<any>; // v1.0.41 compatibility API
      
      // Update Manager Window
      openManager(): Promise<{
        success: boolean;
        windowId?: number;
      }>;
      
      // Download operations
      startDownload(updateInfo: any): Promise<string>; // Returns file path
      cancelDownload(): Promise<void>;
      
      // Installation operations
      installUpdate(filePath: string, options?: { silent?: boolean; restartAfter?: boolean }): Promise<void>;
      restartApp(): Promise<void>;
      
      // Configuration
      getUpdateConfig(): Promise<any>;
      setUpdateConfig(config: any): Promise<void>;
      
      // Event subscription
      onUpdateEvent(listener: (event: any) => void): () => void;
      
      // Utility
      openDownloadFolder(): Promise<void>;
      verifyUpdateFile(filePath: string): Promise<boolean>;
      
      // Legacy v1.0.41 Support - Manual File Selection
      selectUpdateFile(): Promise<string | null>; // Returns selected file path or null if cancelled
      validateUpdateFile(filePath: string): Promise<{
        isValid: boolean;
        size?: number;
        version?: string;
        error?: string;
      }>;
      
      // === Phase 4: AutoUpdateService Security & Monitoring Extensions ===
      
      // Service Status Monitoring
      getServiceStatus(): Promise<{
        isRunning: boolean;
        lastCheck: number | null;
        currentDownload: any | null;
        securityLevel: string;
      }>;
      
      // Security Validation
      validateSecurity(updateInfo: any): Promise<{
        isValid: boolean;
        securityChecks: {
          hasValidSignature: boolean;
          isFromTrustedSource: boolean;
          hasValidChecksum: boolean;
          virusScanClean: boolean;
        };
        recommendation: 'safe_to_download' | 'security_risk';
      }>;
      
      // Service Preferences Management
      updateServicePreferences(preferences: any): Promise<{
        success: boolean;
        message?: string;
      }>;
    };
    // 🎨 Theme Management API
    themes: {
      getAllThemes: () => Promise<any[]>;
      getThemeByKey: (themeKey: string) => Promise<any | null>;
      getThemeById: (id: number) => Promise<any | null>;
      getUserActiveTheme: (userId?: string) => Promise<any | null>;
      setUserTheme: (userId: string, themeId: number, themeKey: string) => Promise<boolean>;
      createTheme: (themeData: any, colors: Record<string, string>) => Promise<any | null>;
      updateTheme: (id: number, updates: any) => Promise<boolean>;
      updateThemeColors: (themeId: number, colors: Record<string, string>) => Promise<boolean>;
      deleteTheme: (id: number) => Promise<boolean>;
      // Header-specific theme methods (FIX-018 compliant)
      getHeaderConfig: (userId?: string) => Promise<any | null>;
      setHeaderConfig: (userId: string, headerConfig: any) => Promise<boolean>;
      resetHeader: (userId?: string) => Promise<boolean>;
    };
    // 🧭 Navigation Management API
    navigation: {
      getUserPreferences: (userId?: string) => Promise<any>;
      setUserPreferences: (userId: string, preferences: any) => Promise<boolean>;
      setNavigationMode: (userId: string, navigationMode: string, sessionId?: string) => Promise<boolean>;
      updateLayoutDimensions: (userId: string, headerHeight?: number, sidebarWidth?: number) => Promise<boolean>;
      getLayoutConfig: (userId?: string) => Promise<any>;
      getModeHistory: (userId?: string, limit?: number) => Promise<any[]>;
      getStatistics: (userId?: string) => Promise<Record<string, number>>;
      resetPreferences: (userId?: string) => Promise<boolean>;
      validateSchema: () => Promise<boolean>;
    };
    // 🦶 Footer Management API (Enhanced Focus-Bar Approach)
    footer: {
      getContentPreferences: (userId?: string, navigationMode?: string) => Promise<any>;
      updateContentPreferences: (preferences: any) => Promise<boolean>;
      getFocusModePreferences: (userId?: string) => Promise<any>;
      updateFocusModePreferences: (preferences: any) => Promise<boolean>;
      getConfiguration: (userId?: string) => Promise<any>;
      getStatusInfo: () => Promise<any>;
      executeQuickAction: (actionId: string) => Promise<boolean>;
      getQuickActions: () => Promise<any[]>;
      validateSystem: () => Promise<boolean>;
    };
  };
  // 📄 PDF API (v1.7.5 Rollback for native Electron PDF generation)
  electronAPI?: {
    // 🎯 Focus Mode API
    focusMode?: {
      getPreferences: (userId?: string) => Promise<any | null>;
      setFocusMode: (userId: string | undefined, active: boolean, variant?: string | null) => Promise<boolean>;
      setAutoRestore: (userId: string | undefined, autoRestore: boolean) => Promise<boolean>;
      resetPreferences: (userId?: string) => Promise<boolean>;
      startSession: (userId: string | undefined, variant: string, sessionId: string, navigationMode?: string, themeName?: string) => Promise<boolean>;
      endSession: (sessionId: string) => Promise<boolean>;
      getAnalytics: (userId?: string) => Promise<any>;
      validateSchema: () => Promise<boolean>;
    };
    pdf?: {
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
      }) => Promise<{
        success: boolean;
        filePath?: string;
        previewUrl?: string;
        fileSize?: number;
        error?: string;
      }>;
      getStatus: () => Promise<{
        electronAvailable: boolean;
        ghostscriptAvailable: boolean;
        veraPDFAvailable: boolean;
        pdfa2bSupported: boolean;
      }>;
    };
  };
}