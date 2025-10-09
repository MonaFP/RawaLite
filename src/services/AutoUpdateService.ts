import { EventEmitter } from 'events';
import type { AutoUpdatePreferences } from '../types/auto-update.types';
import type { UpdateCheckResult, UpdateInfo } from '../types/update.types';
import { AutoUpdateSecurityMonitor } from './AutoUpdateSecurityMonitor';

/**
 * AutoUpdateService - Phase 3: Background Logic & Silent Downloads
 * 
 * Renderer-Process Service für automatische Update-Checks, Background-Downloads 
 * und Benachrichtigungen basierend auf Benutzer-Präferenzen.
 * 
 * Features:
 * - Scheduled Background Checks (startup/daily/weekly) 
 * - Silent Downloads mit User Prompts
 * - Intelligente Benachrichtigungen
 * - IPC-Integration mit Main-Process UpdateManagerService
 */
export class AutoUpdateService extends EventEmitter {
  private static instance: AutoUpdateService | null = null;
  
  private preferences: AutoUpdatePreferences | null = null;
  private backgroundTimer: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;
  private isRunning: boolean = false;
  
  // Download State
  private currentDownload: {
    updateInfo: UpdateInfo;
    progress: number;
    status: 'downloading' | 'completed' | 'failed';
  } | null = null;

  // Phase 4: Security Monitor Integration
  private securityMonitor: AutoUpdateSecurityMonitor;

  private constructor() {
    super();
    this.securityMonitor = AutoUpdateSecurityMonitor.getInstance();
  }

  public static getInstance(): AutoUpdateService {
    if (!AutoUpdateService.instance) {
      AutoUpdateService.instance = new AutoUpdateService();
    }
    return AutoUpdateService.instance;
  }

  /**
   * Startet den AutoUpdateService mit gegebenen Preferences
   */
  public async start(preferences: AutoUpdatePreferences): Promise<void> {
    console.log('[AutoUpdateService] Starting with preferences:', preferences);
    
    this.preferences = preferences;
    this.isRunning = true;

    // Phase 4: Start Security Monitoring
    this.securityMonitor.startMonitoring();
    
    // Security Event Listeners
    this.securityMonitor.on('securityAlert', (alert) => {
      console.warn('[AutoUpdateService] Security alert received:', alert);
      this.emit('securityAlert', alert);
    });

    this.securityMonitor.on('securityLevelChanged', ({ oldLevel, newLevel }) => {
      console.log(`[AutoUpdateService] Security level changed: ${oldLevel} → ${newLevel}`);
      this.emit('securityLevelChanged', { oldLevel, newLevel });
    });

    if (!preferences.enabled) {
      console.log('[AutoUpdateService] Auto-updates disabled, stopping service');
      this.stop();
      return;
    }

    // Initial check für startup frequency
    if (preferences.checkFrequency === 'startup') {
      await this.performCheck();
    }

    // Schedule recurring checks
    this.scheduleNextCheck();
    
    this.emit('started', { preferences });
  }

  /**
   * Stoppt den AutoUpdateService
   */
  public stop(): void {
    console.log('[AutoUpdateService] Stopping service');
    
    this.isRunning = false;
    
    // Phase 4: Stop Security Monitoring
    this.securityMonitor.stopMonitoring();
    
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    
    this.emit('stopped');
  }

  /**
   * Update Preferences zur Laufzeit
   */
  public async updatePreferences(newPreferences: AutoUpdatePreferences): Promise<void> {
    console.log('[AutoUpdateService] Updating preferences:', newPreferences);
    
    const wasEnabled = this.preferences?.enabled ?? false;
    const isNowEnabled = newPreferences.enabled;
    
    this.preferences = newPreferences;
    
    if (!wasEnabled && isNowEnabled) {
      // Service wurde aktiviert
      await this.start(newPreferences);
    } else if (wasEnabled && !isNowEnabled) {
      // Service wurde deaktiviert
      this.stop();
    } else if (isNowEnabled) {
      // Preferences geändert, Service läuft weiter
      this.scheduleNextCheck();
    }
    
    this.emit('preferencesUpdated', { preferences: newPreferences });
  }

