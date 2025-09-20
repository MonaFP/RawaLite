/**
 * 🚀 RawaLite Custom In-App Updater Types
 * 
 * TypeScript-Definitionen für den Custom Update System ohne electron-updater
 */

// === UPDATE MANIFEST SCHEMA ===
export interface UpdateManifest {
  product: string;
  channel: string;
  version: string;
  releasedAt: string;
  notes?: string;
  files: UpdateFile[];
}

export interface UpdateFile {
  kind: 'nsis';
  arch: 'x64';
  name: string;
  size: number;
  sha512: string;  // Base64-encoded SHA512 hash
  url: string;
}

// === IPC RESPONSE TYPES ===
export interface UpdateCheckResponse {
  ok: boolean;
  hasUpdate?: boolean;
  current?: string;
  target?: UpdateManifest;
  error?: string;
}

export interface UpdateDownloadResponse {
  ok: boolean;
  filePath?: string;
  error?: string;
}

export interface UpdateInstallResponse {
  ok: boolean;
  error?: string;
}

// === PROGRESS EVENTS ===
export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  speed?: number;      // bytes per second
  etaSec?: number;     // estimated time remaining in seconds
}

// === WINDOW API TYPES ===
export interface CustomUpdaterAPI {
  check: () => Promise<UpdateCheckResponse>;
  download: (url: string) => Promise<string>;  // Returns file path
  install: (exePath: string) => Promise<UpdateInstallResponse>;
  onProgress: (callback: (progress: UpdateProgress) => void) => (() => void);
  offProgress: () => void;
}

export interface VersionAPI {
  get: () => Promise<{
    app: string;
    electron: string;
    chrome: string;
  }>;
}

// Note: Global Window types are already defined in src/global.d.ts
// This file only exports interfaces for type checking