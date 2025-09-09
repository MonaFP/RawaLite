import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { StorageAdapter } from '../persistence/adapter';
import { LocalStorageAdapter } from '../persistence/localStorageAdapter';
import type { EntityType } from '../lib/numbering';
import { defaultCounters, formatId } from '../lib/numbering';
import { defaultSettings, type Settings } from '../lib/settings';

export type Customer = { id: string; Name: string; Adresse?: string };

type DB = {
  customers: Customer[];
};

type PersistenceApi = {
  ready: boolean;
  counters: Record<EntityType, number>;
  settings: Settings;
  listCustomers(): Customer[];
  addCustomer(data: Omit<Customer, 'id'>): Customer;
  updateCustomer(id: string, patch: Partial<Customer>): void;
  deleteCustomer(id: string): void;
  getNextId(type: EntityType): string;
  toggleKleinunternehmer(value: boolean): void;
};

const PersistenceContext = createContext<PersistenceApi | null>(null);

export const usePersistence = () => {
  const ctx = useContext(PersistenceContext);
  if (!ctx) throw new Error('PersistenceContext not available');
  return ctx;
};

declare global { interface Window { rawa?: any } }
export const PersistenceProvider: React.FC<{ children: React.ReactNode; adapter?: StorageAdapter }> = ({ children, adapter }) => {
  const storage = useMemo(() => adapter ?? new LocalStorageAdapter(), [adapter]);
  const [ready, setReady] = useState(false);
  
  // If Electron preload is available, override methods with IPC-backed ones
  const electron = (window as any).rawa;
  const useElectron = !!electron;

  const [db, setDb] = useState<DB>({ customers: []});
  const [counters, setCounters] = useState<Record<EntityType, number>>(defaultCounters);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    (async () => {
      const loadedCounters = (await storage.get<Record<EntityType, number>>('counters')) ?? defaultCounters;
      const loadedSettings = (await storage.get<Settings>('settings')) ?? defaultSettings;
      const customers = (await storage.get<Customer[]>('customers')) ?? [];
      setCounters(loadedCounters);
      setSettings(loadedSettings);
      setDb({ customers });
      setReady(true);
    })();
  }, [storage]);

  useEffect(() => { if (ready) storage.set('customers', db.customers); }, [db, ready, storage]);
  useEffect(() => { if (ready) storage.set('counters', counters); }, [counters, ready, storage]);
  useEffect(() => { if (ready) storage.set('settings', settings); }, [settings, ready, storage]);

  function bumpCounter(type: EntityType): number {
    const next = { ...counters, [type]: (counters[type] ?? 0) + 1 };
    setCounters(next);
    return next[type];
  }

  function getNextId(type: EntityType): string {
    const map: Record<EntityType, string> = { customers: 'K', invoices: 'RE', offers: 'AN', packages: 'PAK' };
    const nextNr = bumpCounter(type);
    return formatId(map[type], nextNr);
  }

  
  // If Electron is present, rewire methods to IPC
  if (useElectron) {
    return <PersistenceContext.Provider value={{
      ready,
      counters,
      settings,
      listCustomers: () => electron.listCustomers(),
      addCustomer: (d:any) => electron.addCustomer(d),
      updateCustomer: (_id:string,_p:any)=>{ /* simplified for demo */ },
      deleteCustomer: (id:string) => electron.deleteCustomer(id),
      getNextId: (e:any) => electron.getNextId(e),
      toggleKleinunternehmer: (v:boolean) => electron.setKleinunternehmer(v)
    }}>{children}</PersistenceContext.Provider>;
  }
const api: PersistenceApi = {
    ready,
    counters,
    settings,
    listCustomers() { return db.customers; },
    addCustomer(data) {
      const id = getNextId('customers');
      const c = { id, ...data };
      setDb(prev => ({ ...prev, customers: [...prev.customers, c]}));
      return c;
    },
    updateCustomer(id, patch) {
      setDb(prev => ({ ...prev, customers: prev.customers.map(c => c.id === id ? { ...c, ...patch } : c)}));
    },
    deleteCustomer(id) {
      setDb(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id)}));
    },
    getNextId,
    toggleKleinunternehmer(v){
      setSettings(prev => ({ ...prev, kleinunternehmer: v }));
    }
  };

  return <PersistenceContext.Provider value={api}>{children}</PersistenceContext.Provider>;
};