/**
 * AutoUpdateSecurityMonitor - Phase 4: Security & Monitoring Extensions
 * 
 * Überwacht die Sicherheit und Integrität des AutoUpdateService
 * Provides security validation, monitoring und threat detection
 */

import { EventEmitter } from 'events';

export interface SecurityAlert {
  type: 'security_validation_failed' | 'suspicious_download' | 'integrity_check_failed' | 'service_hijack_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: number;
  updateInfo?: any;
}

export interface SecurityStatus {
  overallLevel: 'secure' | 'warning' | 'compromised';
  lastValidation: number | null;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  alerts: SecurityAlert[];
}

/**
 * Security Monitor für AutoUpdateService
 */
export class AutoUpdateSecurityMonitor extends EventEmitter {
  private static instance: AutoUpdateSecurityMonitor | null = null;
  
  private securityStatus: SecurityStatus = {
    overallLevel: 'secure',
    lastValidation: null,
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    alerts: []
  };

  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): AutoUpdateSecurityMonitor {
    if (!AutoUpdateSecurityMonitor.instance) {
      AutoUpdateSecurityMonitor.instance = new AutoUpdateSecurityMonitor();
    }
    return AutoUpdateSecurityMonitor.instance;
  }

  /**
   * Start Security Monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('[SecurityMonitor] Starting security monitoring');
    this.isMonitoring = true;

    // Periodic security checks every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck();
    }, 5 * 60 * 1000);

    this.emit('monitoringStarted');
  }

  /**
   * Stop Security Monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('[SecurityMonitor] Stopping security monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Validate Update Security vor Download
   */
  public async validateUpdateSecurity(updateInfo: any): Promise<{ isValid: boolean; details: any }> {
    console.log('[SecurityMonitor] Validating update security for:', updateInfo?.tag_name);
    
    this.securityStatus.totalChecks++;
    this.securityStatus.lastValidation = Date.now();

    try {
      // Use IPC für security validation
      const securityCheck = await window.rawalite.updates.validateSecurity(updateInfo);
      
      if (securityCheck.isValid && securityCheck.recommendation === 'safe_to_download') {
        this.securityStatus.passedChecks++;
        this.updateOverallSecurityLevel();
        
        console.log('[SecurityMonitor] Security validation passed');
        return { isValid: true, details: securityCheck };
      } else {
        this.securityStatus.failedChecks++;
        
        // Create security alert
        const alert: SecurityAlert = {
          type: 'security_validation_failed',
          severity: 'high',
          message: `Security validation failed for update ${updateInfo?.tag_name}`,
          details: securityCheck,
          timestamp: Date.now(),
          updateInfo
        };
        
        this.addSecurityAlert(alert);
        return { isValid: false, details: securityCheck };
      }
    } catch (error) {
      this.securityStatus.failedChecks++;
      
      const alert: SecurityAlert = {
        type: 'security_validation_failed',
        severity: 'critical',
        message: `Security validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : error },
        timestamp: Date.now(),
        updateInfo
      };
      
      this.addSecurityAlert(alert);
      return { isValid: false, details: { error } };
    }
  }

  /**
   * Monitor Download Integrity
   */
  public async monitorDownloadIntegrity(updateInfo: any, downloadPath: string): Promise<boolean> {
    console.log('[SecurityMonitor] Monitoring download integrity for:', downloadPath);
    
    try {
      // File existence check
      const fileExists = await window.rawalite.updates.verifyUpdateFile(downloadPath);
      
      if (!fileExists) {
        const alert: SecurityAlert = {
          type: 'integrity_check_failed',
          severity: 'high',
          message: `Downloaded file not found: ${downloadPath}`,
          details: { downloadPath, updateInfo },
          timestamp: Date.now(),
          updateInfo
        };
        
        this.addSecurityAlert(alert);
        return false;
      }

      // TODO: Add checksum validation
      // TODO: Add virus scan integration
      
      console.log('[SecurityMonitor] Download integrity check passed');
      return true;
    } catch (error) {
      const alert: SecurityAlert = {
        type: 'integrity_check_failed',
        severity: 'critical',
        message: `Integrity check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error, downloadPath, updateInfo },
        timestamp: Date.now(),
        updateInfo
      };
      
      this.addSecurityAlert(alert);
      return false;
    }
  }

  /**
   * Get Current Security Status
   */
  public getSecurityStatus(): SecurityStatus {
    return { ...this.securityStatus };
  }

  /**
   * Clear Security Alerts
   */
  public clearAlerts(): void {
    this.securityStatus.alerts = [];
    this.updateOverallSecurityLevel();
    this.emit('alertsCleared');
  }

  /**
   * Periodic Security Check
   */
  private async performSecurityCheck(): Promise<void> {
    try {
      // Check service status via IPC
      const serviceStatus = await window.rawalite.updates.getServiceStatus();
      
      // Detect unusual service behavior
      if (serviceStatus.securityLevel !== 'secure') {
        const alert: SecurityAlert = {
          type: 'service_hijack_detected',
          severity: 'critical',
          message: `Service security level degraded: ${serviceStatus.securityLevel}`,
          details: serviceStatus,
          timestamp: Date.now()
        };
        
        this.addSecurityAlert(alert);
      }
      
    } catch (error) {
      console.error('[SecurityMonitor] Periodic security check failed:', error);
    }
  }

  /**
   * Add Security Alert
   */
  private addSecurityAlert(alert: SecurityAlert): void {
    this.securityStatus.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.securityStatus.alerts.length > 50) {
      this.securityStatus.alerts = this.securityStatus.alerts.slice(-50);
    }
    
    this.updateOverallSecurityLevel();
    this.emit('securityAlert', alert);
    
    console.warn('[SecurityMonitor] Security alert:', alert);
  }

  /**
   * Update Overall Security Level
   */
  private updateOverallSecurityLevel(): void {
    const recentAlerts = this.securityStatus.alerts.filter(
      alert => Date.now() - alert.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = recentAlerts.filter(alert => alert.severity === 'high');
    
    let newLevel: SecurityStatus['overallLevel'];
    
    if (criticalAlerts.length > 0) {
      newLevel = 'compromised';
    } else if (highAlerts.length > 2) {
      newLevel = 'warning';
    } else {
      newLevel = 'secure';
    }
    
    if (newLevel !== this.securityStatus.overallLevel) {
      const oldLevel = this.securityStatus.overallLevel;
      this.securityStatus.overallLevel = newLevel;
      
      this.emit('securityLevelChanged', { oldLevel, newLevel });
      console.log(`[SecurityMonitor] Security level changed: ${oldLevel} → ${newLevel}`);
    }
  }
}