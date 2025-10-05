import { ReactNode, useEffect, useMemo, useState } from "react";
import { PersistenceContext } from "./contexts/PersistenceContext";
import type { PersistenceAdapter } from "./persistence/adapter";
import { SQLiteAdapter } from "./adapters/SQLiteAdapter";
// Falls du noch LocalStorageAdapter behalten willst:
// import { LocalStorageAdapter } from "./persistence/localStorageAdapter";

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
    // return new LocalStorageAdapter();
    return new SQLiteAdapter();
  }, [mode]);

  useEffect(() => {
    let active = true;
    console.log('🔧 [PersistenceProvider] Starting initialization...', { mode, instance });
    
    (async () => {
      try {
        console.log('🔧 [PersistenceProvider] Calling instance.ready()...');
        await instance.ready();
        
        if (!active) {
          console.log('🔧 [PersistenceProvider] Component unmounted, aborting...');
          return;
        }
        
        console.log('🔧 [PersistenceProvider] instance.ready() completed successfully');
        setAdapter(instance);
        setReady(true);
        console.log('🔧 [PersistenceProvider] Context ready=true, adapter set');
      } catch (e: any) {
        const errorMsg = String(e?.message ?? e);
        console.error('🔧 [PersistenceProvider] Initialization failed:', errorMsg, e);
        setError(errorMsg);
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
