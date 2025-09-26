// src/global.d.ts
// Global Window Type Definitions

import type { 
  UpdateCheckResult, 
  UpdateDownloadResult, 
  UpdateInstallResult,
  InstallCustomResult,
  UpdateResultsCheckResult,
  UpdateProgress,
  UpdateStatus 
} from './types/updater';

declare global {
  interface Window {
    rawalite: {
      // Custom Updater API
      updater: {
        check: () => Promise<UpdateCheckResult>;
        download: (url?: string) => Promise<UpdateDownloadResult>;
        install: (exePath?: string) => Promise<UpdateInstallResult>;
        installCustom: (options: any) => Promise<InstallCustomResult>;
        checkResults: () => Promise<UpdateResultsCheckResult>;
        onProgress: (callback: (progress: UpdateProgress) => void) => () => void;
        offProgress: () => void;
        onStatus: (callback: (status: UpdateStatus) => void) => () => void;
        offStatus: () => void;
        onLauncherStarted: (callback: (data: any) => void) => () => void;
        onRestartRequired: (callback: (data: any) => void) => () => void;
        onInstallCompleted: (callback: (data: any) => void) => () => void;
        offLauncherEvents: () => void;
      };
      
      // Version API
      version: {
        get: () => Promise<{
          ok: boolean;
          app: string;
          electron: string;
          chrome: string;
        }>;
      };
      
      // App API
      app: {
        getVersion: () => Promise<string>;
        restart: () => Promise<void>;
        restartAfterUpdate: () => Promise<{ ok: boolean; message?: string }>;
        exportLogs: () => Promise<{
          success: boolean;
          filePath?: string;
          error?: string;
        }>;
      };
      
      // Database API
      db: {
        load: () => Promise<Uint8Array | null>;
        save: (data: Uint8Array) => Promise<boolean>;
      };
      
      // PDF API
      pdf: {
        generate: (options: any) => Promise<any>;
        getStatus: () => Promise<{
          electronAvailable: boolean;
          ghostscriptAvailable: boolean;
          veraPDFAvailable: boolean;
          pdfa2bSupported: boolean;
        }>;
      };
      
      // Backup API
      backup: {
        create: (options: any) => Promise<any>;
        list: () => Promise<any>;
        prune: (options: any) => Promise<any>;
      };
      
      // Logo API
      logo: {
        upload: (options: any) => Promise<any>;
        get: (filePath: string) => Promise<string | null>;
        getUrl: (filePath: string) => Promise<string | null>;
        delete: (filePath: string) => Promise<boolean>;
      };
    };
  }
}

export {};