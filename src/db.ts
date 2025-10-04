// Re-export core database functionality via DbClient (Phase 4)
export { default as DbClient } from './services/DbClient';
export { SQLiteAdapter } from './adapters/SQLiteAdapter';

// Export types
export type {
  Settings,
  Customer,
  Package,
  Offer,
  Invoice,
  Activity,
  Timesheet,
  TimesheetActivity,
  PersistenceAdapter
} from './persistence/adapter';

// Legacy wrapper functions for backward compatibility
import DbClient from './services/DbClient';

const client = DbClient.getInstance();

/**
 * @deprecated Use DbClient.query() instead
 */
export const all = <T = any>(sql: string, params: any[] = []): T[] => {
  throw new Error('Legacy sync all() not supported. Use DbClient.query() instead.');
};

/**
 * @deprecated Use DbClient.exec() instead
 */
export const run = (sql: string, params: any[] = []): void => {
  throw new Error('Legacy sync run() not supported. Use DbClient.exec() instead.');
};

/**
 * @deprecated Use DbClient.transaction() instead
 */
export const withTx = <T>(fn: () => T | Promise<T>): Promise<T> => {
  throw new Error('Legacy withTx() not supported. Use DbClient.transaction() instead.');
};

/**
 * @deprecated Not needed with DbClient
 */
export const getDB = (): Promise<void> => {
  // No-op - DbClient handles initialization
  return Promise.resolve();
};