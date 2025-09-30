/**
 * 🗂️ Zentrale Pfadabstraktion - RawaLite
 * 
 * Single Source of Truth für alle System-Pfade.
 * Niemals direkt app.getPath() verwenden!
 * 
 * @version 1.0.0
 * @author RawaLite Team
 * @since Phase 2 - Code-Struktur & Pfad-Management
 */

// 🔧 Environment Detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

/**
 * 🔧 Path utilities - browser-safe implementations
 */
const pathUtils = {
  join: (...segments: string[]): string => {
    return segments
      .filter(segment => segment && segment.length > 0)
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/\\/g, '/');
  }
};

/**
 * 📁 Zentrale Pfad-Konfiguration
 * Alle Pfade der Anwendung werden hier definiert und verwaltet
 */
class PathManager {
  private static instance: PathManager;
  private _appDataPath: string | null = null;
  private _documentsPath: string | null = null;
  private _downloadsPath: string | null = null;

  private constructor() {
    // Singleton Pattern für konsistente Pfad-Verwaltung
  }

  static getInstance(): PathManager {
    if (!PathManager.instance) {
      PathManager.instance = new PathManager();
    }
    return PathManager.instance;
  }

  /**
   * 🔌 Electron API Integration
   * Sichere Verbindung zum Main Process für Pfad-Auflösung
   */
  private async getElectronPath(pathType: 'userData' | 'documents' | 'downloads'): Promise<string> {
    if (!isElectron) {
      throw new Error(`Electron API not available for path type: ${pathType}`);
    }

    try {
      // ✅ Sichere IPC-Kommunikation mit Main Process
      return await (window as any).rawalite.paths.get(pathType);
    } catch (error) {
      console.error(`Failed to get ${pathType} path via IPC:`, error);
      
      // 🔄 Fallback für Development/Testing
      if (isDevelopment || isTest) {
        throw new Error(`Development/Test fallback not supported in renderer process for ${pathType}`);
      }
      
      throw error;
    }
  }

  /**
   * 📊 App Data Directory (UserData)
   * Für Datenbank, Einstellungen, Logs
   */
  async getAppDataPath(): Promise<string> {
    if (this._appDataPath) return this._appDataPath;

    if (isTest) {
      // Test-spezifischer Pfad über IPC holen
      const cwd = await (window as any).rawalite.fs.getCwd();
      this._appDataPath = pathUtils.join(cwd, '.test-data');
      return this._appDataPath;
    }

    this._appDataPath = await this.getElectronPath('userData');
    return this._appDataPath;
  }

  /**
   * 📄 Documents Directory
   * Für Export-Dateien, Templates, Backups
   */
  async getDocumentsPath(): Promise<string> {
    if (this._documentsPath) return this._documentsPath;
    this._documentsPath = await this.getElectronPath('documents');
    return this._documentsPath;
  }

  /**
   * 💾 Downloads Directory
   * Für PDF-Exports, CSV-Dateien
   */
  async getDownloadsPath(): Promise<string> {
    if (this._downloadsPath) return this._downloadsPath;
    this._downloadsPath = await this.getElectronPath('downloads');
    return this._downloadsPath;
  }

  /**
   * 🔄 Reset cached paths (für Testing)
   */
  resetCache(): void {
    this._appDataPath = null;
    this._documentsPath = null;
    this._downloadsPath = null;
  }
}

/**
 * 🎯 Public Path API
 * Alle Module verwenden ausschließlich diese Konstanten
 */
export class PATHS {
  private static pathManager = PathManager.getInstance();

