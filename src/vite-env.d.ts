/// <reference types="vite/client" />

declare global {
  interface Window {
    rawalite: {
      db: {
        load: () => Promise<Uint8Array | null>;
        save: (data: Uint8Array) => Promise<boolean>;
      };
    };
  }
}
export {};
