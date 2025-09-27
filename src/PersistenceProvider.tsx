import { ReactNode, useEffect, useState } from "react";
import { PersistenceContext } from "./contexts/PersistenceContext";
import type { PersistenceAdapter } from "./persistence";
import { createAdapter } from "./persistence";

interface Props {
  children: ReactNode;
  mode?: "sqlite" | "local";
}

export default function PersistenceProvider({ children, mode = "sqlite" }: Props) {
  const [adapter, setAdapter] = useState<PersistenceAdapter | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        console.log('🚀 [PersistenceProvider] Starting adapter creation...');
        // Use centralized adapter creation - already ready()
        const adapterInstance = await createAdapter();
        if (!active) return;
        console.log('✅ [PersistenceProvider] Adapter created successfully');
        setAdapter(adapterInstance);
        setReady(true);
      } catch (e: any) {
        console.error('❌ [PersistenceProvider] Adapter creation failed:', e);
        setError(String(e?.message ?? e));
      }
    })();
    return () => {
      active = false;
    };
  }, [mode]);

  return (
    <PersistenceContext.Provider value={{ adapter, ready, error }}>
      {children}
    </PersistenceContext.Provider>
  );
}
