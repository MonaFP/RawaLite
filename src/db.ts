// ✅ Centralized exports - no direct adapter imports
export { getDB, all, run, withTx } from './persistence/sqlite/db';
export { getAdapter, createAdapter } from './persistence';

// Export types through central interface
export type {
  Settings,
  Customer,
  Package,
  Offer,
  Invoice,
  PersistenceAdapter
} from './persistence';