// Re-export core database functionality for backwards compatibility
export { getDB, all, run, withTx } from './persistence/sqlite/db';
export { SQLiteAdapter } from './adapters/SQLiteAdapter';

// Export types
export type {
  Settings,
  Customer,
  Package,
  Offer,
  Invoice,
  PersistenceAdapter
} from './persistence/adapter';