/**
 * 📋 Version Information Service - RawaLite
 * 
 * Zentraler Service für Versionsinformationen in der App.
 * Lädt Version aus package.json und stellt Build-Informationen bereit.
 * 
 * @since Phase 2 - Versionssync-Mechanismus  
 */

import packageJson from '../../package.json';

export interface AppVersion {
  version: string;
  name: string;
  buildDate: string;
  buildEnvironment: 'development' | 'production' | 'test';
  gitCommit?: string;
  gitBranch?: string;
}

export interface SystemInfo {
  platform: string;
  userAgent: string;
  electronVersion?: string;
  nodeVersion?: string;
  chromeVersion?: string;
}

export class VersionService {
  
  /**
   * 📦 App-Versionsinformationen abrufen
   */
  static getAppVersion(): AppVersion {
    // Use Vite environment variables instead of process.env
    const isDevelopment = import.meta.env.DEV;
    const isTest = import.meta.env.MODE === 'test';
    
    let buildEnvironment: AppVersion['buildEnvironment'] = 'production';
    if (isDevelopment) buildEnvironment = 'development';
    if (isTest) buildEnvironment = 'test';
    
    return {
      version: packageJson.version,
      name: packageJson.name,
      buildDate: new Date().toISOString(),
      buildEnvironment,
      // TODO: Git-Informationen aus Build-Process hinzufügen
      gitCommit: import.meta.env.VITE_GIT_COMMIT || undefined,
      gitBranch: import.meta.env.VITE_GIT_BRANCH || undefined
    };
  }
  
  /**
   * 🖥️ System-Informationen sammeln
   */
  static getSystemInfo(): SystemInfo {
    const userAgent = navigator.userAgent;
    
    // Electron-spezifische Informationen extrahieren
    const electronMatch = userAgent.match(/Electron\/([^\s]+)/);
    const chromeMatch = userAgent.match(/Chrome\/([^\s]+)/);
    // Node version is not directly accessible in renderer, extract from userAgent if possible
    const nodeMatch = userAgent.match(/Node\/([^\s]+)/);
    
    return {
      platform: navigator.platform,
      userAgent: userAgent,
      electronVersion: electronMatch?.[1],
      chromeVersion: chromeMatch?.[1], 
      nodeVersion: nodeMatch?.[1] || 'unknown'
    };
  }
  
  /**
   * 🔄 Vollständige Versionsinformationen
   */
  static getFullVersionInfo(): {
    app: AppVersion;
    system: SystemInfo;
    dependencies: Record<string, string>;
  } {
    return {
      app: this.getAppVersion(),
      system: this.getSystemInfo(),
      dependencies: {
        react: packageJson.dependencies?.react || 'unknown',
        electron: packageJson.devDependencies?.electron || 'unknown',
        'better-sqlite3': packageJson.dependencies?.['better-sqlite3'] || 'unknown',
        vite: packageJson.devDependencies?.vite || 'unknown'
      }
    };
  }
  
  /**
   * 📋 Version-String für UI anzeigen
   */
  static getDisplayVersion(): string {
    const app = this.getAppVersion();
    return `${app.name} v${app.version}`;
  }
  
  /**
   * 🏷️ Erweiterte Version für About-Dialog
   */
  static getAboutVersionString(): string {
    const app = this.getAppVersion();
    const system = this.getSystemInfo();
    
    let versionString = `${app.name} v${app.version}`;
    
    if (app.buildEnvironment !== 'production') {
      versionString += ` (${app.buildEnvironment})`;
    }
    
    if (system.electronVersion) {
      versionString += `\nElectron ${system.electronVersion}`;
    }
    
    if (app.gitCommit) {
      const shortCommit = app.gitCommit.substring(0, 7);
      versionString += `\nBuild ${shortCommit}`;
    }
    
    return versionString;
  }
  
  /**
   * 🎯 Version für Backup-Header
   */
  static getBackupVersionInfo(): {
    version: string;
    timestamp: string;
    buildInfo: string;
  } {
    const app = this.getAppVersion();
    const system = this.getSystemInfo();
    
    return {
      version: app.version,
      timestamp: new Date().toISOString(),
      buildInfo: `${app.name}@${app.version} (Electron ${system.electronVersion || 'unknown'})`
    };
  }
  
  /**
   * 🔍 Version-Kompatibilität prüfen
   */
  static isCompatibleVersion(requiredVersion: string): boolean {
    const current = this.getAppVersion().version;
    
    try {
      // Einfache Semantic Version Vergleich
      const currentParts = current.split('.').map(Number);
      const requiredParts = requiredVersion.split('.').map(Number);
      
      // Major version muss übereinstimmen
      if (currentParts[0] !== requiredParts[0]) return false;
      
      // Minor version muss größer oder gleich sein
      if (currentParts[1] < requiredParts[1]) return false;
      
      // Patch version muss größer oder gleich sein (wenn minor gleich)
      if (currentParts[1] === requiredParts[1] && currentParts[2] < requiredParts[2]) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Version comparison failed:', error);
      return false;
    }
  }
  
  /**
   * 📊 Debug-Informationen für Support
   */
  static getDebugInfo(): string {
    const info = this.getFullVersionInfo();
    
    return `
=== RawaLite Debug Information ===
App: ${info.app.name} v${info.app.version}
Build: ${info.app.buildEnvironment} (${info.app.buildDate})
Platform: ${info.system.platform}
Electron: ${info.system.electronVersion || 'unknown'}
Chrome: ${info.system.chromeVersion || 'unknown'}
Node: ${info.system.nodeVersion || 'unknown'}

Dependencies:
${Object.entries(info.dependencies)
  .map(([name, version]) => `- ${name}: ${version}`)
  .join('\n')}

System:
${info.system.userAgent}

Git: ${info.app.gitBranch || 'unknown'}@${info.app.gitCommit?.substring(0, 7) || 'unknown'}
    `.trim();
  }
}

/**
 * 🎯 Default Export für einfache Verwendung
 */
export default VersionService;

/**
 * 🧪 Testing Utilities
 */
export const VersionTestUtils = {
  /**
   * Mock version für Tests
   */
  mockVersion: '1.0.0-test',
  
  /**
   * Version für Tests überschreiben
   */
  setTestVersion(version: string): void {
    (packageJson as any).version = version;
  },
  
  /**
   * Original Version wiederherstellen
   */
  restoreVersion(): void {
    // Version würde aus original package.json wiederhergestellt
  }
};

/**
 * 📚 Usage Examples:
 * 
 * ```typescript
 * // ✅ Einfache Version anzeigen
 * const version = VersionService.getDisplayVersion(); // "rawalite v1.0.0"
 * 
 * // ✅ About-Dialog
 * const aboutText = VersionService.getAboutVersionString();
 * 
 * // ✅ Backup-Metadaten
 * const backupInfo = VersionService.getBackupVersionInfo();
 * 
 * // ✅ Kompatibilität prüfen
 * if (VersionService.isCompatibleVersion('1.0.0')) {
 *   // Feature ist verfügbar
 * }
 * 
 * // ✅ Debug-Informationen
 * console.log(VersionService.getDebugInfo());
 * ```
 */