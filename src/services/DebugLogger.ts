/**
 * Comprehensive Debug Logger for RawaLite Update System
 * 
 * Tracks and logs every interaction, click, and process step
 * during the update flow for debugging purposes
 */

export interface DebugLogEntry {
  timestamp: string;
  type: 'CLICK' | 'API_CALL' | 'RESPONSE' | 'ERROR' | 'STATE_CHANGE' | 'FILE_OPERATION' | 'SYSTEM';
  component: string;
  action: string;
  data?: any;
  error?: string;
  metadata?: {
    userId?: string;
    sessionId: string;
    version: string;
    platform: string;
  };
}

export class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private maxLogs: number = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.log('SYSTEM', 'DebugLogger', 'initialized', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  private generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMetadata() {
    return {
      sessionId: this.sessionId,
      version: '1.0.11', // Will be updated dynamically
      platform: navigator.platform || 'unknown'
    };
  }

  public log(type: DebugLogEntry['type'], component: string, action: string, data?: any, error?: string) {
    if (!this.isEnabled) return;

    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      component,
      action,
      data: data ? this.sanitizeData(data) : undefined,
      error,
      metadata: this.getMetadata()
    };

    this.logs.push(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatting
    this.outputToConsole(entry);
  }

  private sanitizeData(data: any): any {
    try {
      // Remove sensitive information and ensure JSON serializable
      const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
        // Remove functions and undefined values
        if (typeof value === 'function' || value === undefined) {
          return '[Function/Undefined]';
        }
        // Truncate very long strings
        if (typeof value === 'string' && value.length > 500) {
          return value.substring(0, 500) + '...[truncated]';
        }
        return value;
      }));
      return sanitized;
    } catch (e) {
      return { error: 'Failed to sanitize data', original: String(data) };
    }
  }

  private outputToConsole(entry: DebugLogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = this.getLogPrefix(entry.type);
    
    console.groupCollapsed(`${prefix} [${timestamp}] ${entry.component}.${entry.action}`);
    
    if (entry.data) {
      console.log('📊 Data:', entry.data);
    }
    
    if (entry.error) {
      console.error('❌ Error:', entry.error);
    }
    
    console.log('🔍 Metadata:', entry.metadata);
    console.groupEnd();
  }

  private getLogPrefix(type: DebugLogEntry['type']): string {
    switch (type) {
      case 'CLICK': return '👆';
      case 'API_CALL': return '📡';
      case 'RESPONSE': return '📨';
      case 'ERROR': return '🚨';
      case 'STATE_CHANGE': return '🔄';
      case 'FILE_OPERATION': return '📁';
      case 'SYSTEM': return '⚙️';
      default: return '📝';
    }
  }

  // Specific logging methods for common operations
  public logClick(component: string, elementId: string, additionalData?: any) {
    this.log('CLICK', component, `clicked_${elementId}`, {
      elementId,
      ...additionalData
    });
  }

  public logApiCall(component: string, method: string, params?: any) {
    this.log('API_CALL', component, method, {
      method,
      params,
      timestamp: Date.now()
    });
  }

  public logApiResponse(component: string, method: string, response?: any, error?: string) {
    this.log('RESPONSE', component, `${method}_response`, {
      method,
      response,
      success: !error
    }, error);
  }

  public logStateChange(component: string, oldState: any, newState: any, trigger?: string) {
    this.log('STATE_CHANGE', component, 'state_changed', {
      oldState,
      newState,
      trigger,
      diff: this.getStateDiff(oldState, newState)
    });
  }

  public logError(component: string, action: string, error: Error | string, context?: any) {
    this.log('ERROR', component, action, {
      context,
      stack: error instanceof Error ? error.stack : undefined
    }, error instanceof Error ? error.message : String(error));
  }

  public logFileOperation(component: string, operation: string, filePath?: string, size?: number, result?: any) {
    this.log('FILE_OPERATION', component, operation, {
      filePath,
      size,
      result,
      timestamp: Date.now()
    });
  }

  private getStateDiff(oldState: any, newState: any): any {
    const diff: any = {};
    
    if (!oldState || !newState) {
      return { oldState, newState };
    }

    for (const key in newState) {
      if (oldState[key] !== newState[key]) {
        diff[key] = {
          old: oldState[key],
          new: newState[key]
        };
      }
    }

    return diff;
  }

  // Export functions for debugging
  public exportLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  public exportLogsAsText(): string {
    return this.logs.map(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();
      return `[${timestamp}] ${entry.type} ${entry.component}.${entry.action}${entry.error ? ` ERROR: ${entry.error}` : ''}${entry.data ? ` DATA: ${JSON.stringify(entry.data)}` : ''}`;
    }).join('\n');
  }

  public exportLogsAsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public clearLogs() {
    this.logs = [];
    this.log('SYSTEM', 'DebugLogger', 'logs_cleared');
  }

  public getSessionSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      timespan: {
        start: this.logs[0]?.timestamp,
        end: this.logs[this.logs.length - 1]?.timestamp
      },
      logTypes: {} as Record<string, number>,
      components: {} as Record<string, number>,
      errors: this.logs.filter(log => log.type === 'ERROR').length
    };

    // Count log types
    this.logs.forEach(log => {
      summary.logTypes[log.type] = (summary.logTypes[log.type] || 0) + 1;
      summary.components[log.component] = (summary.components[log.component] || 0) + 1;
    });

    return summary;
  }

  // Control methods
  public enable() {
    this.isEnabled = true;
    this.log('SYSTEM', 'DebugLogger', 'enabled');
  }

  public disable() {
    this.log('SYSTEM', 'DebugLogger', 'disabled');
    this.isEnabled = false;
  }

  public setMaxLogs(max: number) {
    this.maxLogs = max;
    this.log('SYSTEM', 'DebugLogger', 'max_logs_changed', { maxLogs: max });
  }
}

// Global instance
export const debugLogger = new DebugLogger();

// Helper functions for global access
export const logClick = (component: string, elementId: string, data?: any) => 
  debugLogger.logClick(component, elementId, data);

export const logApiCall = (component: string, method: string, params?: any) => 
  debugLogger.logApiCall(component, method, params);

export const logApiResponse = (component: string, method: string, response?: any, error?: string) => 
  debugLogger.logApiResponse(component, method, response, error);

export const logStateChange = (component: string, oldState: any, newState: any, trigger?: string) => 
  debugLogger.logStateChange(component, oldState, newState, trigger);

export const logError = (component: string, action: string, error: Error | string, context?: any) => 
  debugLogger.logError(component, action, error, context);

export const logFileOperation = (component: string, operation: string, filePath?: string, size?: number, result?: any) => 
  debugLogger.logFileOperation(component, operation, filePath, size, result);

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugLogger = debugLogger;
  console.log('🔧 DebugLogger available globally as window.debugLogger');
}