  /**
   * Manueller Update-Check (z.B. von UI ausgelöst)
   */
  public async performManualCheck(): Promise<UpdateCheckResult> {
    console.log('[AutoUpdateService] Performing manual check');
    
    try {
      const result = await window.rawalite.updates.checkForUpdates();
      this.lastCheckTime = new Date();
      
      this.emit('checkCompleted', { 
        result, 
        manual: true, 
        timestamp: this.lastCheckTime 
      });
      
      if (result.hasUpdate && this.preferences?.autoDownload) {
        await this.startSilentDownload(result.latestRelease);
      }
      
      return result;
    } catch (error) {
      console.error('[AutoUpdateService] Manual check failed:', error);
      
      const errorResult = {
        hasUpdate: false,
        currentVersion: await window.rawalite.updates.getCurrentVersion(),
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      };
      
      this.emit('checkFailed', { error, manual: true });
      return errorResult;
    }
  }

  /**
   * Automatischer Background Check
   */
  private async performCheck(): Promise<void> {
    if (!this.isRunning || !this.preferences?.enabled) {
      return;
    }

    console.log('[AutoUpdateService] Performing background check');
    
    try {
      const result = await window.rawalite.updates.checkForUpdates();
      this.lastCheckTime = new Date();
      
      this.emit('checkCompleted', { 
        result, 
        manual: false, 
        timestamp: this.lastCheckTime 
      });
      
      if (result.hasUpdate) {
        await this.handleUpdateAvailable(result.latestRelease);
      }
      
    } catch (error) {
      console.error('[AutoUpdateService] Background check failed:', error);
      this.emit('checkFailed', { error, manual: false });
    }
    
    // Schedule next check
    this.scheduleNextCheck();
  }

  /**
   * Handle verfügbare Updates basierend auf Preferences
   */
  private async handleUpdateAvailable(updateInfo: any): Promise<void> {
    console.log('[AutoUpdateService] Update available:', updateInfo?.tag_name);
    
    if (!this.preferences) return;
    
    // Emittiere Update-Available Event für UI
    this.emit('updateAvailable', { 
      updateInfo, 
      preferences: this.preferences 
    });
    
    // Auto-Download wenn aktiviert
    if (this.preferences.autoDownload) {
      await this.startSilentDownload(updateInfo);
    } else {
      // Zeige Benachrichtigung ohne Download
      this.emit('updateNotification', {
        type: 'updateAvailable',
        updateInfo,
        style: this.preferences.notificationStyle
      });
    }
  }

