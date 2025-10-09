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
import { app, dialog, shell } from 'electron';
import { createReadStream } from 'fs';

import { githubApiService } from './GitHubApiService';
import { mockProgressService } from './MockProgressService';
import UpdateHistoryService from './UpdateHistoryService';
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
 * Debug Logger für Main Process
 */
function debugLog(component: string, action: string, data?: any, error?: string) {
  const timestamp = new Date().toISOString();
  const prefix = error ? '🚨' : '🔍';
  
  console.log(`${prefix} [${timestamp}] ${component}.${action}`);
  if (data) {
    console.log('📊 Data:', JSON.stringify(data, null, 2));
  }
  if (error) {
    console.error('❌ Error:', error);
  }
}

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
  private historyService: UpdateHistoryService | null = null;

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
   * Initialisiert den Update History Service mit Database-Verbindung
   */
  initializeHistoryService(database: any): void {
    this.historyService = new UpdateHistoryService(database);
    debugLog('UpdateManagerService', 'initializeHistoryService', {
      sessionId: this.historyService.getCurrentSessionId()
    });
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
    const startTime = Date.now();
    const currentVersion = await this.getCurrentVersion();
    
    try {
      this.setState({ checking: true, currentPhase: 'checking' });
      this.emit({ type: 'check-started' });

      // Log check started
      this.historyService?.addEntry({
        event_type: 'check_started',
        current_version: currentVersion,
        user_action: 'manual' // TODO: Detect automatic vs manual
      });

      // ✅ DEVELOPMENT: Mock update detection for testing
      const isDev = !app.isPackaged;
      const isUpdateManagerDev = process.argv.includes('--update-manager-dev');
      
      let updateCheck;
      
      if (isDev && isUpdateManagerDev) {
        // Mock update for development testing
        debugLog('UpdateManagerService', 'using_mock_update_check', { reason: 'development_mode' });
        
        updateCheck = {
          hasUpdate: true,
          currentVersion: currentVersion,
          latestVersion: `${currentVersion}-MOCK`,
          latestRelease: {
            tag_name: `v${currentVersion}-MOCK`,
            name: 'Mock Update for Development Testing',
            body: '🛠️ **DEVELOPMENT MODE - MOCK UPDATE**\n\nThis is a simulated update for testing the UpdateManager progress display and download functionality.\n\n✅ Features:\n- Mock progress simulation\n- Realistic download speeds\n- Error handling testing\n- UI/UX validation',
            published_at: new Date().toISOString(),
            prerelease: false,
            assets: [{
              name: `RawaLite-Setup-${currentVersion}-MOCK.exe`,
              size: 52428800, // 50MB mock
              browser_download_url: 'https://mock.download.url/setup.exe',
              content_type: 'application/octet-stream',
              download_count: 0
            }]
          }
        };
        
        debugLog('UpdateManagerService', 'mock_update_available', { 
          mockVersion: updateCheck.latestVersion,
          mockSize: '50MB'
        });
      } else {
        // Real update check with GitHub API
        updateCheck = await githubApiService.checkForUpdate(currentVersion);
      }

      const result: UpdateCheckResult = {
        hasUpdate: updateCheck.hasUpdate,
        currentVersion: updateCheck.currentVersion,
        latestVersion: updateCheck.latestVersion,
        latestRelease: updateCheck.latestRelease
      };

      // Log successful check
      this.historyService?.addEntry({
        event_type: 'check_completed',
        current_version: currentVersion,
        target_version: updateCheck.latestVersion,
        success: true,
        duration_ms: Date.now() - startTime
      });

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
      
      // Log failed check
      this.historyService?.addEntry({
        event_type: 'check_failed',
        current_version: currentVersion,
        success: false,
        error_message: errorMessage,
        duration_ms: Date.now() - startTime
      });

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
    const startTime = Date.now();
    
    debugLog('UpdateManagerService', 'startDownload_begin', {
      updateInfo,
      currentState: this.state
    });
    
    try {
      if (this.state.downloading) {
        const error = 'Download already in progress';
        debugLog('UpdateManagerService', 'startDownload_error', { reason: 'already_downloading' }, error);
        throw new Error(error);
      }

      this.setState({ 
        downloading: true, 
        currentPhase: 'downloading',
        userConsentGiven: true,
        // ✅ SAFETY FIX: Initialize downloadStatus.progress for getCurrentProgress() API
        downloadStatus: {
          status: 'downloading',
          progress: {
            downloaded: 0,
            total: 0,
            percentage: 0,
            speed: 0,
            eta: 0
          }
        }
      });

      // Log download started
      this.historyService?.addEntry({
        event_type: 'download_started',
        current_version: await this.getCurrentVersion(),
        target_version: updateInfo.version,
        download_url: updateInfo.downloadUrl,
        file_size_bytes: updateInfo.fileSize,
        user_action: 'manual' // TODO: Detect automatic vs manual
      });

      debugLog('UpdateManagerService', 'state_updated', {
        newState: { downloading: true, currentPhase: 'downloading' }
      });

      this.emit({ type: 'download-started', updateInfo });

      // Prepare download directory
      debugLog('UpdateManagerService', 'prepare_download_dir');
      const downloadDir = await this.prepareDownloadDirectory();
      const targetPath = join(downloadDir, updateInfo.assetName);
      
      debugLog('UpdateManagerService', 'download_paths', {
        downloadDir,
        targetPath,
        assetName: updateInfo.assetName
      });

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
      
      debugLog('UpdateManagerService', 'setup_asset_prepared', { setupAsset });

      // ✅ DEVELOPMENT: Check for --update-manager-dev flag or development mode
      const isDev = !app.isPackaged;
      const isUpdateManagerDev = process.argv.includes('--update-manager-dev');
      
      if (isDev && isUpdateManagerDev) {
        debugLog('UpdateManagerService', 'using_mock_download', { reason: 'development_mode' });
        
        // Use Mock Progress Service for development - MUCH SLOWER for testing
        await mockProgressService.startMockDownload(50, 0.3, (progress) => { // ✅ 0.3 MB/s for ~3 minutes duration
          debugLog('UpdateManagerService', 'mock_download_progress', { progress });
          
          // ✅ Store progress in state for getCurrentProgress() API
          this.setState({
            downloadStatus: {
              ...this.state.downloadStatus,
              progress: progress,
              status: 'downloading'
            }
          });
          
          this.emit({ type: 'download-progress', progress });
        });
        
        // ✅ CREATE MOCK FILE: Create a dummy file for verification
        const fs = require('fs').promises;
        await fs.writeFile(targetPath, Buffer.alloc(setupAsset.size, 0)); // Create file with correct size
        
        debugLog('UpdateManagerService', 'mock_download_complete', { targetPath });
      } else {
        // Real download with GitHub API
        debugLog('UpdateManagerService', 'github_download_start', { asset: setupAsset, targetPath });
        await githubApiService.downloadAsset(setupAsset, targetPath, (progress) => {
          debugLog('UpdateManagerService', 'download_progress', { progress });
          
          // ✅ CRITICAL FIX: Store progress in state for getCurrentProgress() API
          this.setState({
            downloadStatus: {
              ...this.state.downloadStatus,
              progress: progress,
              status: 'downloading'
            }
          });
          
          this.emit({ type: 'download-progress', progress });
        });

        debugLog('UpdateManagerService', 'github_download_complete', { targetPath });
      }

      // Verify download
      this.setState({ currentPhase: 'verifying' });
      this.emit({ type: 'verification-started' });

      debugLog('UpdateManagerService', 'verification_start', {
        targetPath,
        expectedSize: setupAsset.size
      });
      
      const verification = await this.verifyDownload(targetPath, setupAsset.size);
      
      debugLog('UpdateManagerService', 'verification_result', { verification });
      
      if (!verification.valid) {
        const error = `Download verification failed: ${verification.error}`;
        debugLog('UpdateManagerService', 'verification_failed', { verification }, error);
        throw new Error(error);
      }

      this.emit({ type: 'verification-completed' });
      this.emit({ type: 'download-completed', filePath: targetPath });

      // Log successful download
      this.historyService?.addEntry({
        event_type: 'download_completed',
        current_version: await this.getCurrentVersion(),
        target_version: updateInfo.version,
        success: true,
        duration_ms: Date.now() - startTime
      });

      this.setState({ 
        currentPhase: 'completed',
        downloadStatus: {
          status: 'completed',
          filePath: targetPath
        }
      });

      debugLog('UpdateManagerService', 'download_success', { targetPath });
      return targetPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog('UpdateManagerService', 'download_error', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, errorMessage);
      
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
      debugLog('UpdateManagerService', 'startDownload_complete', {
        finalState: this.state
      });
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
    const startTime = Date.now();
    
    try {
      if (this.state.installing) {
        throw new Error('Installation already in progress');
      }

      this.setState({ 
        installing: true,
        currentPhase: 'installing'
      });

      this.emit({ type: 'installation-started' });

      // Log installation started
      this.historyService?.addEntry({
        event_type: 'install_started',
        current_version: await this.getCurrentVersion(),
        user_action: 'manual'
      });

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

      // Log successful installation
      this.historyService?.addEntry({
        event_type: 'install_completed',
        current_version: await this.getCurrentVersion(),
        success: true,
        duration_ms: Date.now() - startTime
      });

      if (installOptions.restartAfter) {
        this.emit({ type: 'restart-required' });
        this.setState({ currentPhase: 'restart-required' });
      } else {
        this.setState({ currentPhase: 'completed' });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed installation
      this.historyService?.addEntry({
        event_type: 'install_failed',
        current_version: await this.getCurrentVersion(),
        success: false,
        error_message: errorMessage,
        duration_ms: Date.now() - startTime
      });
      
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

  /**
   * Open Update Manager Window
   */
  async openManager(): Promise<void> {
    const { getOrCreateUpdateManagerWindow } = await import('../../../electron/windows/updateManager');
    getOrCreateUpdateManagerWindow();
  }

  // Private helper methods

  /**
   * Get Current Version (made public for IPC)
   */
  async getCurrentVersion(): Promise<string> {
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
    // 🔄 UNIVERSAL ASSET COMPATIBILITY: Support both old (v1.0.32) and new naming patterns
    const asset = release.assets.find((a: any) => 
      // Legacy pattern: RawaLite.Setup.1.0.32.exe (v1.0.32 and earlier)
      a.name.match(/RawaLite\.Setup\.\d+\.\d+\.\d+\.exe$/i) ||
      // Current pattern: RawaLite-Setup-1.0.35.exe (v1.0.34+)
      a.name.match(/RawaLite-Setup-\d+\.\d+\.\d+\.exe$/i) ||
      // Fallback patterns for any Setup.exe
      (a.name.includes('.exe') && a.name.includes('Setup')) ||
      a.name.match(/RawaLite.*Setup.*\.exe$/i)
    );

    // 🔄 BACKWARD COMPATIBILITY FIX: Graceful degradation instead of throwing
    // This allows older clients (v1.0.32) to handle missing assets gracefully
    if (!asset || !asset.browser_download_url) {
      debugLog('UpdateManagerService', 'createUpdateInfo_fallback', {
        releaseTag: release.tag_name,
        reason: 'backward_compatibility_v1032',
        availableAssets: release.assets?.map((a: any) => a.name) || [],
        fallbackAction: 'providing_empty_download_url'
      });
      
      // Return fallback UpdateInfo instead of throwing
      const version = release.tag_name.replace(/^v/, '');
      return {
        version: version,
        name: release.name || `Update ${release.tag_name}`,
        releaseNotes: release.body || `Update to version ${release.tag_name}

⚠️ Asset not yet available - build in progress.
Manual download: https://github.com/MonaFP/RawaLite/releases/tag/${release.tag_name}`,
        publishedAt: release.published_at || new Date().toISOString(),
        downloadUrl: `https://github.com/MonaFP/RawaLite/releases/download/v${version}/RawaLite-Setup-${version}.exe`, // v1.0.32 compatibility
        assetName: `RawaLite-Setup-${version}.exe`, // Corrected fallback name
        fileSize: 106080500, // Expected size fallback for v1.0.34
        isPrerelease: release.prerelease || false
      };
    }

    return {
      version: release.tag_name.replace(/^v/, ''),
      name: release.name,
      releaseNotes: release.body,
      publishedAt: release.published_at,
      downloadUrl: asset.browser_download_url,
      assetName: asset.name,
      fileSize: asset.size,
      isPrerelease: release.prerelease
    };
  }

  private async prepareDownloadDirectory(): Promise<string> {
    const downloadDir = join(app.getPath('temp'), 'RawaLite-Updates');
    await fs.mkdir(downloadDir, { recursive: true });
    return downloadDir;
  }

  private async verifyDownload(filePath: string, expectedSize: number): Promise<FileVerificationResult> {
    debugLog('UpdateManagerService', 'verifyDownload_start', {
      filePath,
      expectedSize,
      expectedSizeType: typeof expectedSize
    });
    
    try {
      debugLog('UpdateManagerService', 'file_stat_request', { filePath });
      
      // Wait for file system to flush WriteStream to disk
      // This prevents race condition between WriteStream.end() and fs.stat()
      await new Promise(resolve => setTimeout(resolve, 100));
      debugLog('UpdateManagerService', 'file_system_flush_delay_complete', { delayMs: 100 });
      
      const stats = await fs.stat(filePath);
      
      debugLog('UpdateManagerService', 'file_stat_result', {
        actualSize: stats.size,
        actualSizeType: typeof stats.size,
        expectedSize,
        expectedSizeType: typeof expectedSize,
        strictEqual: stats.size === expectedSize,
        looseEqual: stats.size == expectedSize,
        difference: stats.size - expectedSize
      });
      
      if (stats.size !== expectedSize) {
        const errorMsg = `File size mismatch: expected ${expectedSize}, got ${stats.size}`;
        debugLog('UpdateManagerService', 'verification_failed', {
          expectedSize,
          actualSize: stats.size,
          difference: stats.size - expectedSize
        }, errorMsg);
        
        return {
          valid: false,
          expectedSize,
          actualSize: stats.size,
          error: errorMsg
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
    console.log('🔍 [DEBUG] verifyInstaller - Checking file:', filePath);
    
    try {
      const stats = await fs.stat(filePath);
      console.log('🔍 [DEBUG] verifyInstaller - File stats:', {
        isFile: stats.isFile(),
        size: stats.size,
        path: filePath,
        endsWithExe: filePath.endsWith('.exe')
      });
      
      if (!stats.isFile()) {
        console.log('❌ [DEBUG] verifyInstaller - Not a file');
        return { valid: false, error: 'Not a file' };
      }

      if (stats.size === 0) {
        console.log('❌ [DEBUG] verifyInstaller - File is empty');
        return { valid: false, error: 'File is empty' };
      }

      // Check if it's an executable
      if (!filePath.endsWith('.exe')) {
        console.log('❌ [DEBUG] verifyInstaller - Not an .exe file:', filePath);
        return { valid: false, error: 'Not an executable file' };
      }

      console.log('✅ [DEBUG] verifyInstaller - File is valid');
      return { valid: true, actualSize: stats.size };
    } catch (error) {
      console.log('❌ [DEBUG] verifyInstaller - Error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'File verification failed'
      };
    }
  }

  private async runInstaller(filePath: string, options: InstallationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      debugLog('UpdateManagerService', 'runInstaller_start', {
        filePath,
        options,
        fileExists: require('fs').existsSync(filePath)
      });

      // Check if file exists before trying to run it
      if (!require('fs').existsSync(filePath)) {
        const error = `Installer file not found: ${filePath}`;
        debugLog('UpdateManagerService', 'runInstaller_file_not_found', { filePath }, error);
        reject(new Error(error));
        return;
      }

      const args: string[] = [];

      // For manual installation, DON'T use silent flags - show the installer GUI
      if (options.silent) {
        args.push('/S', '/SILENT', '/VERYSILENT', '/SP-', '/SUPPRESSMSGBOXES');
        debugLog('UpdateManagerService', 'runInstaller_silent_mode', { args });
      } else {
        debugLog('UpdateManagerService', 'runInstaller_gui_mode', { args });
      }

      if (options.additionalArgs) {
        args.push(...options.additionalArgs);
      }

      debugLog('UpdateManagerService', 'runInstaller_spawn', { filePath, args });

      // For GUI installation, detach the process and don't capture stdio
      const shouldDetach = !options.silent;
      
      const process = spawn(filePath, args, {
        detached: shouldDetach,
        stdio: shouldDetach ? 'ignore' : 'pipe'
      });

      // If detached (GUI mode), resolve immediately after spawn
      if (shouldDetach) {
        debugLog('UpdateManagerService', 'runInstaller_detached_mode', { 
          message: 'Process started in detached mode for GUI installation' 
        });
        resolve();
        return;
      }

      let stderr = '';

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        debugLog('UpdateManagerService', 'runInstaller_stderr', { stderr: data.toString() });
      });

      process.stdout?.on('data', (data: Buffer) => {
        debugLog('UpdateManagerService', 'runInstaller_stdout', { stdout: data.toString() });
      });

      process.on('close', (code) => {
        clearTimeout(timeout); // Cleanup timeout first
        debugLog('UpdateManagerService', 'runInstaller_close', { 
          exitCode: code, 
          stderr: stderr,
          success: code === 0
        });
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation failed with exit code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        debugLog('UpdateManagerService', 'runInstaller_error', { error: error.message }, error.message);
        reject(error);
      });

      // Timeout for installation (increased for manual installation)
      const timeoutMs = options.silent ? UPDATE_CONSTANTS.INSTALLATION_TIMEOUT : UPDATE_CONSTANTS.INSTALLATION_TIMEOUT * 3;
      const timeout = setTimeout(() => {
        debugLog('UpdateManagerService', 'runInstaller_timeout', { timeoutMs });
        process.kill();
        reject(new Error('Installation timeout'));
      }, timeoutMs);
    });
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data: string | Buffer) => hash.update(data));
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

  /**
   * Get current progress status for progress window
   */
  getCurrentProgress(): {
    percentage: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    status: 'idle' | 'downloading' | 'completed' | 'error';
  } | null {
    if (!this.state.downloadStatus || !this.state.downloadStatus.progress) {
      return {
        percentage: 0,
        downloaded: 0,
        total: 0,
        speed: 0,
        eta: 0,
        status: this.state.currentPhase === 'downloading' ? 'downloading' : 
                this.state.currentPhase === 'completed' ? 'completed' :
                this.state.currentPhase === 'error' ? 'error' : 'idle'
      };
    }

    const progress = this.state.downloadStatus.progress;
    return {
      percentage: progress.percentage,
      downloaded: progress.downloaded,
      total: progress.total,
      speed: progress.speed,
      eta: progress.eta,
      status: this.state.downloadStatus.status === 'completed' ? 'completed' :
              this.state.downloadStatus.status === 'failed' ? 'error' :
              this.state.downloading ? 'downloading' : 'idle'
    };
  }

  /**
   * Get current update info for progress window
   */
  getCurrentUpdateInfo(): {
    version: string;
    name: string;
    releaseNotes: string;
    publishedAt: string;
    downloadUrl: string;
    assetName: string;
    fileSize: number;
    isPrerelease: boolean;
  } | null {
    if (!this.state.checkResult || !this.state.checkResult.latestRelease) {
      return null;
    }

    const release = this.state.checkResult.latestRelease;
    // 🔄 UNIVERSAL ASSET COMPATIBILITY: Support both old (v1.0.32) and new naming patterns
    const asset = release.assets?.find((a: any) => 
      // Legacy pattern: RawaLite.Setup.1.0.32.exe (v1.0.32 and earlier)
      a.name.match(/RawaLite\.Setup\.\d+\.\d+\.\d+\.exe$/i) ||
      // Current pattern: RawaLite-Setup-1.0.35.exe (v1.0.34+)
      a.name.match(/RawaLite-Setup-\d+\.\d+\.\d+\.exe$/i) ||
      // Fallback patterns for any Setup.exe
      (a.name.includes('.exe') && a.name.includes('Setup'))
    ) || release.assets?.[0];

    // 🔄 BACKWARD COMPATIBILITY FIX: Graceful degradation for older clients (v1.0.32)
    // Instead of returning null (which breaks v1.0.32), provide fallback values
    if (!asset || !asset.browser_download_url) {
      debugLog('UpdateManagerService', 'getCurrentUpdateInfo_no_asset_fallback', { 
        releaseTag: release.tag_name,
        assetsFound: release.assets?.length || 0,
        assetNames: release.assets?.map((a: any) => a.name) || [],
        fallbackReason: 'backward_compatibility_v1032'
      });
      
      // Provide fallback data that older versions can handle
      const version = release.tag_name?.replace(/^v/, '') || this.state.checkResult.latestVersion || 'Unknown';
      return {
        version: version,
        name: release.name || `Update to ${release.tag_name}`,
        releaseNotes: release.body || 'No release notes available',
        publishedAt: release.published_at || new Date().toISOString(),
        downloadUrl: `https://github.com/MonaFP/RawaLite/releases/download/v${version}/RawaLite-Setup-${version}.exe`, // v1.0.32 compatibility
        assetName: `RawaLite-Setup-${version}.exe`, // Corrected fallback name
        fileSize: 106080500, // Expected size fallback for v1.0.34
        isPrerelease: release.prerelease || false
      };
    }

    return {
      version: release.tag_name || this.state.checkResult.latestVersion || 'Unknown',
      name: release.name || `Update to ${release.tag_name}`,
      releaseNotes: release.body || 'No release notes available',
      publishedAt: release.published_at || new Date().toISOString(),
      downloadUrl: asset.browser_download_url,
      assetName: asset.name,
      fileSize: asset.size,
      isPrerelease: release.prerelease || false
    };
  }
}

/**
 * Singleton instance für globale Verwendung
 */
export const updateManagerService = new UpdateManagerService();