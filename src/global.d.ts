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
    };
  };
  electronAPI?: {
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