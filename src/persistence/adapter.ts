export interface Settings {
  id: number;
  companyName?: string;
  street?: string;
  zip?: string;
  city?: string;
  taxId?: string;
  kleinunternehmer?: boolean;
  nextCustomerNumber?: number;
  nextOfferNumber?: number;
  nextInvoiceNumber?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  number: string;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersistenceAdapter {
  ready(): Promise<void>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Customers
  listCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | null>;
  createCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
}
