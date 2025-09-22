declare interface Window {
  rawa?: {
    listCustomers: () => Promise<any[]>;
    addCustomer: (data: { Name: string; Adresse?: string }) => Promise<any>;
    deleteCustomer: (id: string) => Promise<void>;
    getCounters: () => Promise<any>;
    getNextId: (
      entity: "customers" | "invoices" | "offers" | "packages"
    ) => Promise<string>;
    getSettings: () => Promise<any>;
    setKleinunternehmer: (val: boolean) => Promise<void>;
  };
  rawalite?: {
    db: {
      load: () => Promise<Uint8Array | null>;
      save: (data: Uint8Array) => Promise<boolean>;
    };
    app: {
      restart: () => Promise<void>;
      getVersion: () => Promise<string>;
      exportLogs: () => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
    };
    shell: {
      openExternal: (url: string) => Promise<void>;
    };
    updater: {
      // ✅ CUSTOM UPDATER API: Pure IPC Implementation
      check: () => Promise<{
        ok: boolean;
        hasUpdate?: boolean;
        current?: string;
        target?: any;  // UpdateManifest
        error?: string;
      }>;
      download: (url: string) => Promise<{ ok: boolean; file?: string; error?: string }>;  // Returns download result
      install: (exePath: string) => Promise<{
        ok: boolean;
        error?: string;
      }>;
      
      // 🚀 ROBUST: Custom Install API with enhanced parameters for reliable installer launch
      installCustom: (options: {
        filePath: string;
        args?: string[];
        expectedSha256?: string;
        elevate?: boolean;       // default: true (UAC elevation)
        unblock?: boolean;       // default: true (MOTW unblock)
        quitDelayMs?: number;    // default: 7000 (robust quit delay)
      }) => Promise<{
        ok: boolean;
        installerStarted?: boolean;
        pid?: number | null;
        filePath?: string;
        args?: string[];
        runId?: string;
        error?: string;
      }>;
      
      // 📡 Progress event listener
      onProgress: (callback: (progress: {
        percent: number;
        transferred: number;
        total: number;
        speed?: number;
        etaSec?: number;
      }) => void) => (() => void);
      
      offProgress: () => void;
    };
    backup: {
      create: (options: {
        kind: "pre-update" | "manual" | "post-download";
        description?: string;
        payloadMeta?: { version?: string; sizeEst?: number };
      }) => Promise<{
        success: boolean;
        backupId?: string;
        filePath?: string;
        size?: number;
        error?: string;
      }>;
      list: () => Promise<{
        success: boolean;
        backups?: Array<{
          id: string;
          kind: string;
          filePath: string;
          size: number;
          createdAt: string;
          description: string;
          version: string;
        }>;
        error?: string;
      }>;
      prune: (options: { keep?: number; maxTotalMB?: number }) => Promise<{
        success: boolean;
        removedCount?: number;
        error?: string;
      }>;
    };
    logo: {
      upload: (options: {
        buffer: ArrayBuffer;
        fileName: string;
        mimeType: string;
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
      }) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
        metadata?: {
          fileName: string;
          format: "svg" | "png" | "jpg";
          width?: number;
          height?: number;
          fileSize: number;
        };
      }>;
      get: (filePath: string) => Promise<string | null>;
      getUrl: (filePath: string) => Promise<string>;
      delete: (filePath: string) => Promise<boolean>;
    };
    pdf: {
      generate: (options: any) => Promise<{
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
    // 🆕 UNIFIED VERSION API - Single source of truth for version information
    version: {
      get: () => Promise<{
        ok: boolean;
        app?: string;      // Application version from package.json
        electron?: string; // Electron framework version
        chrome?: string;   // Chrome/Chromium version
      }>;
    };
  };
}
