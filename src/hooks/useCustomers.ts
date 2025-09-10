import { useCallback, useEffect, useState } from "react";
import type { Kunde } from "../entities/Kunde";
import { listCustomers, createCustomer, updateCustomer, deleteCustomer } from "../persistence/sqlite/customers";

export interface UseCustomers {
  items: Kunde[];
  loading: boolean;
  refresh: () => void;
  add: (input: Omit<Kunde,"id"|"createdAt"|"updatedAt">) => Promise<void>;
  edit: (id: string, patch: Partial<Omit<Kunde,"id"|"createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useCustomers(): UseCustomers{
  const [items, setItems] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async ()=>{
    setLoading(true);
    const list = await listCustomers();
    setItems(list);
    setLoading(false);
  },[]);

  const add: UseCustomers["add"] = useCallback(async (input)=>{
    await createCustomer(input);
    await refresh();
  },[refresh]);

  const edit: UseCustomers["edit"] = useCallback(async (id, patch)=>{
    await updateCustomer(id, patch);
    await refresh();
  },[refresh]);

  const remove: UseCustomers["remove"] = useCallback(async (id)=>{
    await deleteCustomer(id);
    await refresh();
  },[refresh]);

  useEffect(()=>{ void refresh(); }, [refresh]);

  return { items, loading, refresh, add, edit, remove };
}
