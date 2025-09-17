/**
 * RawaLite Version Service - Simplified
 * Nur für Version-Anzeige. Update-Logik über electron-updater
 */
import { LoggingService } from './LoggingService';
import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  buildNumber: number;
  buildDate: string;
  isDevelopment: boolean;
}

export class VersionService {
  private readonly BASE_VERSION = packageJson.version;
  private readonly BUILD_DATE = new Date().toISOString().split('T')[0];
  
  constructor() {
    LoggingService.log(`[VersionService] Initialized - Version: ${this.BASE_VERSION}`);
  }

  async getCurrentVersion(): Promise<VersionInfo> {
    return {
      version: this.BASE_VERSION,
      buildNumber: 1,
      buildDate: this.BUILD_DATE,
      isDevelopment: this.BASE_VERSION.includes('dev')
    };
  }

  getVersionString(): string {
    return this.BASE_VERSION;
  }

  getBuildDate(): string {
    return this.BUILD_DATE;
  }
}
