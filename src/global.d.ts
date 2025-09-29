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

  // 🗂️ Modern RawaLite API (Phase 2)
  rawalite: {
    db: {
      load(): Promise<Uint8Array | null>;
      save(data: Uint8Array): Promise<boolean>;
    };
    paths: {
      get(pathType: 'userData' | 'documents' | 'downloads'): Promise<string>;
    };
  };
}