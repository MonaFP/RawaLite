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

  // 🗂️ Modern RawaLite API (Phase 2 + Phase 4)
  rawalite: {
    // Legacy Dexie DB API (Phase 2)
    db: {
      load(): Promise<Uint8Array | null>;
      save(data: Uint8Array): Promise<boolean>;
      // SQLite Database API (Phase 4)
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
    paths: {
      get(pathType: 'userData' | 'documents' | 'downloads'): Promise<string>;
    };
  };
}