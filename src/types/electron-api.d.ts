// ============================================================
// FILE: src/types/electron-api.d.ts
// (Falls du bereits eine globale Typdatei hast, diesen Block dort einfügen.)
// ============================================================
export {};

declare global {
  interface Window {
    api: {
      updater: {
        check: () => Promise<{ ok: true } | { ok: false; reason: string }>;
        download: () => Promise<{ ok: true } | { ok: false; reason: string }>;
        install: (exePath?: string) => Promise<{ ok: true; used?: string } | { ok: false; error: string }>;
        onProgress: (callback: (progress: any) => void) => () => void;
        offProgress: () => void;
      };
      system: {
        getVersion: () => Promise<string>;
      };
    };
  }
}
