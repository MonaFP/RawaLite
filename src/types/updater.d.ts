// Type definitions for custom updater system

declare global {
  interface Window {
    updater: {
      getVersion(): Promise<string>;
      check(): Promise<{
        hasUpdate: boolean;
        current: string;
        target?: {
          product: string;
          channel: string;
          version: string;
          releasedAt: string;
          notes: string;
          files: Array<{
            kind: 'nsis';
            arch: 'x64';
            name: string;
            size: number;
            sha512: string;
            url: string;
          }>;
        };
      }>;
      download(url: string): Promise<string>;
      install(exePath: string): Promise<void>;
      onProgress(callback: (progress: {
        percent: number;
        transferred: number;
        total: number;
        speed?: number;
        etaSec?: number;
      }) => void): () => void;
    };
  }
}

export {};