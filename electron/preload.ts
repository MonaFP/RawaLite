// ============================================================
// FILE: electron/preload.ts
// ============================================================
import { contextBridge, ipcRenderer } from 'electron';

type CheckResult = { ok: true } | { ok: false; reason: string };
type DownloadResult = { ok: true } | { ok: false; reason: string };

type UpdaterEvents = {
  'updater:update-available': (payload: { info: unknown }) => void;
  'updater:update-not-available': (payload: { info: unknown }) => void;
  'updater:error': (payload: { message: string }) => void;
  'updater:progress': (payload: { percent: number; transferred: number; total: number }) => void;
  'updater:ready': (payload: { version?: string; releaseName?: string }) => void;
};

const updater = {
  check: (): Promise<CheckResult> => ipcRenderer.invoke('updater:check'),
  download: (): Promise<DownloadResult> => ipcRenderer.invoke('updater:download'),
  quitAndInstall: (): Promise<{ ok: true }> => ipcRenderer.invoke('updater:quitAndInstall'),
  on<T extends keyof UpdaterEvents>(channel: T, cb: UpdaterEvents[T]) {
    ipcRenderer.on(channel, (_e, payload) => cb(payload));
  },
  off<T extends keyof UpdaterEvents>(channel: T, cb: UpdaterEvents[T]) {
    ipcRenderer.removeListener(channel, cb as any);
  },
};

const system = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('system:getVersion'),
};

contextBridge.exposeInMainWorld('api', { updater, system });

declare global {
  interface Window {
    api: {
      updater: typeof updater;
      system: typeof system;
    };
  }
}