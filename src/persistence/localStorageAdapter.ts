import type { StorageAdapter, CollectionName } from './adapter';

const NS = 'rawalite:';

export class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: CollectionName): Promise<T | undefined> {
    const raw = localStorage.getItem(NS + key);
    if (!raw) return undefined;
    try { return JSON.parse(raw) as T; } catch { return undefined; }
  }
  async set<T>(key: CollectionName, value: T): Promise<void> {
    localStorage.setItem(NS + key, JSON.stringify(value));
  }
}