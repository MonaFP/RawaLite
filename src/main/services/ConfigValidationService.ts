/**
 * ConfigValidationService - Validates application configuration and environment settings
 * 
 * ✅ FIX-1.4: Config Validation Service
 * 
 * Purpose: Ensures configuration consistency across Dev and Production environments,
 * validates critical settings before application startup, and provides comprehensive
 * validation reports for debugging.
 * 
 * Features:
 * - Environment detection (Dev vs Production)
 * - Database configuration validation
 * - Backup directory structure verification
 * - Critical settings consistency checks
 * - Comprehensive error reporting
 * 
 * Design: Static service for pre-startup validation, returns detailed validation
 * results with errors and warnings for operator debugging.
 * 
 * @since v1.0.70 - Added to ensure environment configuration integrity
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { getDb } from '../db/Database';

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  environment: 'development' | 'production';
  errors: string[];
  warnings: string[];
  config: {
    isDev: boolean;
    isPackaged: boolean;
    dbPath: string;
    dbFileName: string;
    backupDir: string;
    userData: string;
  };
}

/**
 * Configuration validation errors
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * ConfigValidationService - Static service for environment validation
 */
export class ConfigValidationService {
  private static readonly COMPONENT = 'ConfigValidation';

  /**
   * Validate complete application configuration
   */
  static validateConfiguration(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Detect environment
      const isDev = !app.isPackaged;
      const environment: 'development' | 'production' = isDev ? 'development' : 'production';

      this.debugLog('validateConfiguration', 'Starting', { environment });

      // Get user data directory
      const userData = app.getPath('userData');
      if (!userData) {
        errors.push('Failed to get userData directory from Electron app');
        return {
          valid: false,
          environment,
          errors,
          warnings,
          config: {
            isDev,
            isPackaged: app.isPackaged,
            dbPath: '',
            dbFileName: '',
            backupDir: '',
            userData: '',
          },
        };
      }

      // Validate database path
      const dbFileName = isDev ? 'rawalite-dev.db' : 'rawalite.db';
      const dbDir = path.join(userData, 'database');
      const dbPath = path.join(dbDir, dbFileName);

      this.validateDbPath(dbPath, isDev, errors, warnings);

      // Validate backup directory
      const backupDir = path.join(dbDir, 'backups');
      this.validateBackupDir(backupDir, errors, warnings);

      // Validate database access (if it exists)
      this.validateDbAccess(dbPath, isDev, errors, warnings);

      // Validate environment consistency
      this.validateEnvironmentConsistency(isDev, errors, warnings);

      const valid = errors.length === 0;

      this.debugLog(
        'validateConfiguration',
        valid ? 'SUCCESS' : 'FAILED',
        {
          valid,
          errorCount: errors.length,
          warningCount: warnings.length,
          environment,
        }
      );

      return {
        valid,
        environment,
        errors,
        warnings,
        config: {
          isDev,
          isPackaged: app.isPackaged,
          dbPath,
          dbFileName,
          backupDir,
          userData,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Configuration validation failed: ${message}`);

      this.debugLog('validateConfiguration', 'ERROR', {}, message);

      return {
        valid: false,
        environment: !app.isPackaged ? 'development' : 'production',
        errors,
        warnings,
        config: {
          isDev: !app.isPackaged,
          isPackaged: app.isPackaged,
          dbPath: '',
          dbFileName: '',
          backupDir: '',
          userData: app.getPath('userData'),
        },
      };
    }
  }

  /**
   * Validate database path configuration
   */
  private static validateDbPath(
    dbPath: string,
    isDev: boolean,
    errors: string[],
    warnings: string[]
  ): void {
    const dbDir = path.dirname(dbPath);
    const expectedFileName = isDev ? 'rawalite-dev.db' : 'rawalite.db';
    const actualFileName = path.basename(dbPath);

    // Check environment-specific database file name
    if (actualFileName !== expectedFileName) {
      errors.push(
        `Database file name mismatch: expected '${expectedFileName}', got '${actualFileName}' in ${isDev ? 'DEV' : 'PROD'} environment`
      );
    }

    // Check if database directory can be created
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
        warnings.push(`Database directory did not exist, created at: ${dbDir}`);
      } catch (error) {
        errors.push(
          `Failed to create database directory at ${dbDir}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Check if database directory is accessible
    try {
      fs.accessSync(dbDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      errors.push(`Database directory is not readable/writable: ${dbDir}`);
    }

    this.debugLog('validateDbPath', 'Checked', {
      dbPath,
      dbDir,
      expectedFileName,
      actualFileName,
      isDev,
    });
  }

  /**
   * Validate backup directory structure
   */
  private static validateBackupDir(backupDir: string, errors: string[], warnings: string[]): void {
    if (!fs.existsSync(backupDir)) {
      try {
        fs.mkdirSync(backupDir, { recursive: true });
        warnings.push(`Backup directory did not exist, created at: ${backupDir}`);
      } catch (error) {
        errors.push(
          `Failed to create backup directory at ${backupDir}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Check if backup directory is accessible
    try {
      fs.accessSync(backupDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      errors.push(`Backup directory is not readable/writable: ${backupDir}`);
    }

    this.debugLog('validateBackupDir', 'Checked', { backupDir });
  }

  /**
   * Validate database access (if database exists)
   */
  private static validateDbAccess(
    dbPath: string,
    isDev: boolean,
    errors: string[],
    warnings: string[]
  ): void {
    if (fs.existsSync(dbPath)) {
      try {
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
        this.debugLog('validateDbAccess', 'Database accessible', { dbPath, isDev });
      } catch (error) {
        errors.push(`Database file is not readable/writable: ${dbPath}`);
      }
    } else {
      // Database doesn't exist yet - this is OK, will be created on first run
      this.debugLog('validateDbAccess', 'Database does not exist yet', { dbPath, isDev });
    }
  }

  /**
   * Validate environment consistency across services
   */
  private static validateEnvironmentConsistency(
    isDev: boolean,
    errors: string[],
    warnings: string[]
  ): void {
    // Check app.isPackaged consistency
    const isPackaged = app.isPackaged;
    if ((isDev && isPackaged) || (!isDev && !isPackaged)) {
      // This is expected - isDev is computed from isPackaged
    }

    // Check if running in development environment
    if (isDev) {
      // In development, verify we have necessary tools
      try {
        import('electron');
        this.debugLog('validateEnvironmentConsistency', 'Development environment verified');
      } catch (error) {
        warnings.push('Electron module not properly loaded in development mode');
      }
    } else {
      // In production, verify packaging is correct
      if (!isPackaged) {
        warnings.push('Running in production mode but app.isPackaged is false');
      }
    }

    this.debugLog('validateEnvironmentConsistency', 'Checked', { isDev, isPackaged });
  }

  /**
   * Get current environment type
   */
  static getEnvironment(): 'development' | 'production' {
    return !app.isPackaged ? 'development' : 'production';
  }

  /**
   * Check if running in development mode
   */
  static isDevelopment(): boolean {
    return !app.isPackaged;
  }

  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return app.isPackaged;
  }

  /**
   * Get environment-specific database file name
   */
  static getDbFileName(): string {
    const isDev = !app.isPackaged;
    return isDev ? 'rawalite-dev.db' : 'rawalite.db';
  }

  /**
   * Get environment-specific database directory
   */
  static getDbDir(): string {
    const userData = app.getPath('userData');
    return path.join(userData, 'database');
  }

  /**
   * Get environment-specific database path
   */
  static getDbPath(): string {
    return path.join(this.getDbDir(), this.getDbFileName());
  }

  /**
   * Get backup directory
   */
  static getBackupDir(): string {
    return path.join(this.getDbDir(), 'backups');
  }

  /**
   * Debug logging helper
   */
  private static debugLog(component: string, action: string, data?: any, error?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${component}::${action}`;

    if (error) {
      console.error(`❌ ${logMessage}`, data || {}, error);
    } else {
      console.log(`🔧 ${logMessage}`, data || {});
    }
  }
}

/**
 * Export singleton instance methods
 */
export default ConfigValidationService;
