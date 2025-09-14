export type EntityType = 'customers' | 'invoices' | 'offers' | 'packages' | 'timesheets' | 'activities';

export type Counters = Record<EntityType, number>;

export const defaultCounters: Counters = {
  customers: 0,
  invoices: 0,
  offers: 0,
  packages: 0,
  timesheets: 0,
  activities: 0,
};

export function formatId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}