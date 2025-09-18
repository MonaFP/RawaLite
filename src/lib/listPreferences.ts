/**
 * RawaLite - Listen-Präferenzen Datenmodelle
 * Persistierbare Such-, Filter- und Sortierungseinstellungen für alle Entitätslisten
 */

export type EntityKey = 'customers' | 'packages' | 'offers' | 'invoices' | 'timesheets';

export interface DateRange {
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

export interface ListPreference {
  // Sortierung
  sortBy?: string;          // z.B. 'name' | 'createdAt' | 'status' | 'number'
  sortDir?: 'asc' | 'desc';

  // Spalten-Sichtbarkeit
  visibleColumns?: string[]; // Keys der Table-Columns

  // Pagination
  pageSize?: 10 | 25 | 50 | 100;

  // Filter (entity-spezifisch)
  defaultFilters?: Record<string, unknown>; // z.B. { status: ['sent','accepted'], city: ['Hamburg'], dateRange: {from: '2025-01-01', to: '2025-12-31'} }

  // Suche
  lastSearch?: string;
}

export type ListPreferences = Partial<Record<EntityKey, ListPreference>>;

// Default-Präferenzen pro Entität
export const defaultListPreferences: Record<EntityKey, ListPreference> = {
  customers: {
    sortBy: 'name',
    sortDir: 'asc',
    visibleColumns: ['number', 'name', 'email', 'phone', 'city', 'createdAt'],
    pageSize: 25,
    defaultFilters: {},
    lastSearch: ''
  },
  packages: {
    sortBy: 'createdAt',
    sortDir: 'desc',
    visibleColumns: ['internalTitle', 'total', 'addVat', 'createdAt'],
    pageSize: 25,
    defaultFilters: {},
    lastSearch: ''
  },
  offers: {
    sortBy: 'createdAt',
    sortDir: 'desc',
    visibleColumns: ['offerNumber', 'customerId', 'title', 'status', 'validUntil', 'total', 'createdAt'],
    pageSize: 25,
    defaultFilters: {},
    lastSearch: ''
  },
  invoices: {
    sortBy: 'createdAt',
    sortDir: 'desc',
    visibleColumns: ['invoiceNumber', 'customerId', 'title', 'status', 'dueDate', 'total', 'createdAt'],
    pageSize: 25,
    defaultFilters: {},
    lastSearch: ''
  },
  timesheets: {
    sortBy: 'createdAt',
    sortDir: 'desc',
    visibleColumns: ['timesheetNumber', 'customerId', 'title', 'status', 'startDate', 'endDate', 'total', 'createdAt'],
    pageSize: 25,
    defaultFilters: {},
    lastSearch: ''
  }
};

// Hilfsfunktionen
export function mergeWithDefaults(entity: EntityKey, preferences?: ListPreference): ListPreference {
  return {
    ...defaultListPreferences[entity],
    ...preferences
  };
}

export function isValidEntityKey(key: string): key is EntityKey {
  return ['customers', 'packages', 'offers', 'invoices', 'timesheets'].includes(key);
}

// Filter-Typen für bessere Type-Safety
export interface CustomerFilters {
  city?: string[];
  hasEmail?: boolean;
  createdDateRange?: DateRange;
}

export interface PackageFilters {
  hasSubPackages?: boolean;
  addVat?: boolean;
  totalRange?: { min?: number; max?: number };
}

export interface OfferFilters {
  status?: ('draft' | 'sent' | 'accepted' | 'rejected')[];
  validUntilRange?: DateRange;
  totalRange?: { min?: number; max?: number };
}

export interface InvoiceFilters {
  status?: ('draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')[];
  dueDateRange?: DateRange;
  isOverdue?: boolean;
  totalRange?: { min?: number; max?: number };
}

export interface TimesheetFilters {
  status?: ('draft' | 'sent' | 'approved' | 'rejected')[];
  startDateRange?: DateRange;
  endDateRange?: DateRange;
  totalRange?: { min?: number; max?: number };
}