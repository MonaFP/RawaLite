import PATHS from '../lib/paths';

export class LoggingService {
  // 📝 Robustes Logging mit zentraler Pfadabstraktion (Phase 2)
  static async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      // Console ausgabe für Development
      console.log(logEntry);
      
      // File logging über IPC
      try {
        const logFile = await PATHS.LOG_FILE();
        const logsDir = await PATHS.LOGS_DIR();
        await PATHS.ensureDir(logsDir);
        
        // Write log entry via IPC
        await (window as any).rawalite.fs.appendFile(logFile, logEntry + '\n');
      } catch (fileError) {
        console.warn('File logging failed, console only:', fileError);
      }
    } catch (error) {
      console.error('Logging failed:', error);
    }
  }

  static async logError(error: Error | string, context?: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    await this.log(fullMessage, 'error');
    
    // Additional error logging to separate file
    try {
      const errorLogFile = await PATHS.ERROR_LOG_FILE();
      const logsDir = await PATHS.LOGS_DIR();
      await PATHS.ensureDir(logsDir);
      
      const timestamp = new Date().toISOString();
      const errorEntry = `[${timestamp}] ERROR: ${fullMessage}\n`;
      
      await (window as any).rawalite.fs.appendFile(errorLogFile, errorEntry);
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  }
}