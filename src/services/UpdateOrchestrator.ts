/**
 * 🔄 RawaLite Update Orchestrator
 * 
 * Orchestriert electron-updater mit Custom Hooks:
 * - Pre-Update: Backup & Migration-Vorbereitung
 * - During Update: Progress & Status Management  
 * - Post-Update: Database Migration & Validation
 * 
 * PATTERN: Ein Transport (electron-updater), eine State-Machine, Custom Hooks
 */

import { MigrationService, BackupMetadata } from './MigrationService';
import { backupService } from './BackupService';
import { LoggingService } from './LoggingService';

export interface UpdateState {
  phase: 'idle' | 'checking' | 'available' | 'preparing' | 'downloading' | 'downloaded' | 'installing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
  updateInfo?: any;
}

export interface UpdateHooks {
  onStateChange?: (state: UpdateState) => void;
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: string) => void;
}

export class UpdateOrchestrator {
  private migrationService: MigrationService;
  private hooks: UpdateHooks = {};
  private currentState: UpdateState = {
    phase: 'idle',
    progress: 0,
    message: 'Ready'
  };

  constructor() {
    this.migrationService = new MigrationService();
    this.initializeEventListeners();
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = data ? `[UpdateOrchestrator ${level.toUpperCase()}] ${message} - ${JSON.stringify(data)}` : `[UpdateOrchestrator ${level.toUpperCase()}] ${message}`;
    LoggingService.log(logMessage);
  }

