/**
 * Update System Type Definitions für RawaLite
 * 
 * Zentrale Type-Definitionen für das Custom Update System
 * mit GitHub CLI Integration und User Consent Workflow.
 */

/**
 * GitHub Release Information (replicated to avoid circular imports)
 */
export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
  download_count: number;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
}

export interface GitHubCliError extends Error {
  code?: string;
  stderr?: string;
  exitCode?: number;
}

/**
 * Update Check Result
 */
export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  latestRelease?: GitHubRelease;
  error?: string;
}

/**
 * Update Information für User Display
 */
export interface UpdateInfo {
  version: string;
  name: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  assetName: string;
  fileSize: number;
  isPrerelease: boolean;
}

/**
 * Update Download Status
 */
export interface UpdateDownloadStatus {
  status: 'idle' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: DownloadProgress;
  error?: string;
  filePath?: string;
}

/**
 * Update Installation Status
 */
export interface UpdateInstallationStatus {
  status: 'idle' | 'verifying' | 'installing' | 'completed' | 'failed';
  error?: string;
  needsRestart?: boolean;
}

/**
 * Complete Update State für UI State Management
 */
export interface UpdateState {
  // Overall state
  currentPhase: UpdatePhase;
  
  // Check state
  checking: boolean;
  checkResult?: UpdateCheckResult;
  
  // Download state
  downloading: boolean;
  downloadStatus?: UpdateDownloadStatus;
  
  // Installation state
  installing: boolean;
  installationStatus?: UpdateInstallationStatus;
  
  // User interaction
  userConsentRequired: boolean;
  userConsentGiven: boolean;
  
  // Error handling
  lastError?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Update Workflow Phases
 */
export type UpdatePhase = 
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'user-consent'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'restart-required'
  | 'completed'
  | 'error';

/**
 * Update Configuration
 */
export interface UpdateConfig {
  // Check behavior
  autoCheckOnStartup: boolean;
  checkIntervalHours: number;
  
  // Download behavior
  autoDownload: boolean; // If false, requires user consent
  downloadDirectory?: string; // If not specified, uses temp
  
  // Installation behavior
  silentInstall: boolean;
  autoRestart: boolean; // If false, asks user
  
  // Error handling
  maxRetries: number;
  retryDelayMs: number;
  
  // GitHub settings
  includePreReleases: boolean;
  skipVersions: string[]; // Versions to skip
}

/**
 * Update Events für Event-driven UI Updates
 */
export type UpdateEvent = 
  | { type: 'check-started' }
  | { type: 'check-completed'; result: UpdateCheckResult }
  | { type: 'check-failed'; error: string }
  | { type: 'update-available'; updateInfo: UpdateInfo }
  | { type: 'download-started'; updateInfo: UpdateInfo }
  | { type: 'download-progress'; progress: DownloadProgress }
  | { type: 'download-completed'; filePath: string }
  | { type: 'download-failed'; error: string }
  | { type: 'verification-started' }
  | { type: 'verification-completed' }
  | { type: 'verification-failed'; error: string }
  | { type: 'installation-started' }
  | { type: 'installation-completed' }
  | { type: 'installation-failed'; error: string }
  | { type: 'restart-required' }
  | { type: 'user-consent-required'; updateInfo: UpdateInfo }
  | { type: 'user-consent-given' }
  | { type: 'user-consent-denied' }
  | { type: 'cancelled' }
  | { type: 'error'; error: string; phase: UpdatePhase };

/**
 * IPC API Surface for Renderer Process
 */
export interface UpdateIpcApi {
  // Check operations
  checkForUpdates(): Promise<UpdateCheckResult>;
  getCurrentVersion(): Promise<string>;
  
  // Download operations
  startDownload(updateInfo: UpdateInfo): Promise<string>; // Returns file path
  cancelDownload(): Promise<void>;
  
  // Installation operations
  installUpdate(filePath: string): Promise<void>;
  restartApp(): Promise<void>;
  
