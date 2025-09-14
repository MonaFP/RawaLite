/**
 * Strikte TypeScript-Definitionen für IPC-Kommunikation
 * Alle Electron IPC-Channels mit exakten Input/Output-Types
 */

import type { IpcRendererEvent } from 'electron';

// === DATABASE IPC TYPES ===
export interface DatabaseAPI {
  load: () => Promise<Uint8Array | null>;
  save: (data: Uint8Array) => Promise<boolean>;
}

// === APP IPC TYPES ===
export interface AppAPI {
  restart: () => Promise<void>;
  getVersion: () => Promise<string>;
}

// === SHELL IPC TYPES ===
export interface ShellAPI {
  openExternal: (url: string) => Promise<void>;
}

// === LOGO IPC TYPES ===
export interface LogoUploadOptions {
  buffer: ArrayBuffer;
  fileName: string;
  mimeType: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface LogoProcessResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  format?: 'svg' | 'png' | 'jpg';
  width?: number;
  height?: number;
  fileSize?: number;
  error?: string;
}

export interface LogoMetadata {
  filePath: string;
  fileName: string;
  format: 'svg' | 'png' | 'jpg';
  width: number;
  height: number;
  fileSize: number;
  updatedAt: string;
}

export interface LogoAPI {
  upload: (options: LogoUploadOptions) => Promise<LogoProcessResult>;
  get: () => Promise<LogoMetadata | null>;
  delete: () => Promise<{ success: boolean; error?: string }>;
  getUrl: () => Promise<{ url: string; timestamp: number } | null>;
}

// === UPDATER IPC TYPES ===
export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
}

export interface UpdateCheckResult {
  success: boolean;
  updateInfo?: UpdateInfo;
  error?: string;
}

export interface UpdateDownloadResult {
  success: boolean;
  error?: string;
}

export interface UpdateInstallResult {
  success: boolean;
  error?: string;
}

export interface UpdateVersionResult {
  current: string;
  appName: string;
}

export interface UpdaterAPI {
  checkForUpdates: () => Promise<UpdateCheckResult>;
  startDownload: () => Promise<UpdateDownloadResult>;
  installAndRestart: () => Promise<UpdateInstallResult>;
  getVersion: () => Promise<UpdateVersionResult>;
  onUpdateMessage: (callback: (event: IpcRendererEvent, data: UpdateMessage) => void) => void;
  removeUpdateMessageListener: (callback: (event: IpcRendererEvent, data: UpdateMessage) => void) => void;
}

export interface UpdateMessage {
  type: 'checking-for-update' | 'update-available' | 'update-not-available' | 'download-progress' | 'update-downloaded' | 'update-error';
  data?: any;
}

// === PDF IPC TYPES ===
export interface PDFGenerateOptions {
  type: 'offer' | 'invoice' | 'timesheet';
  htmlContent: string;
  fileName: string;
  saveToPath?: string;
}

export interface PDFGenerateResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface PDFStatus {
  electronAvailable: boolean;
  ghostscriptAvailable: boolean;
  veraPDFAvailable: boolean;
  pdfa2bSupported: boolean;
}

export interface PDFAPI {
  generate: (options: PDFGenerateOptions) => Promise<PDFGenerateResult>;
  getStatus: () => Promise<PDFStatus>;
}

// === BACKUP IPC TYPES ===
export interface BackupCreateOptions {
  kind: 'pre-update' | 'manual' | 'post-download';
  description?: string;
  payloadMeta?: {
    version?: string;
    sizeEst?: number;
  };
}

export interface BackupCreateResult {
  success: boolean;
  backupId?: string;
  filePath?: string;
  size?: number;
  error?: string;
}

export interface BackupListResult {
  success: boolean;
  backups?: Array<{
    id: string;
    kind: string;
    filePath: string;
    size: number;
    createdAt: string;
    description: string;
    version: string;
  }>;
  error?: string;
}

export interface BackupPruneOptions {
  keep?: number;
  maxTotalMB?: number;
}

export interface BackupPruneResult {
  success: boolean;
  removedCount?: number;
  error?: string;
}

export interface BackupAPI {
  create: (options: BackupCreateOptions) => Promise<BackupCreateResult>;
  list: () => Promise<BackupListResult>;
  prune: (options: BackupPruneOptions) => Promise<BackupPruneResult>;
}

// === COMBINED IPC API INTERFACE ===
export interface RawaliteAPI {
  db: DatabaseAPI;
  app: AppAPI;
  shell: ShellAPI;
  updater: UpdaterAPI;
  backup: BackupAPI;
  logo: LogoAPI;
}

export interface ElectronAPI {
  pdf: PDFAPI;
}

// === IPC CHANNEL TYPES (für main.ts) ===
export type IPCChannels = 
  | 'db:load'
  | 'db:save'
  | 'app:restart'
  | 'app:getVersion'
  | 'shell:openExternal'
  | 'updater:check-for-updates'
  | 'updater:start-download'
  | 'updater:install-and-restart'
  | 'updater:get-version'
  | 'pdf:generate'
  | 'pdf:getStatus'
  | 'backup:create'
  | 'backup:list'
  | 'backup:prune'
  | 'logo:upload'
  | 'logo:get'
  | 'logo:delete'
  | 'logo:getUrl';

// === IPC HANDLER TYPE DEFINITIONS ===
export interface IPCHandlers {
  'db:load': () => Promise<Uint8Array | null>;
  'db:save': (data: Uint8Array) => Promise<boolean>;
  'app:restart': () => Promise<void>;
  'app:getVersion': () => Promise<string>;
  'shell:openExternal': (url: string) => Promise<void>;
  'updater:check-for-updates': () => Promise<UpdateCheckResult>;
  'updater:start-download': () => Promise<UpdateDownloadResult>;
  'updater:install-and-restart': () => Promise<UpdateInstallResult>;
  'updater:get-version': () => Promise<UpdateVersionResult>;
  'pdf:generate': (options: PDFGenerateOptions) => Promise<PDFGenerateResult>;
  'pdf:getStatus': () => Promise<PDFStatus>;
  'backup:create': (options: BackupCreateOptions) => Promise<BackupCreateResult>;
  'backup:list': () => Promise<BackupListResult>;
  'backup:prune': (options: BackupPruneOptions) => Promise<BackupPruneResult>;
  'logo:upload': (options: LogoUploadOptions) => Promise<LogoProcessResult>;
  'logo:get': () => Promise<LogoMetadata | null>;
  'logo:delete': () => Promise<{ success: boolean; error?: string }>;
  'logo:getUrl': () => Promise<{ url: string; timestamp: number } | null>;
}