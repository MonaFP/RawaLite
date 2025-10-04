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

export interface PackageLineItem {
  id: number;
  title: string;
  quantity: number;
  amount: number;
  parentItemId?: number; // Für Sub-Items
  description?: string; // Freitext für Sub-Items
}

export interface Package {
  id: number;
  internalTitle: string;
  lineItems: PackageLineItem[];
  parentPackageId?: number; // Für Subpakete
  total: number;
  addVat: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfferLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number; // Für Sub-Items
  itemType?: 'standalone' | 'individual_sub' | 'package_import'; // Typ des Items (optional für Backwards-Kompatibilität)
  sourcePackageId?: number; // Quell-Paket für package_import Items
}

// Discount interface for offers and invoices
export interface DocumentDiscount {
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number; // Prozent (0-100) oder fester Betrag
  discountAmount: number; // Berechneter Rabatt-Betrag (2 Dezimalstellen)
  subtotalBeforeDiscount: number; // Zwischensumme vor Rabatt
}

export interface Offer extends DocumentDiscount {
  id: number;
  offerNumber: string;
  customerId: number;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  lineItems: OfferLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Datum Felder
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  parentItemId?: number; // Für Sub-Items
}

export interface Invoice extends DocumentDiscount {
  id: number;
  invoiceNumber: string;
  customerId: number;
  offerId?: number; // Optional: Bezug zu Angebot
  title: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Datum Felder
  sentAt?: string;
  paidAt?: string;
  overdueAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  title: string;
  description?: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetActivity {
  id: number;
  timesheetId: number;
  activityId?: number; // Optional: Bezug zu Activity template
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate: number;
  total: number;
  isBreak: boolean; // Pause oder produktive Zeit
}

export interface Timesheet {
  id: number;
  timesheetNumber: string;
  customerId: number;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  startDate: string;
  endDate: string;
  activities: TimesheetActivity[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Datum Felder
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
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

  // Packages
  listPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | null>;
  createPackage(data: Omit<Package, "id" | "createdAt" | "updatedAt">): Promise<Package>;
  updatePackage(id: number, patch: Partial<Package>): Promise<Package>;
  deletePackage(id: number): Promise<void>;

  // Offers
  listOffers(): Promise<Offer[]>;
  getOffer(id: number): Promise<Offer | null>;
  createOffer(data: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer>;
  updateOffer(id: number, patch: Partial<Offer>): Promise<Offer>;
  deleteOffer(id: number): Promise<void>;

  // Invoices
  listInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | null>;
  createInvoice(data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice>;
  updateInvoice(id: number, patch: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;

  // Activities
  listActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | null>;
  createActivity(data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Promise<Activity>;
  updateActivity(id: number, patch: Partial<Activity>): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;

  // Timesheets
  listTimesheets(): Promise<Timesheet[]>;
  getTimesheet(id: number): Promise<Timesheet | null>;
  createTimesheet(data: Omit<Timesheet, "id" | "createdAt" | "updatedAt">): Promise<Timesheet>;
  updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet>;
  deleteTimesheet(id: number): Promise<void>;
}
