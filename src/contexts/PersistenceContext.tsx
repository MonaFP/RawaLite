import { createContext, useContext } from "react";
import type { PersistenceAdapter } from "../persistence/adapter";

export interface PersistenceContextValue {
  adapter: PersistenceAdapter | null;
  ready: boolean;
  error?: string;
}

export const PersistenceContext = createContext<PersistenceContextValue>({
  adapter: null,
  ready: false,
});

export function usePersistence() {
  const ctx = useContext(PersistenceContext);
  if (!ctx) throw new Error("usePersistence must be used within PersistenceProvider");
  return ctx;
}
