declare interface Window {
  rawa?: {
    listCustomers: () => Promise<any[]>;
    addCustomer: (data: { Name: string; Adresse?: string }) => Promise<any>;
    deleteCustomer: (id: string) => Promise<void>;
    getCounters: () => Promise<any>;
    getNextId: (entity: 'customers'|'invoices'|'offers'|'packages') => Promise<string>;
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
      isPackaged: () => Promise<boolean>;
      exportLogs: () => Promise<{success: boolean; filePath?: string; error?: string}>;
    };
    shell: {
      openExternal: (url: string) => Promise<void>;
    };
    updater: {
      checkForUpdates: () => Promise<{success: boolean; updateInfo?: any; error?: string}>;
      startDownload: () => Promise<{success: boolean; error?: string}>;
      installAndRestart: () => Promise<{success: boolean; error?: string}>;
      getVersion: () => Promise<{current: string; appName: string}>;
      onUpdateMessage: (callback: (event: any, data: any) => void) => void;
      removeUpdateMessageListener: (callback: (event: any, data: any) => void) => void;
    };
    backup: {
      create: (options: {
        kind: 'pre-update' | 'manual' | 'post-download';
        description?: string;
        payloadMeta?: { version?: string; sizeEst?: number; };
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
      prune: (options: {
        keep?: number;
        maxTotalMB?: number;
      }) => Promise<{
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
          format: 'svg' | 'png' | 'jpg';
          width?: number;
          height?: number;
          fileSize: number;
        };
      }>;
      get: (filePath: string) => Promise<string | null>;
      getUrl: (filePath: string) => Promise<string>;
      delete: (filePath: string) => Promise<boolean>;
    };
  };
  electronAPI?: {
    // Event Listeners
    on?: (channel: string, callback: (event: any, data: any) => void) => void;
    removeListener?: (channel: string, callback: (event: any, data: any) => void) => void;
    
    // Updater API
    updater?: {
      checkForUpdates: () => Promise<{success: boolean; updateInfo?: any; error?: string}>;
      startDownload: () => Promise<{success: boolean; error?: string}>;
      installAndRestart: () => Promise<{success: boolean; error?: string}>;
      getVersion: () => Promise<{current: string; appName: string}>;
    };
    
    pdf?: {
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
  };
}