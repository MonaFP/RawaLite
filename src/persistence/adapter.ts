export type CollectionName = 'customers' | 'invoices' | 'offers' | 'packages' | 'counters' | 'settings';

export interface StorageAdapter {
  get<T>(key: CollectionName): Promise<T | undefined>;
  set<T>(key: CollectionName, value: T): Promise<void>;
}