  // Configuration
  getUpdateConfig(): Promise<UpdateConfig>;
  setUpdateConfig(config: Partial<UpdateConfig>): Promise<void>;
  
  // Event subscription
  onUpdateEvent(listener: (event: UpdateEvent) => void): () => void;
  
  // Utility
  openDownloadFolder(): Promise<void>;
  verifyUpdateFile(filePath: string): Promise<boolean>;
}

/**
 * Error Types für bessere Error Handling
 */
export class UpdateError extends Error {
  constructor(
    message: string,
    public readonly code: UpdateErrorCode,
    public readonly phase: UpdatePhase,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'UpdateError';
  }
}

export type UpdateErrorCode =
  | 'GITHUB_CLI_NOT_AVAILABLE'
  | 'GITHUB_CLI_NOT_AUTHENTICATED'
  | 'NETWORK_ERROR'
  | 'NO_RELEASES_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'DOWNLOAD_CANCELLED'
  | 'VERIFICATION_FAILED'
  | 'INSTALLATION_FAILED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'DISK_FULL'
  | 'FILE_NOT_FOUND'
  | 'INVALID_INSTALLER'
  | 'USER_CANCELLED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * File Verification Result
 */
export interface FileVerificationResult {
  valid: boolean;
  expectedSize?: number;
  actualSize?: number;
  expectedHash?: string;
  actualHash?: string;
  error?: string;
}

/**
 * Installation Options
 */
export interface InstallationOptions {
  silent: boolean;
  restartAfter: boolean;
  installationDirectory?: string;
  additionalArgs?: string[];
}

/**
 * Update Statistics für Analytics
 */
export interface UpdateStatistics {
  lastCheckTime?: Date;
  lastUpdateTime?: Date;
  totalUpdatesInstalled: number;
  averageDownloadTime: number; // seconds
  failedUpdateAttempts: number;
  skipCount: number; // How many times user skipped an update
}

/**
 * Changelog Entry für Release Notes Display
 */
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'bugfix' | 'improvement' | 'breaking';
    description: string;
  }[];
}

/**
 * Helper type für Update Button States
 */
export type UpdateButtonState = 
  | 'check-for-updates'
  | 'checking'
  | 'download-update'
  | 'downloading'
  | 'install-update'
  | 'installing'
  | 'restart-required'
  | 'up-to-date'
  | 'error'
  | 'cancelled';

/**
 * Type Guards für Runtime Type Checking
 */
export function isUpdateError(error: unknown): error is UpdateError {
  return error instanceof UpdateError;
}

export function isValidUpdatePhase(phase: string): phase is UpdatePhase {
  const validPhases: UpdatePhase[] = [
    'idle', 'checking', 'update-available', 'user-consent',
    'downloading', 'verifying', 'installing', 'restart-required',
    'completed', 'error'
  ];
  return validPhases.includes(phase as UpdatePhase);
}

export function isValidUpdateEvent(event: unknown): event is UpdateEvent {
  return typeof event === 'object' && event !== null && 'type' in event;
}

/**
 * Default Configuration Values
 */
export const DEFAULT_UPDATE_CONFIG: UpdateConfig = {
  autoCheckOnStartup: true,
  checkIntervalHours: 24,
  autoDownload: false, // Requires user consent
  silentInstall: true,
  autoRestart: false, // Ask user
  maxRetries: 3,
  retryDelayMs: 5000,
  includePreReleases: false,
  skipVersions: []
};

/**
 * Constants
 */
export const UPDATE_CONSTANTS = {
  MAX_DOWNLOAD_SIZE: 200 * 1024 * 1024, // 200 MB
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes
  INSTALLATION_TIMEOUT: 120000, // 2 minutes
  VERIFICATION_TIMEOUT: 30000, // 30 seconds
  RETRY_BACKOFF_MULTIPLIER: 2,
  MIN_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000
} as const;