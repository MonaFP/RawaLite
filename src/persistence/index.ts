/**
 * 🔧 Central Persistence Interface - Single Source of Truth
 * 
 * Alle Adapter-Imports erfolgen ausschließlich über diese zentrale Schnittstelle.
 * Verhindert Direktimports und gewährleistet Adapter-Parität.
 */

import type { PersistenceAdapter } from './adapter';

// Factory function for adapter creation (matches PersistenceProvider logic)
export async function createAdapter(): Promise<PersistenceAdapter> {
  console.log('🔧 [createAdapter] Creating SQLiteAdapter...');
  // Always use SQLite (matches current PersistenceProvider behavior)
  const { SQLiteAdapter } = await import('../adapters/SQLiteAdapter');
  const adapter = new SQLiteAdapter();
  console.log('📞 [createAdapter] Calling adapter.ready()...');
  await adapter.ready();
  console.log('✅ [createAdapter] Adapter ready completed');
  return adapter;
}

// Default adapter instance for direct usage
let defaultAdapter: PersistenceAdapter | null = null;

export async function getAdapter(): Promise<PersistenceAdapter> {
  if (!defaultAdapter) {
    defaultAdapter = await createAdapter();
  }
  return defaultAdapter;
}

// Re-export types
export type { PersistenceAdapter } from './adapter';
export type * from './adapter';