  /**
   * Startet Silent Download mit Security Validation
   */
  private async startSilentDownload(updateInfo: any): Promise<void> {
    if (this.currentDownload) {
      console.log('[AutoUpdateService] Download bereits aktiv, überspringe');
      return;
    }

    console.log('[AutoUpdateService] Starting silent download for:', updateInfo?.tag_name);
    
    // Phase 4: Security Validation vor Download
    const securityValidation = await this.securityMonitor.validateUpdateSecurity(updateInfo);
    
    if (!securityValidation.isValid) {
      console.warn('[AutoUpdateService] Security validation failed:', securityValidation.details);
      
      this.emit('downloadFailed', { 
        updateInfo, 
        error: 'Security validation failed',
        securityDetails: securityValidation.details
      });
      return;
    }
    
    console.log('[AutoUpdateService] Security validation passed:', securityValidation.details);
    
    this.currentDownload = {
      updateInfo,
      progress: 0,
      status: 'downloading'
    };
    
    this.emit('downloadStarted', { updateInfo });
    
    try {
      // Download via IPC mit verfügbarer startDownload Methode
      // Phase 4: Security-validated download
      const downloadPath = await window.rawalite.updates.startDownload(updateInfo);
      
      console.log('[AutoUpdateService] Download initiated, path:', downloadPath);
      
      // Download erfolgreich
      this.currentDownload.status = 'completed';
      
      // Phase 4: Post-Download Security Check
      const integrityCheck = await this.securityMonitor.monitorDownloadIntegrity(updateInfo, downloadPath);
      
      if (!integrityCheck) {
        console.warn('[AutoUpdateService] Download integrity check failed');
        
        this.emit('downloadFailed', { 
          updateInfo, 
          error: 'Download integrity check failed'
        });
        return;
      }
      
      this.emit('downloadCompleted', { 
        updateInfo,
        downloadPath,
        installPrompt: this.preferences?.installPrompt 
      });
      
      // Handle Installation basierend auf Preferences
      await this.handleDownloadCompleted(updateInfo);
      
    } catch (error) {
      console.error('[AutoUpdateService] Silent download failed:', error);
      
      if (this.currentDownload) {
        this.currentDownload.status = 'failed';
      }
      
      this.emit('downloadFailed', { 
        updateInfo, 
        error: error instanceof Error ? error.message : 'Download fehlgeschlagen' 
      });
    } finally {
      this.currentDownload = null;
    }
  }

  /**
   * Handle Download Completed basierend auf installPrompt preference
   */
  private async handleDownloadCompleted(updateInfo: any): Promise<void> {
    if (!this.preferences) return;
    
    switch (this.preferences.installPrompt) {
      case 'immediate':
        this.emit('updateNotification', {
          type: 'installReady',
          updateInfo,
          style: 'prominent',
          action: 'installNow'
        });
        break;
        
      case 'scheduled':
        this.emit('updateNotification', {
          type: 'installReady',
          updateInfo,
          style: this.preferences.notificationStyle,
          action: 'scheduleInstall'
        });
        break;
        
      case 'manual':
      default:
        this.emit('updateNotification', {
          type: 'installReady',
          updateInfo,
          style: this.preferences.notificationStyle,
          action: 'userChoice'
        });
        break;
    }
  }

  /**
   * Schedule next background check basierend auf checkFrequency
   */
  private scheduleNextCheck(): void {
    if (!this.preferences?.enabled || !this.isRunning) {
      return;
    }

    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
    }

    let intervalMs: number;
    
    switch (this.preferences.checkFrequency) {
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 24 Stunden
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 Tage
        break;
      case 'startup':
      default:
        // Kein recurring check für startup
        return;
    }

    console.log(`[AutoUpdateService] Next check scheduled in ${intervalMs / 1000 / 60} minutes`);
    
    this.backgroundTimer = setTimeout(() => {
      this.performCheck();
    }, intervalMs);
  }

  /**
   * Getter für aktuellen Status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      preferences: this.preferences,
      lastCheckTime: this.lastCheckTime,
      currentDownload: this.currentDownload ? {
        version: this.currentDownload.updateInfo.version,
        progress: this.currentDownload.progress,
        status: this.currentDownload.status
      } : null
    };
  }

  /**
   * Get Security Status für Monitoring
   */
  public getSecurityStatus() {
    return this.securityMonitor.getSecurityStatus();
  }

  /**
   * Clear Security Alerts
   */
  public clearSecurityAlerts(): void {
    this.securityMonitor.clearAlerts();
  }

  /**
   * Force check if enough time has passed (respects reminderInterval)
   */
  public shouldShowReminder(): boolean {
    if (!this.preferences?.enabled || !this.lastCheckTime) {
      return false;
    }

    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastCheckTime.getTime();
    const reminderInterval = this.preferences.reminderInterval * 60 * 60 * 1000; // Convert hours to ms

    return timeSinceLastCheck >= reminderInterval;
  }
}

export default AutoUpdateService;