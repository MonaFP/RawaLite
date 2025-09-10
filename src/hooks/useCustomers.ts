import { useEffect, useState } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import type { Customer } from "../persistence/adapter";

export function useCustomers() {
  const { adapter, ready, error } = usePersistence();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !adapter) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await adapter.listCustomers();
        if (active) setData(rows);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ready, adapter]);

  return { customers: data, loading, error };
}