  // 🗄️ **Database & Core Data**
  static async DATABASE_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'database');
  }

  static async DATABASE_FILE(): Promise<string> {
    const dbDir = await this.DATABASE_DIR();
    return pathUtils.join(dbDir, 'rawalite.db');
  }

  static async DATABASE_BACKUP_FILE(): Promise<string> {
    const dbDir = await this.DATABASE_DIR();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return pathUtils.join(dbDir, 'backups', `backup-${timestamp}.db`);
  }

  // 📝 **Logging & Diagnostics**
  static async LOGS_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'logs');
  }

  static async LOG_FILE(): Promise<string> {
    const logsDir = await this.LOGS_DIR();
    const date = new Date().toISOString().split('T')[0];
    return pathUtils.join(logsDir, `rawalite-${date}.log`);
  }

  static async ERROR_LOG_FILE(): Promise<string> {
    const logsDir = await this.LOGS_DIR();
    return pathUtils.join(logsDir, 'errors.log');
  }

  // ⚙️ **Settings & Configuration**
  static async SETTINGS_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'settings');
  }

  static async SETTINGS_FILE(): Promise<string> {
    const settingsDir = await this.SETTINGS_DIR();
    return pathUtils.join(settingsDir, 'app-settings.json');
  }

  static async USER_PREFERENCES_FILE(): Promise<string> {
    const settingsDir = await this.SETTINGS_DIR();
    return pathUtils.join(settingsDir, 'user-preferences.json');
  }

  // 📄 **Templates & Resources**
  static async TEMPLATES_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'templates');
  }

  static async INVOICE_TEMPLATE_FILE(): Promise<string> {
    const templatesDir = await this.TEMPLATES_DIR();
    return pathUtils.join(templatesDir, 'invoice-template.html');
  }

  static async OFFER_TEMPLATE_FILE(): Promise<string> {
    const templatesDir = await this.TEMPLATES_DIR();
    return pathUtils.join(templatesDir, 'offer-template.html');
  }

  // 🔄 **Backups & Recovery**
  static async BACKUPS_DIR(): Promise<string> {
    const documents = await this.pathManager.getDocumentsPath();
    return pathUtils.join(documents, 'RawaLite-Backups');
  }

  static async FULL_BACKUP_FILE(): Promise<string> {
    const backupsDir = await this.BACKUPS_DIR();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return pathUtils.join(backupsDir, `rawalite-full-backup-${timestamp}.zip`);
  }

  static async DATA_EXPORT_FILE(entityType: string): Promise<string> {
    const backupsDir = await this.BACKUPS_DIR();
    const timestamp = new Date().toISOString().split('T')[0];
    return pathUtils.join(backupsDir, `${entityType}-export-${timestamp}.csv`);
  }

  // 📊 **Exports & Downloads**
  static async EXPORTS_DIR(): Promise<string> {
    const downloads = await this.pathManager.getDownloadsPath();
    return pathUtils.join(downloads, 'RawaLite-Exports');
  }

  static async PDF_EXPORT_FILE(documentType: string, number: string): Promise<string> {
    const exportsDir = await this.EXPORTS_DIR();
    const timestamp = new Date().toISOString().split('T')[0];
    return pathUtils.join(exportsDir, `${documentType}-${number}-${timestamp}.pdf`);
  }

  static async CSV_EXPORT_FILE(entityType: string): Promise<string> {
    const exportsDir = await this.EXPORTS_DIR();
    const timestamp = new Date().toISOString().split('T')[0];
    return pathUtils.join(exportsDir, `${entityType}-${timestamp}.csv`);
  }

  // 🖼️ **Assets & Media**
  static async ASSETS_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'assets');
  }

  static async COMPANY_LOGO_FILE(): Promise<string> {
    const assetsDir = await this.ASSETS_DIR();
    return pathUtils.join(assetsDir, 'company-logo.png');
  }

  static async USER_UPLOADS_DIR(): Promise<string> {
    const assetsDir = await this.ASSETS_DIR();
    return pathUtils.join(assetsDir, 'uploads');
  }

  // 🧪 **Testing & Development**
  static async TEST_DATA_DIR(): Promise<string> {
    if (!isTest) {
      throw new Error('TEST_DATA_DIR only available in test environment');
    }
    const cwd = await (window as any).rawalite.fs.getCwd();
    return pathUtils.join(cwd, '.test-data');
  }

  static async TEMP_DIR(): Promise<string> {
    const appData = await this.pathManager.getAppDataPath();
    return pathUtils.join(appData, 'temp');
  }

  // 🔧 **Utility Methods**
  
  /**
   * 📁 Ensure directory exists
   * Erstellt Verzeichnis falls nicht vorhanden (rekursiv)
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await (window as any).rawalite.fs.ensureDir(dirPath);
    } catch (error) {
      throw new Error(`Failed to create directory: ${dirPath} - ${error}`);
    }
  }

  /**
   * 🧹 Clean temp directory
   * Räumt temporäre Dateien auf (älter als 24h)
   */
  static async cleanTempDir(): Promise<void> {
    try {
      const tempDir = await this.TEMP_DIR();
      
      await this.ensureDir(tempDir);
      const files = await (window as any).rawalite.fs.readDir(tempDir);
      
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = pathUtils.join(tempDir, file);
        const stats = await (window as any).rawalite.fs.stat(filePath);
        
        if (stats.mtime < oneDayAgo) {
          await (window as any).rawalite.fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.warn('Failed to clean temp directory:', error);
    }
  }

  /**
   * 🔄 Reset path cache (für Testing)
   */
  static resetCache(): void {
    this.pathManager.resetCache();
  }

  /**
   * 📋 Get all configured paths (für Debugging)
   */
  static async getAllPaths(): Promise<Record<string, string>> {
    return {
      appData: await this.pathManager.getAppDataPath(),
      documents: await this.pathManager.getDocumentsPath(),
      downloads: await this.pathManager.getDownloadsPath(),
      database: await this.DATABASE_FILE(),
      logs: await this.LOGS_DIR(),
      backups: await this.BACKUPS_DIR(),
      exports: await this.EXPORTS_DIR(),
      templates: await this.TEMPLATES_DIR(),
      settings: await this.SETTINGS_DIR(),
      assets: await this.ASSETS_DIR()
    };
  }
}

/**
 * 🎯 Default Export für einfache Verwendung
 */
export default PATHS;

/**
 * 🧪 Testing Utilities
 */
export const PathsTestUtils = {
  /**
   * Setup test environment with isolated paths
   */
  async setupTestPaths(): Promise<void> {
    process.env.NODE_ENV = 'test';
    PATHS.resetCache();
    
    const testDataDir = await PATHS.TEST_DATA_DIR();
    await PATHS.ensureDir(testDataDir);
  },

  /**
   * Cleanup test environment
   */
  async cleanupTestPaths(): Promise<void> {
    if (!isTest) return;
    
    try {
      const testDataDir = await PATHS.TEST_DATA_DIR();
      // Note: rm mit recursive Option über IPC nicht verfügbar
      // Für Tests: Manuelles Cleanup oder erweiterte IPC-API
      console.warn('Test cleanup not implemented - requires extended IPC API');
    } catch (error) {
      console.warn('Failed to cleanup test paths:', error);
    }
  }
};

/**
 * 📚 Usage Examples:
 * 
 * ```typescript
 * // ✅ Correct usage
 * import PATHS from './lib/paths';
 * 
 * const dbPath = await PATHS.DATABASE_FILE();
 * const logPath = await PATHS.LOG_FILE();
 * 
 * // ❌ Never do this
 * import { app } from 'electron';
 * const badPath = app.getPath('userData'); // ❌ NO!
 * ```
 */