/**
 * Update Manager Service für RawaLite
 * 
 * Orchestriert den kompletten Update-Prozess:
 * - Version checking und comparison
 * - Download management mit progress tracking
 * - File verification (integrity checks)
 * - Installation coordination
 * - Error handling und retry logic
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { app } from 'electron';

import { githubApiService } from './GitHubApiService';
import type {
  UpdateCheckResult,
  UpdateInfo,
  UpdateState,
  UpdatePhase,
  UpdateEvent,
  UpdateConfig,
  UpdateError,
  FileVerificationResult,
  InstallationOptions,
  DownloadProgress
} from '../../types/update.types';
import { DEFAULT_UPDATE_CONFIG, UPDATE_CONSTANTS } from '../../types/update.types';

/**
 * Event Emitter für Update Events
 */
export class UpdateEventEmitter {
  private listeners: Map<string, Array<(event: UpdateEvent) => void>> = new Map();

  on(listener: (event: UpdateEvent) => void): () => void {
    const listenerId = Math.random().toString(36);
    if (!this.listeners.has('update')) {
      this.listeners.set('update', []);
    }
    this.listeners.get('update')!.push(listener);
    
    return () => {
      const listeners = this.listeners.get('update');
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  emit(event: UpdateEvent): void {
    const listeners = this.listeners.get('update') || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in update event listener:', error);
      }
    });
  }
}

/**
 * Update Manager Service - Zentrale Koordination aller Update-Operationen
 */
export class UpdateManagerService {
  private state: UpdateState;
  private config: UpdateConfig;
  private eventEmitter = new UpdateEventEmitter();
  private currentDownloadController: AbortController | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private currentCheckPromise: Promise<UpdateCheckResult> | null = null;

  constructor(config: Partial<UpdateConfig> = {}) {
    this.config = { ...DEFAULT_UPDATE_CONFIG, ...config };
    this.state = {
      currentPhase: 'idle',
      checking: false,
      downloading: false,
      installing: false,
      userConsentRequired: false,
      userConsentGiven: false,
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };
  }

  /**
   * Event Subscription für UI Updates
   */
  onUpdateEvent(listener: (event: UpdateEvent) => void): () => void {
    return this.eventEmitter.on(listener);
  }

  /**
   * Get Current State
   */
  getState(): UpdateState {
    return { ...this.state };
  }

  /**
   * Get Configuration
   */
  getConfig(): UpdateConfig {
    return { ...this.config };
  }

  /**
   * Update Configuration
   */
  setConfig(config: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check for Updates
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    // If already checking, return the current promise
    if (this.currentCheckPromise) {
      return this.currentCheckPromise;
    }

    // Start new check
    this.currentCheckPromise = this.performUpdateCheck();
    
    try {
      const result = await this.currentCheckPromise;
      return result;
    } finally {
      this.currentCheckPromise = null;
    }
  }

  private async performUpdateCheck(): Promise<UpdateCheckResult> {
    try {
      this.setState({ checking: true, currentPhase: 'checking' });
      this.emit({ type: 'check-started' });

      // Get current version
      const currentVersion = await this.getCurrentVersion();

      // Check for updates using new GitHub API service
      const updateCheck = await githubApiService.checkForUpdate(currentVersion);

      const result: UpdateCheckResult = {
        hasUpdate: updateCheck.hasUpdate,
        currentVersion: updateCheck.currentVersion,
        latestVersion: updateCheck.latestVersion,
        latestRelease: updateCheck.latestRelease
      };

      this.setState({ 
        checkResult: result,
        currentPhase: updateCheck.hasUpdate ? 'update-available' : 'idle'
      });

      this.emit({ type: 'check-completed', result });

      // If update available, prepare update info
      if (updateCheck.hasUpdate && updateCheck.latestRelease) {
        const updateInfo = this.createUpdateInfo(updateCheck.latestRelease);
        this.emit({ type: 'update-available', updateInfo });

        // Check if user consent is required
        if (!this.config.autoDownload) {
          this.setState({ 
            userConsentRequired: true,
            currentPhase: 'user-consent'
          });
          this.emit({ type: 'user-consent-required', updateInfo });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        currentPhase: 'error',
        lastError: errorMessage
      });
      this.emit({ type: 'check-failed', error: errorMessage });
      throw error;
    } finally {
      this.setState({ checking: false });
    }
  }

