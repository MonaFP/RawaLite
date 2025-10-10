/**
 * UpdateTelemetryService - Monitors and tracks update system operations
 * 
 * Purpose: Provides comprehensive telemetry for update operations including
 * success rates, error patterns, performance metrics, and operator monitoring.
 * 
 * Features:
 * - Operation tracking (check, download, install, verify)
 * - Error classification and frequency analysis
 * - Performance metrics and timing data
 * - Legacy v1.0.41 detection and monitoring
 * - Operator summary reports for maintenance
 * 
 * Design: Static service for global accessibility, thread-safe operation tracking,
 * configurable retention policies, and structured error categorization.
 * 
 * @since v1.0.41 - Added for enhanced update system reliability
 */

// Local debug logging for UpdateTelemetryService
function debugLog(component: string, action: string, data?: any, error?: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${component}::${action}`;
  
  if (error) {
    console.error(`❌ ${logMessage}`, data || {}, error);
  } else {
    console.log(`📊 ${logMessage}`, data || {});
  }
}

export interface TelemetryOperation {
  id: string;
  type: 'update-check' | 'download' | 'install' | 'verify' | 'legacy-fallback';
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface TelemetrySummary {
  totalOperations: number;
  successRate: number;
  errorPatterns: Record<string, number>;
  averageDuration: number;
  legacyModeUsage: number;
  lastWeekActivity: number;
}

/**
 * Static telemetry service for update operation monitoring
 */
export class UpdateTelemetryService {
  private static operations: Map<string, TelemetryOperation> = new Map();
  private static completedOperations: TelemetryOperation[] = [];
  private static readonly MAX_COMPLETED_OPERATIONS = 1000; // Configurable retention
  
  /**
   * Start tracking an update operation
   */
  static startOperation(type: TelemetryOperation['type'], metadata?: Record<string, any>): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: TelemetryOperation = {
      id,
      type,
      startTime: Date.now(),
      metadata
    };
    
    this.operations.set(id, operation);
    
    debugLog('UpdateTelemetryService', 'operation_started', {
      operationId: id,
      type,
      metadata
    });
    
    return id;
  }
  
  /**
   * End tracking an update operation
   */
  static endOperation(
    typeOrId: string, 
    success: boolean, 
    error?: Error, 
    additionalMetadata?: Record<string, any>
  ): void {
    let operation: TelemetryOperation | undefined;
    
    // Support both operation ID and operation type for backwards compatibility
    if (this.operations.has(typeOrId)) {
      // Direct ID lookup
      operation = this.operations.get(typeOrId);
    } else {
      // Find by type (use most recent)
      const operationsByType = Array.from(this.operations.values())
        .filter(op => op.type === typeOrId)
        .sort((a, b) => b.startTime - a.startTime);
      
      operation = operationsByType[0];
    }
    
    if (!operation) {
      debugLog('UpdateTelemetryService', 'operation_not_found', {
        typeOrId,
        availableOperations: Array.from(this.operations.keys())
      });
      return;
    }
    
    // Complete the operation
    operation.endTime = Date.now();
    operation.success = success;
    operation.error = error;
    
    if (additionalMetadata) {
      operation.metadata = { ...operation.metadata, ...additionalMetadata };
    }
    
    // Move to completed operations
    this.completedOperations.push({ ...operation });
    this.operations.delete(operation.id);
    
    // Maintain retention policy
    if (this.completedOperations.length > this.MAX_COMPLETED_OPERATIONS) {
      this.completedOperations.splice(0, this.completedOperations.length - this.MAX_COMPLETED_OPERATIONS);
    }
    
    debugLog('UpdateTelemetryService', 'operation_completed', {
      operationId: operation.id,
      type: operation.type,
      success,
      duration: operation.endTime - operation.startTime,
      error: error?.message,
      metadata: operation.metadata
    });
  }
  
  /**
   * Extract error code from common update errors for classification
   */
  static extractErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    // GitHub API errors
    if (message.includes('e_redirect_html')) return 'E_REDIRECT_HTML';
    if (message.includes('e_no_mz')) return 'E_NO_MZ';
    if (message.includes('rate limit')) return 'E_RATE_LIMIT';
    if (message.includes('not found') || message.includes('404')) return 'E_NOT_FOUND';
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) return 'E_NETWORK';
    if (message.includes('timeout')) return 'E_TIMEOUT';
    if (message.includes('connection')) return 'E_CONNECTION';
    
    // File system errors
    if (message.includes('permission') || message.includes('access')) return 'E_PERMISSION';
    if (message.includes('disk space') || message.includes('enospc')) return 'E_DISK_SPACE';
    if (message.includes('corrupted') || message.includes('checksum')) return 'E_CORRUPTION';
    
    // Update-specific errors
    if (message.includes('already downloading')) return 'E_ALREADY_DOWNLOADING';
    if (message.includes('user cancelled')) return 'E_USER_CANCELLED';
    if (message.includes('invalid installer')) return 'E_INVALID_INSTALLER';
    
    return 'E_UNKNOWN';
  }
  
  /**
   * Generate operator summary for maintenance and monitoring
   */
  static generateOperatorSummary(): TelemetrySummary {
    const allOps = [...this.completedOperations];
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentOps = allOps.filter(op => op.startTime > oneWeekAgo);
    
    const successfulOps = allOps.filter(op => op.success === true);
    const successRate = allOps.length > 0 ? (successfulOps.length / allOps.length) * 100 : 0;
    
    // Error pattern analysis
    const errorPatterns: Record<string, number> = {};
    allOps.filter(op => op.error).forEach(op => {
      const errorCode = this.extractErrorCode(op.error!);
      errorPatterns[errorCode] = (errorPatterns[errorCode] || 0) + 1;
    });
    
    // Average duration calculation
    const completedOpsWithDuration = allOps.filter(op => op.endTime);
    const totalDuration = completedOpsWithDuration.reduce((sum, op) => sum + (op.endTime! - op.startTime), 0);
    const averageDuration = completedOpsWithDuration.length > 0 ? totalDuration / completedOpsWithDuration.length : 0;
    
    // Legacy mode usage detection
    const legacyOperations = allOps.filter(op => 
      op.type === 'legacy-fallback' || 
      op.metadata?.isLegacyMode === true ||
      op.metadata?.version === 'v1.0.41'
    );
    
    return {
      totalOperations: allOps.length,
      successRate: Math.round(successRate * 100) / 100,
      errorPatterns,
      averageDuration: Math.round(averageDuration),
      legacyModeUsage: legacyOperations.length,
      lastWeekActivity: recentOps.length
    };
  }
  
  /**
   * Get current active operations (for debugging)
   */
  static getActiveOperations(): TelemetryOperation[] {
    return Array.from(this.operations.values());
  }
  
  /**
   * Get recent completed operations (for debugging)
   */
  static getRecentOperations(limit: number = 50): TelemetryOperation[] {
    return this.completedOperations
      .slice(-limit)
      .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));
  }
  
  /**
   * Clear telemetry data (for testing/maintenance)
   */
  static clearData(): void {
    this.operations.clear();
    this.completedOperations.length = 0;
    debugLog('UpdateTelemetryService', 'data_cleared', {});
  }
}