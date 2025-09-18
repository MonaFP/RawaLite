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
        quitAndInstall: () => Promise<{ ok: true }>;
        on: <T extends
          | 'updater:update-available'
          | 'updater:update-not-available'
          | 'updater:error'
          | 'updater:progress'
          | 'updater:ready'
        >(
          channel: T,
          cb: (payload: any) => void
        ) => void;
        off: <T extends
          | 'updater:update-available'
          | 'updater:update-not-available'
          | 'updater:error'
          | 'updater:progress'
          | 'updater:ready'
        >(
          channel: T,
          cb: (payload: any) => void
        ) => void;
      };
      system: {
        getVersion: () => Promise<string>;
      };
    };
  }
}