  /**
   * Start Update Download
   */
  async startDownload(updateInfo: UpdateInfo): Promise<string> {
    try {
      if (this.state.downloading) {
        throw new Error('Download already in progress');
      }

      this.setState({ 
        downloading: true, 
        currentPhase: 'downloading',
        userConsentGiven: true
      });

      this.emit({ type: 'download-started', updateInfo });

      // Prepare download directory
      const downloadDir = await this.prepareDownloadDirectory();
      const targetPath = join(downloadDir, updateInfo.assetName);

      // Create abort controller for cancellation
      this.currentDownloadController = new AbortController();

      // Find the setup asset from updateInfo
      const setupAsset = {
        name: updateInfo.assetName,
        browser_download_url: updateInfo.downloadUrl,
        size: updateInfo.fileSize,
        content_type: 'application/octet-stream',
        download_count: 0
      };

      // Download with progress tracking
      await githubApiService.downloadAsset(setupAsset, targetPath, (progress) => {
        this.emit({ type: 'download-progress', progress });
      });

      // Verify download
      this.setState({ currentPhase: 'verifying' });
      this.emit({ type: 'verification-started' });

      const verification = await this.verifyDownload(targetPath, setupAsset.size);
      if (!verification.valid) {
        throw new Error(`Download verification failed: ${verification.error}`);
      }

      this.emit({ type: 'verification-completed' });
      this.emit({ type: 'download-completed', filePath: targetPath });

      this.setState({ 
        currentPhase: 'completed',
        downloadStatus: {
          status: 'completed',
          filePath: targetPath
        }
      });

      return targetPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        currentPhase: 'error',
        lastError: errorMessage,
        downloadStatus: {
          status: 'failed',
          error: errorMessage
        }
      });
      this.emit({ type: 'download-failed', error: errorMessage });
      throw error;
    } finally {
      this.setState({ downloading: false });
      this.currentDownloadController = null;
    }
  }

  /**
   * Cancel Download
   */
  async cancelDownload(): Promise<void> {
    if (this.currentDownloadController) {
      this.currentDownloadController.abort();
    }

    this.setState({ 
      downloading: false,
      currentPhase: 'idle',
      downloadStatus: {
        status: 'cancelled'
      }
    });

    this.emit({ type: 'cancelled' });
  }

  /**
   * Install Update
   */
  async installUpdate(filePath: string, options: Partial<InstallationOptions> = {}): Promise<void> {
    try {
      if (this.state.installing) {
        throw new Error('Installation already in progress');
      }

      this.setState({ 
        installing: true,
        currentPhase: 'installing'
      });

      this.emit({ type: 'installation-started' });

      // Verify file exists and is valid
      const verification = await this.verifyInstaller(filePath);
      if (!verification.valid) {
        throw new Error(`Installer verification failed: ${verification.error}`);
      }

      // Install options
      const installOptions: InstallationOptions = {
        silent: this.config.silentInstall,
        restartAfter: this.config.autoRestart,
        ...options
      };

      // Run installation
      await this.runInstaller(filePath, installOptions);

      this.emit({ type: 'installation-completed' });

      if (installOptions.restartAfter) {
        this.emit({ type: 'restart-required' });
        this.setState({ currentPhase: 'restart-required' });
      } else {
        this.setState({ currentPhase: 'completed' });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        currentPhase: 'error',
        lastError: errorMessage,
        installationStatus: {
          status: 'failed',
          error: errorMessage
        }
      });
      this.emit({ type: 'installation-failed', error: errorMessage });
      throw error;
    } finally {
      this.setState({ installing: false });
    }
  }

  /**
   * Restart Application
   */
  async restartApplication(): Promise<void> {
    app.relaunch();
    app.exit(0);
  }

  /**
   * Grant User Consent
   */
  grantUserConsent(): void {
    this.setState({ 
      userConsentGiven: true,
      userConsentRequired: false,
      currentPhase: 'idle'
    });
    this.emit({ type: 'user-consent-given' });
  }

  /**
   * Deny User Consent
   */
  denyUserConsent(): void {
    this.setState({ 
      userConsentGiven: false,
      userConsentRequired: false,
      currentPhase: 'idle'
    });
    this.emit({ type: 'user-consent-denied' });
  }

  // Private helper methods

  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJsonPath = app.isPackaged
        ? join(app.getAppPath(), 'package.json')
        : join(process.cwd(), 'package.json');
      
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('Failed to get current version:', error);
      return '0.0.0';
    }
  }

  private createUpdateInfo(release: any): UpdateInfo {
    const asset = release.assets.find((a: any) => 
      a.name.includes('.exe') && a.name.includes('Setup')
    );

    return {
      version: release.tag_name.replace(/^v/, ''),
      name: release.name,
      releaseNotes: release.body,
      publishedAt: release.published_at,
      downloadUrl: asset?.browser_download_url || '',
      assetName: asset?.name || '',
      fileSize: asset?.size || 0,
      isPrerelease: release.prerelease
    };
  }

  private async prepareDownloadDirectory(): Promise<string> {
    const downloadDir = join(app.getPath('temp'), 'RawaLite-Updates');
    await fs.mkdir(downloadDir, { recursive: true });
    return downloadDir;
  }

  private async verifyDownload(filePath: string, expectedSize: number): Promise<FileVerificationResult> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size !== expectedSize) {
        return {
          valid: false,
          expectedSize,
          actualSize: stats.size,
          error: `File size mismatch: expected ${expectedSize}, got ${stats.size}`
        };
      }

      // Calculate file hash for additional verification
      const hash = await this.calculateFileHash(filePath);

      return {
        valid: true,
        expectedSize,
        actualSize: stats.size,
        actualHash: hash
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  private async verifyInstaller(filePath: string): Promise<FileVerificationResult> {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        return { valid: false, error: 'Not a file' };
      }

      if (stats.size === 0) {
        return { valid: false, error: 'File is empty' };
      }

      // Check if it's an executable
      if (!filePath.endsWith('.exe')) {
        return { valid: false, error: 'Not an executable file' };
      }

      return { valid: true, actualSize: stats.size };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'File verification failed'
      };
    }
  }

  private async runInstaller(filePath: string, options: InstallationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = [];

      if (options.silent) {
        args.push('/S', '/SILENT', '/VERYSILENT', '/SP-', '/SUPPRESSMSGBOXES');
      }

      if (options.additionalArgs) {
        args.push(...options.additionalArgs);
      }

      const process = spawn(filePath, args, {
        detached: false,
        stdio: 'pipe'
      });

      let stderr = '';

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation failed with exit code ${code}: ${stderr}`));
        }
      });

      process.on('error', reject);

      // Timeout for installation
      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('Installation timeout'));
      }, UPDATE_CONSTANTS.INSTALLATION_TIMEOUT);

      process.on('close', () => clearTimeout(timeout));
    });
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private setState(updates: Partial<UpdateState>): void {
    this.state = { ...this.state, ...updates };
  }

  private emit(event: UpdateEvent): void {
    this.eventEmitter.emit(event);
  }
}

/**
 * Singleton instance für globale Verwendung
 */
export const updateManagerService = new UpdateManagerService();