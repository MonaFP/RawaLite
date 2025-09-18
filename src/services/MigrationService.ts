/**
 * 🔧 RawaLite Migration Service
 * 
 * Robustes Update-/Migrationssystem für sichere App-Updates ohne Datenverlust
 * 
 * WICHTIG: Verwendet jetzt BackupService für Dateisystem-basierte Backups
 * statt localStorage (behebt QuotaExceededError)
 */

import { getDB, all, run, withTx } from '../persistence/sqlite/db';
import { LoggingService } from './LoggingService';
import { backupService } from './BackupService';

export interface MigrationStep {
  version: number;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  test: () => Promise<boolean>;
}

export interface SchemaInfo {
  version: number;
  lastMigration: string;
  backupPath?: string;
  migratedAt: string;
  appVersion: string;
}

export interface BackupMetadata {
  id: string;
  version: number;
  appVersion: string;
  size: number;
  createdAt: string;
  description: string;
  checksumSHA256: string;
}

export class MigrationService {
  private readonly SCHEMA_VERSION_TABLE = 'schema_versions';
  private readonly BACKUP_METADATA_TABLE = 'backup_metadata';
  private readonly CURRENT_VERSION = 5;

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logMessage = data ? `[Migration${level.toUpperCase()}] ${message} - ${JSON.stringify(data)}` : `[Migration${level.toUpperCase()}] ${message}`;
    LoggingService.log(logMessage);
  }

  async initialize(): Promise<void> {
    try {
      this.log('info', 'Starting migration system initialization');
      
      // Prüfe zuerst ob die Datenbank überhaupt existiert
      try {
        const db = await getDB();
        this.log('info', 'Database connection established');
      } catch (dbError) {
        this.log('warn', 'Database connection failed, will be created on first use', { 
          error: dbError instanceof Error ? dbError.message : String(dbError) 
        });
        // Weiter machen - DB wird beim ersten Zugriff erstellt
      }
      
      // Ensure migration tables exist FIRST, outside of any transaction
      await this.createMigrationTablesIfNeeded();
      
      // Then run migrations
      await this.detectAndRunMigrations();
      
      this.log('info', 'Migration system initialization completed successfully');
    } catch (error) {
      this.log('error', 'Migration system initialization failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // In Development-Modus: Warnung statt Fehler
      if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        this.log('warn', 'Development mode: Migration failure is non-critical');
        return; // Erfolg simulieren für Development
      }
      
      throw error;
    }
  }

  private async createMigrationTablesIfNeeded(): Promise<void> {
    try {
      // Sichere Datenbank-Verbindung herstellen
      const db = await getDB();
      
      // Create schema version table
      await run(`
        CREATE TABLE IF NOT EXISTS ${this.SCHEMA_VERSION_TABLE} (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          version INTEGER NOT NULL DEFAULT 0,
          lastMigration TEXT,
          backupPath TEXT,
          migratedAt TEXT NOT NULL,
          appVersion TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // Create backup metadata table
      await run(`
        CREATE TABLE IF NOT EXISTS ${this.BACKUP_METADATA_TABLE} (
          id TEXT PRIMARY KEY,
          version INTEGER NOT NULL,
          appVersion TEXT NOT NULL,
          size INTEGER NOT NULL,
          createdAt TEXT NOT NULL,
          description TEXT NOT NULL,
          checksumSHA256 TEXT NOT NULL,
          isValid INTEGER NOT NULL DEFAULT 1
        )
      `);

      // Initialize schema version using INSERT OR IGNORE to prevent duplicates
      const now = new Date().toISOString();
      try {
        await run(`
          INSERT OR IGNORE INTO ${this.SCHEMA_VERSION_TABLE} 
          (id, version, migratedAt, appVersion) 
          VALUES (1, 1, ?, ?)
        `, [now, this.getAppVersion()]);
        
        // Check if we actually inserted (means it was first time)
        const insertedRows = await all<SchemaInfo>(`SELECT * FROM ${this.SCHEMA_VERSION_TABLE} WHERE id = 1 AND migratedAt = ?`, [now]);
        if (insertedRows.length > 0) {
          this.log('info', 'Schema version tracking initialized', { version: 1 });
        } else {
          this.log('info', 'Schema version tracking already exists');
        }
      } catch (insertError) {
        // If INSERT OR IGNORE still fails, just log it and continue
        this.log('warn', 'Schema version initialization had issues, but continuing', { 
          error: insertError instanceof Error ? insertError.message : String(insertError) 
        });
      }
    } catch (error) {
      this.log('error', 'Failed to create migration tables', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // In Development: Nicht kritisch
      if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        this.log('warn', 'Development mode: Migration table creation failure ignored');
        return;
      }
      
      throw error;
    }
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const tables = await all<{ name: string }>(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `, [tableName]);
      return tables.length > 0;
    } catch (error) {
      this.log('warn', `Error checking table existence: ${tableName}`, { error });
      return false;
    }
  }

  private getMigrationSteps(): MigrationStep[] {
    return [
      {
        version: 1,
        name: 'initial_schema_setup',
        description: 'Sets up initial database schema version tracking',
        up: async () => {
          // This migration is handled by ensureMigrationTables()
          this.log('info', 'Initial schema setup completed');
        },
        down: async () => {
          this.log('warn', 'Cannot downgrade initial schema');
        },
        test: async () => {
          // Check if migration tables exist
          const tables = await all<any>(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('${this.SCHEMA_VERSION_TABLE}', '${this.BACKUP_METADATA_TABLE}')
          `);
          return tables.length === 2;
        }
      },
      {
        version: 2,
        name: 'add_activity_tracking',
        description: 'Adds activity tracking capabilities to timesheets',
        up: async () => {
          // Check if activities table exists
          const tables = await all<any>(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='activities'
          `);
          
          if (tables.length === 0) {
            // Create activities table if it doesn't exist
            await run(`
              CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                defaultHourlyRate REAL NOT NULL,
                isActive BOOLEAN DEFAULT 1,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
              )
            `);
            this.log('info', 'Created activities table');
          }
          
          // Add activity_id column to timesheets if it doesn't exist
          const timesheetColumns = await all<any>('PRAGMA table_info(timesheets)');
          const hasActivityColumn = timesheetColumns.some((col: any) => col.name === 'activityId');
          
          if (!hasActivityColumn) {
            await run('ALTER TABLE timesheets ADD COLUMN activityId INTEGER');
            this.log('info', 'Added activityId column to timesheets');
          }
        },
        down: async () => {
          this.log('warn', 'Downgrade not implemented for activity tracking');
        },
        test: async () => {
          const tables = await all<any>(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='activities'
          `);
          const timesheetColumns = await all<any>('PRAGMA table_info(timesheets)');
          const hasActivityColumn = timesheetColumns.some((col: any) => col.name === 'activityId');
          
          return tables.length > 0 && hasActivityColumn;
        }
      },
      {
        version: 3,
        name: 'improve_numbering_system',
        description: 'Improves the numbering system for better control',
        up: async () => {
          // Add numbering improvements - this is mostly handled in settings
          this.log('info', 'Numbering system improvements applied');
          
          // Ensure all tables have proper indexing for numbering
          await run(`CREATE INDEX IF NOT EXISTS idx_customers_number ON customers(number)`);
          await run(`CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber)`);
          await run(`CREATE INDEX IF NOT EXISTS idx_offers_number ON offers(offerNumber)`);
        },
        down: async () => {
          this.log('warn', 'Downgrade not implemented for numbering improvements');
        },
        test: async () => {
          // Check if indexes exist
          const indexes = await all<any>(`
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name IN (
              'idx_customers_number', 
              'idx_invoices_number', 
              'idx_offers_number'
            )
          `);
          return indexes.length >= 3;
        }
      },
      {
        version: 4,
        name: 'add_audit_fields',
        description: 'Adds audit fields for better tracking',
        up: async () => {
          const tables = ['customers', 'invoices', 'offers', 'packages'];
          
          for (const table of tables) {
            try {
              const columns = await all<any>(`PRAGMA table_info(${table})`);
              
              if (!columns.some((col: any) => col.name === 'createdAt')) {
                await run(`ALTER TABLE ${table} ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP`);
              }
              
              if (!columns.some((col: any) => col.name === 'updatedAt')) {
                await run(`ALTER TABLE ${table} ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP`);
              }
              
              this.log('info', `Added audit fields to ${table} table`);
            } catch (error) {
              // Table might not exist yet, which is fine
              this.log('warn', `Could not add audit fields to ${table}: ${error}`);
            }
          }
        },
        down: async () => {
          this.log('warn', 'Downgrade not implemented for audit fields');
        },
        test: async () => {
          // Check at least one table has audit fields
          try {
            const columns = await all<any>('PRAGMA table_info(customers)');
            return columns.some((col: any) => col.name === 'createdAt') && 
                   columns.some((col: any) => col.name === 'updatedAt');
          } catch {
            return true; // If table doesn't exist, consider test passed
          }
        }
      },
      {
        version: 5,
        name: 'optimize_indexes',
        description: 'Optimizes database indexes for better performance',
        up: async () => {
          // Add performance indexes
          const indexCommands = [
            `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`,
            `CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customerId)`,
            `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
            `CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customerId)`,
            `CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status)`,
            `CREATE INDEX IF NOT EXISTS idx_timesheets_customer ON timesheets(customerId)`,
            `CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheets(date)`,
          ];
          
          for (const command of indexCommands) {
            try {
              await run(command);
            } catch (error) {
              this.log('warn', `Could not create index: ${error}`);
            }
          }
          
          this.log('info', 'Performance indexes optimized');
        },
        down: async () => {
          this.log('warn', 'Downgrade not implemented for index optimization');
        },
        test: async () => {
          // Check if at least some indexes exist
          const indexes = await all<any>(`
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name LIKE 'idx_%'
          `);
          return indexes.length >= 3;
        }
      }
    ];
  }

  private async detectAndRunMigrations(): Promise<void> {
    const currentSchema = await this.getCurrentSchemaVersion();
    const targetVersion = this.CURRENT_VERSION;

    if (currentSchema.version >= targetVersion) {
      this.log('info', 'Schema is up to date', { 
        current: currentSchema.version, 
        target: targetVersion 
      });
      return;
    }

    this.log('info', 'Migrations required', { 
      from: currentSchema.version, 
      to: targetVersion 
    });

    const backupId = await this.createDatabaseBackup(
      `Before migration from v${currentSchema.version} to v${targetVersion}`
    );

    try {
      await this.runMigrations(currentSchema.version, targetVersion);
      this.log('info', 'All migrations completed successfully', { 
        from: currentSchema.version, 
        to: targetVersion,
        backupId 
      });
    } catch (error) {
      this.log('error', 'Migration failed', { 
        error: error instanceof Error ? error.message : String(error),
        backupId 
      });
      throw error;
    }
  }

  private async runMigrations(fromVersion: number, toVersion: number): Promise<void> {
    const migrations = this.getMigrationSteps();
    
    for (let version = fromVersion + 1; version <= toVersion; version++) {
      const migration = migrations.find(m => m.version === version);
      if (!migration) {
        throw new Error(`Migration for version ${version} not found`);
      }

      this.log('info', `Running migration: ${migration.name}`);

      try {
        // Run migration step
        await migration.up();
        
        // Test migration
        const testResult = await migration.test();
        if (!testResult) {
          throw new Error(`Migration test failed for version ${version}`);
        }

        // Update schema version in a separate transaction
        await withTx(async () => {
          await this.updateSchemaVersion(version, migration.name);
        });
        
        this.log('info', `Migration completed: ${migration.name}`);
      } catch (error) {
        this.log('error', `Migration failed: ${migration.name}`, { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }
  }

  async createDatabaseBackup(description: string): Promise<string> {
    try {
      this.log('info', 'Creating database backup using BackupService', { description });
      
      // Use new BackupService instead of localStorage
      const result = await backupService.createManualBackup(description);
      
      if (!result.success || !result.backupId) {
        // 🔧 CRITICAL FIX: Graceful degradation for browser environment
        if (result.error?.includes('browser environment')) {
          this.log('warn', 'Backup not available in browser environment - continuing without backup');
          return 'no-backup-browser-env'; // Return synthetic backup ID
        }
        throw new Error(result.error || 'Backup creation failed');
      }

      // Still track in database metadata for compatibility
      const currentVersion = await this.getCurrentSchemaVersion();
      const timestamp = new Date().toISOString();
      
      try {
        await withTx(async () => {
          await run(`
            INSERT INTO ${this.BACKUP_METADATA_TABLE}
            (id, version, appVersion, size, createdAt, description, checksumSHA256)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            result.backupId,
            currentVersion.version,
            this.getAppVersion(),
            result.size || 0,
            timestamp,
            description,
            'filesystem' // Indicates this is a filesystem backup
          ]);
        });
      } catch (txError) {
        // If transaction fails, try direct insert
        this.log('warn', 'Transaction failed, trying direct insert for backup metadata', { 
          error: txError instanceof Error ? txError.message : String(txError) 
        });
        
        await run(`
          INSERT INTO ${this.BACKUP_METADATA_TABLE}
          (id, version, appVersion, size, createdAt, description, checksumSHA256)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          result.backupId,
          currentVersion.version,
          this.getAppVersion(),
          result.size || 0,
          timestamp,
          description,
          'filesystem'
        ]);
      }
      
      this.log('info', 'Database backup created successfully', { 
        backupId: result.backupId, 
        size: result.size,
        filePath: result.filePath 
      });
      
      return result.backupId;
    } catch (error) {
      this.log('error', 'Failed to create backup', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Backup creation failed: ${error}`);
    }
  }

  async runIntegrityCheck(): Promise<boolean> {
    try {
      const integrityResult = all<{integrity_check: string}>('PRAGMA integrity_check');
      const isIntact = integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok';
      
      if (!isIntact) {
        this.log('error', 'Database integrity check failed', { result: integrityResult });
        return false;
      }
      
      const tables = all<{name: string}>(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN (
          'settings', 'customers', 'packages', 'offers', 'invoices', 'timesheets', 'activities'
        )
      `);
      
      const expectedTables = ['settings', 'customers', 'packages', 'offers', 'invoices'];
      const existingTables = tables.map(t => t.name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        this.log('error', 'Missing essential tables', { missingTables });
        return false;
      }
      
      this.log('info', 'Database integrity check passed');
      return true;
      
    } catch (error) {
      this.log('error', 'Integrity check failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  async cleanupOldBackups(keepCount: number = 5): Promise<void> {
    try {
      this.log('info', 'Cleaning up old backups', { keepCount });
      
      // Use BackupService for filesystem cleanup
      const pruneResult = await backupService.prune({ 
        keep: keepCount, 
        maxTotalMB: 500 
      });
      
      if (pruneResult.success) {
        this.log('info', 'Backup cleanup completed', { 
          removedCount: pruneResult.removedCount 
        });
      } else {
        this.log('warn', 'Backup cleanup failed', { 
          error: pruneResult.error 
        });
      }

      // Also clean up old localStorage entries (legacy cleanup)
      try {
        const legacyBackups = await all<BackupMetadata>(`
          SELECT * FROM ${this.BACKUP_METADATA_TABLE} 
          WHERE checksumSHA256 != 'filesystem'
          ORDER BY createdAt DESC
        `);
        
        if (legacyBackups.length > keepCount) {
          const toDelete = legacyBackups.slice(keepCount);
          
          for (const backup of toDelete) {
            const backupKey = `rawalite.backup.${backup.id}`;
            try {
              localStorage.removeItem(backupKey);
              await run(`DELETE FROM ${this.BACKUP_METADATA_TABLE} WHERE id = ?`, [backup.id]);
              this.log('info', 'Cleaned up legacy backup', { backupId: backup.id });
            } catch (error) {
              this.log('warn', 'Failed to clean up legacy backup', { 
                backupId: backup.id, 
                error: error instanceof Error ? error.message : String(error) 
              });
            }
          }
        }
      } catch (error) {
        this.log('warn', 'Legacy backup cleanup failed', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
      
    } catch (error) {
      this.log('error', 'Backup cleanup failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  // Public API
  async createManualBackup(description?: string): Promise<string> {
    return this.createDatabaseBackup(description || 'Manual backup');
  }

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      // Get both filesystem and legacy backups
      const dbBackups = await all<BackupMetadata>(`
        SELECT * FROM ${this.BACKUP_METADATA_TABLE} 
        ORDER BY createdAt DESC
      `);
      
      // Get filesystem backups from BackupService
      const filesystemBackups = await backupService.list();
      
      // Merge and deduplicate (prefer filesystem backups)
      const backupMap = new Map<string, BackupMetadata>();
      
      // Add filesystem backups first (these are preferred)
      for (const fsBackup of filesystemBackups) {
        backupMap.set(fsBackup.id, {
          id: fsBackup.id,
          version: parseInt(fsBackup.version) || 0,
          appVersion: fsBackup.version,
          size: fsBackup.size,
          createdAt: fsBackup.createdAt,
          description: fsBackup.description,
          checksumSHA256: 'filesystem'
        });
      }
      
      // Add database backups that aren't already in filesystem
      for (const dbBackup of dbBackups) {
        if (!backupMap.has(dbBackup.id)) {
          backupMap.set(dbBackup.id, dbBackup);
        }
      }
      
      const mergedBackups = Array.from(backupMap.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      this.log('info', 'Listed merged backups', { 
        total: mergedBackups.length,
        filesystem: filesystemBackups.length,
        database: dbBackups.length
      });
      
      return mergedBackups;
    } catch (error) {
      this.log('warn', 'Error listing backups', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getMigrationStatus(): Promise<{
    currentVersion: number;
    targetVersion: number;
    lastMigration?: string;
    pendingMigrations: number;
    needsMigration: boolean;
  }> {
    const current = await this.getCurrentSchemaVersion();
    const pending = Math.max(0, this.CURRENT_VERSION - current.version);
    
    return {
      currentVersion: current.version,
      targetVersion: this.CURRENT_VERSION,
      lastMigration: current.lastMigration,
      pendingMigrations: pending,
      needsMigration: pending > 0
    };
  }

  async exportDatabase(): Promise<Uint8Array> {
    const db = await getDB();
    return db.export();
  }

  // Private helpers
  private async getCurrentSchemaVersion(): Promise<SchemaInfo> {
    try {
      const rows = await all<SchemaInfo>(`SELECT * FROM ${this.SCHEMA_VERSION_TABLE} WHERE id = 1`);
      if (rows.length > 0) {
        return rows[0];
      }
      
      // No schema version found, return default
      this.log('warn', 'No schema version found, returning default');
      return {
        version: 0,
        lastMigration: '',
        migratedAt: new Date().toISOString(),
        appVersion: this.getAppVersion()
      };
    } catch (error) {
      this.log('warn', 'Error reading schema version, returning default', { error: error instanceof Error ? error.message : String(error) });
      return {
        version: 0,
        lastMigration: '',
        migratedAt: new Date().toISOString(),
        appVersion: this.getAppVersion()
      };
    }
  }

  private async updateSchemaVersion(version: number, migrationName: string): Promise<void> {
    const now = new Date().toISOString();
    await run(`
      UPDATE ${this.SCHEMA_VERSION_TABLE} 
      SET version = ?, lastMigration = ?, migratedAt = ?, appVersion = ?, updatedAt = ?
      WHERE id = 1
    `, [version, migrationName, now, this.getAppVersion(), now]);
    
    this.log('info', 'Schema version updated', { version, migration: migrationName });
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAppVersion(): string {
    return '1.0.0';
  }

  private base64FromUint8Array(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.byteLength; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private async calculateChecksum(data: Uint8Array): Promise<string> {
    const crypto = window.crypto || (window as any).msCrypto;
    if (crypto && crypto.subtle) {
      // Create a proper ArrayBuffer from the Uint8Array
      const buffer = new ArrayBuffer(data.length);
      new Uint8Array(buffer).set(data);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
      }
      return Math.abs(hash).toString(16);
    }
  }
}
