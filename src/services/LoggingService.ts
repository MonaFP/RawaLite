import PATHS from '../lib/paths';

export class LoggingService {
  // 📝 Robustes Logging mit zentraler Pfadabstraktion (Phase 2)
  static async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      // Console ausgabe für Development
      console.log(logEntry);
      
      // TODO: Implement file logging when Electron file API available
      const logFile = await PATHS.LOG_FILE();
      const logsDir = await PATHS.LOGS_DIR();
      await PATHS.ensureDir(logsDir);
      
      // Rotiere Logs bei 1MB (TODO: Implementierung)
      console.log(`📝 Log würde geschrieben nach: ${logFile}`);
      
    } catch (error) {
      // Fallback: nur console logging wenn Pfad-System fehlt
      console.error('Logging service failed:', error);
      console.log(message);
    }
  }

  static async logError(error: Error | string, context?: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    await this.log(fullMessage, 'error');
    
    // Additional error logging to separate file
    try {
      const errorLogFile = await PATHS.ERROR_LOG_FILE();
      console.log(`🚨 Error würde geloggt nach: ${errorLogFile}`);
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  }
}