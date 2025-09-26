// src/types/updater.d.ts
// Custom Updater System Types

export interface UpdateManifest {
  product: string;
  channel: 'stable' | 'beta' | 'dev';
  version: string;
  releasedAt: string;
  notes: string;
  files: UpdateFile[];
}

export interface UpdateFile {
  kind: 'nsis' | 'portable' | 'appimage';
  arch: 'x64' | 'x86' | 'arm64';
  name: string;
  size: number;
  sha512?: string;
  url: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  speed: number;
  etaSec: number;
}

export interface UpdateStatus {
  status: string;
  message: string;
  progress?: number;
  error?: string;
}

export interface UpdateCheckResult {
  ok: boolean;
  hasUpdate?: boolean;
  current?: string;
  target?: UpdateManifest;
  error?: string;
}

export interface UpdateDownloadResult {
  ok: boolean;
  file?: string;
  size?: number;
  error?: string;
}

export interface UpdateInstallResult {
  ok: boolean;
  launcherStarted?: boolean;
  exitCode?: number;
  message?: string;
  output?: string;
  errorOutput?: string;
  error?: string;
}

export interface InstallCustomPayload {
  filePath: string;
  args?: string[];
  expectedSha256?: string;
  elevate?: boolean;
  unblock?: boolean;
  quitDelayMs?: number;
}

export interface InstallCustomResult {
  ok: boolean;
  launcherStarted?: boolean;
  exitCode?: number;
  message?: string;
  filePath?: string;
  runId?: string;
  output?: string;
  errorOutput?: string;
  error?: string;
}

export interface UpdateResultsCheckResult {
  ok: boolean;
  hasResults: boolean;
  results?: {
    success: boolean;
    timestamp: string;
    installerPath: string;
    wasAdmin: boolean;
    exitCode: number;
  };
  error?: string;
}