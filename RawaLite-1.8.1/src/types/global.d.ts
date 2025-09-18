/**
 * Globale TypeScript-Deklarationen für Window-Objekte
 * Erweitert Window-Interface mit strikten IPC-Types
 */

import type { RawaliteAPI, ElectronAPI } from '../types/ipc';

declare global {
  interface Window {
    rawalite: RawaliteAPI;
    electronAPI: ElectronAPI;
  }
}

export {};