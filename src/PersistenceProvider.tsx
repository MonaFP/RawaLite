import { ReactNode, useEffect, useMemo, useState } from "react";
import { PersistenceContext } from "./contexts/PersistenceContext";
import type { PersistenceAdapter } from "./persistence/adapter";
import { SQLiteAdapter } from "./adapters/SQLiteAdapter";

interface Props {
  children: ReactNode;
  mode?: "sqlite" | "local";
}

export default function PersistenceProvider({ children, mode = "sqlite" }: Props) {
  const [adapter, setAdapter] = useState<PersistenceAdapter | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();

  const instance = useMemo(() => {
    if (mode === "sqlite") return new SQLiteAdapter();
    return new SQLiteAdapter();
  }, [mode]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await instance.ready();
        if (!active) return;
        setAdapter(instance);
        setReady(true);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
    return () => {
      active = false;
    };
  }, [instance]);

  return (
    <PersistenceContext.Provider value={{ adapter, ready, error }}>
      {children}
    </PersistenceContext.Provider>
  );
}