  /**
   * Registriert Event-Hooks für Update-Lifecycle
   */
  public registerHooks(hooks: UpdateHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Initialisiert electron-updater Event-Listener
   */
  private initializeEventListeners(): void {
    if (!window.rawalite?.updater) {
      this.log('warn', 'electron-updater not available - running in dev mode?');
      return;
    }

    // Bind to electron-updater events via IPC
    this.setupElectronUpdaterEvents();
  }

  /**
   * Event-Handler für electron-updater Events
   */
  private setupElectronUpdaterEvents(): void {
    // NOTE: Events werden vom Main-Process über IPC gesendet
    // Hier implementieren wir die State-Machine Logik
  }

  /**
   * Startet Update-Check mit Pre-Update-Hooks
   */
  public async checkForUpdates(): Promise<UpdateState> {
    try {
      this.updateState('checking', 0, 'Prüfe auf Updates...');

      if (!window.rawalite?.updater) {
        throw new Error('Update-System nicht verfügbar (Dev-Mode?)');
      }

      const result = await window.rawalite.updater.checkForUpdates();
      
      if (!result.success) {
        throw new Error(result.error || 'Update-Prüfung fehlgeschlagen');
      }

      if (result.updateInfo) {
        this.updateState('available', 25, 'Update verfügbar - bereite vor...');
        await this.executePreUpdateHooks(result.updateInfo);
        this.updateState('available', 50, 'Update bereit zum Download');
        return { ...this.currentState, updateInfo: result.updateInfo };
      } else {
        this.updateState('idle', 100, 'App ist auf dem neuesten Stand');
        return this.currentState;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      this.updateState('error', 0, 'Fehler beim Update-Check', errorMessage);
      return this.currentState;
    }
  }

  /**
   * Startet Download mit Progress-Hooks
   */
  public async startDownload(): Promise<UpdateState> {
    try {
      this.updateState('downloading', 0, 'Starte Download...');

      if (!window.rawalite?.updater) {
        throw new Error('Update-System nicht verfügbar');
      }

      const result = await window.rawalite.updater.startDownload();
      
      if (!result.success) {
        throw new Error(result.error || 'Download fehlgeschlagen');
      }

      // Progress wird über Events vom Main-Process gemeldet
      return this.currentState;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      this.updateState('error', 0, 'Fehler beim Download', errorMessage);
      return this.currentState;
    }
  }

  /**
   * Installiert Update mit Post-Update-Hooks
   */
  public async installAndRestart(): Promise<UpdateState> {
    try {
      this.updateState('installing', 90, 'Bereite Installation vor...');
      
      // Post-Update-Hooks werden nach Neustart ausgeführt
      await this.schedulePostUpdateHooks();
      
      this.updateState('installing', 100, 'Starte Neustart...');

      if (!window.rawalite?.updater) {
        throw new Error('Update-System nicht verfügbar');
      }

      const result = await window.rawalite.updater.installAndRestart();
      
      if (!result.success) {
        throw new Error(result.error || 'Installation fehlgeschlagen');
      }

      return this.currentState;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      this.updateState('error', 0, 'Fehler bei Installation', errorMessage);
      return this.currentState;
    }
  }

  /**
   * PRE-UPDATE HOOKS: Backup & Migration-Vorbereitung
   */
  private async executePreUpdateHooks(updateInfo: any): Promise<void> {
    try {
      this.log('info', 'Executing pre-update hooks', { updateInfo });

      // 1. Erstelle Backup vor Update
      this.updateState('preparing', 10, 'Erstelle Backup...');
      const backupResult = await backupService.create({
        kind: 'pre-update',
        description: `Backup vor Update auf ${updateInfo.version}`,
        payloadMeta: {
          version: updateInfo.version
        }
      });
      
      if (!backupResult.success) {
        throw new Error(`Backup fehlgeschlagen: ${backupResult.error}`);
      }

      // 2. Bereite Migration vor (falls nötig)
      this.updateState('preparing', 30, 'Prüfe Migrationen...');
      // Migration wird automatisch beim App-Start nach Update ausgeführt
      this.log('info', 'Migration wird nach Update-Neustart automatisch ausgeführt', { 
        targetVersion: updateInfo.version 
      });

      this.log('info', 'Pre-update hooks completed successfully');

    } catch (error) {
      this.log('error', 'Pre-update hooks failed', { error });
      throw error;
    }
  }

  /**
   * POST-UPDATE HOOKS: Database Migration nach Neustart
   */
  private async schedulePostUpdateHooks(): Promise<void> {
    try {
      // Migration wird automatisch vom MigrationInitializer ausgeführt
      // Hier nur Logging für Traceability
      this.log('info', 'Post-update migrations will be handled by MigrationInitializer on restart');

    } catch (error) {
      this.log('error', 'Failed to schedule post-update hooks', { error });
      throw error;
    }
  }

  /**
   * Updates State und benachrichtigt Hooks
   */
  private updateState(
    phase: UpdateState['phase'],
    progress: number,
    message: string,
    error?: string
  ): void {
    this.currentState = {
      phase,
      progress,
      message,
      error,
      updateInfo: this.currentState.updateInfo
    };

    this.log('info', `State updated: ${phase} - ${progress}% - ${message}`, { error });

    // Notify hooks
    if (this.hooks.onStateChange) {
      this.hooks.onStateChange(this.currentState);
    }

    if (this.hooks.onProgress) {
      this.hooks.onProgress(progress, message);
    }

    if (error && this.hooks.onError) {
      this.hooks.onError(error);
    }
  }

  /**
   * Event-Handler für Download-Progress
   */
  public handleDownloadProgress(progressPercent: number, bytesPerSecond: number, transferred: number, total: number): void {
    const message = `Download läuft... ${Math.round(progressPercent)}% (${Math.round(bytesPerSecond / 1024)} KB/s)`;
    this.updateState('downloading', Math.round(progressPercent), message);
  }

  /**
   * Event-Handler für Download-Complete
   */
  public handleDownloadComplete(): void {
    this.updateState('downloaded', 100, 'Download abgeschlossen - bereit zur Installation');
  }

  /**
   * Event-Handler für Update-Errors
   */
  public handleUpdateError(error: string): void {
    this.updateState('error', 0, 'Update fehlgeschlagen', error);
  }

  /**
   * Aktueller State
   */
  public getCurrentState(): UpdateState {
    return { ...this.currentState };
  }

  /**
   * Reset zu Idle-State
   */
  public reset(): void {
    this.updateState('idle', 0, 'Ready');
  }
}