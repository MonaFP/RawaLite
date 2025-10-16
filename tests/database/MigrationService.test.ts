import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Database module
vi.mock('../../src/main/db/Database', () => ({
  getDb: vi.fn().mockReturnValue({
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
      finalize: vi.fn()
    }),
    pragma: vi.fn()
  }),
  getUserVersion: vi.fn(),
  setUserVersion: vi.fn(),
  tx: vi.fn()
}));

// Mock LoggingService
vi.mock('../../src/services/LoggingService', () => ({
  LoggingService: {
    log: vi.fn(),
    logError: vi.fn()
  }
}));

// Mock fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn()
  }
}));

// Mock path module
vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/'))
  }
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userdata')
  }
}));

// Mock migrations - Import real migrations but with mocked functions
vi.mock('../../src/main/db/migrations/index', () => {
  // Import the actual migrations array structure but mock the functions
  return {
    migrations: Array.from({ length: 26 }, (_, i) => ({
      version: i + 1,
      name: `Migration ${i + 1}`,
      up: vi.fn(),
      down: vi.fn()
    }))
  };
});

// Import after mocking
import * as MigrationService from '../../src/main/db/MigrationService';
import * as Database from '../../src/main/db/Database';
import { migrations } from '../../src/main/db/migrations/index';
import fs from 'node:fs';

describe('MigrationService', () => {
  const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
      finalize: vi.fn()
    }),
    pragma: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (Database.getDb as any).mockReturnValue(mockDb);
    (fs.existsSync as any).mockReturnValue(true);
  });

  describe('runAllMigrations', () => {
    it('should run pending migrations', async () => {
      (Database.getUserVersion as any).mockReturnValue(1); // Current version 1
      const mockTransaction = vi.fn().mockImplementation((fn) => fn(mockDb));
      (Database.tx as any).mockImplementation(mockTransaction);

      await MigrationService.runAllMigrations();

      expect(mockTransaction).toHaveBeenCalled();
      expect(migrations[1].up).toHaveBeenCalledWith(mockDb); // Migration 2
      expect(migrations[2].up).toHaveBeenCalledWith(mockDb); // Migration 3
      expect(Database.setUserVersion).toHaveBeenCalledWith(26);
    });

    it('should skip if no migrations needed', async () => {
      (Database.getUserVersion as any).mockReturnValue(26); // Already at latest

      await MigrationService.runAllMigrations();

      expect(Database.tx).not.toHaveBeenCalled();
      expect(Database.setUserVersion).not.toHaveBeenCalled();
    });

    it('should handle migration errors and rollback', async () => {
      (Database.getUserVersion as any).mockReturnValue(0);
      const error = new Error('Migration failed');
      const mockTransaction = vi.fn().mockImplementation(() => { throw error; });
      (Database.tx as any).mockImplementation(mockTransaction);

      await expect(MigrationService.runAllMigrations()).rejects.toThrow('Migration failed');
    });

    it('should create backup before migration', async () => {
      (Database.getUserVersion as any).mockReturnValue(0);
      const mockTransaction = vi.fn().mockImplementation((fn) => fn(mockDb));
      (Database.tx as any).mockImplementation(mockTransaction);

      await MigrationService.runAllMigrations();

      // Should call VACUUM INTO for backup
      expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('VACUUM INTO'));
    });
  });

  describe('rollbackToVersion', () => {
    it('should rollback migrations in reverse order', async () => {
      (Database.getUserVersion as any).mockReturnValue(3); // Current version 3
      const mockTransaction = vi.fn().mockImplementation((fn) => fn(mockDb));
      (Database.tx as any).mockImplementation(mockTransaction);

      await MigrationService.rollbackToVersion(1);

      expect(mockTransaction).toHaveBeenCalled();
      expect(migrations[2].down).toHaveBeenCalledWith(mockDb); // Migration 3 rollback
      expect(migrations[1].down).toHaveBeenCalledWith(mockDb); // Migration 2 rollback
      expect(Database.setUserVersion).toHaveBeenCalledWith(1);
    });

    it('should skip if already at target version', async () => {
      (Database.getUserVersion as any).mockReturnValue(1);

      await MigrationService.rollbackToVersion(2); // Target is higher

      expect(Database.tx).not.toHaveBeenCalled();
    });

    it('should fail if migration has no down method', async () => {
      (Database.getUserVersion as any).mockReturnValue(3);
      
      // Mock a migration without down method
      const migrationsWithoutDown = [
        { ...migrations[2], down: undefined }
      ];
      vi.mocked(migrations).splice(2, 1, migrationsWithoutDown[0] as any);
      
      const mockTransaction = vi.fn().mockImplementation((fn) => fn(mockDb));
      (Database.tx as any).mockImplementation(mockTransaction);

      await expect(MigrationService.rollbackToVersion(1)).rejects.toThrow('has no down migration');
    });
  });

  describe('getMigrationStatus', () => {
    it('should return migration status', () => {
      (Database.getUserVersion as any).mockReturnValue(1);

      const status = MigrationService.getMigrationStatus();

      expect(status).toMatchObject({
        currentVersion: 1,
        targetVersion: 26,
        pendingMigrations: expect.arrayContaining([
          expect.objectContaining({ version: 2 }),
          expect.objectContaining({ version: 3 })
        ])
      });
    });

    it('should return empty pending migrations if up to date', () => {
      (Database.getUserVersion as any).mockReturnValue(26);

      const status = MigrationService.getMigrationStatus();

      expect(status).toMatchObject({
        currentVersion: 26,
        targetVersion: 26,
        pendingMigrations: []
      });
    });
  });

  describe('validateSchema', () => {
    it('should validate correct schema', () => {
      const mockStmt = {
        get: vi.fn()
          .mockReturnValueOnce({ name: 'settings' })
          .mockReturnValueOnce({ name: 'customers' })
          .mockReturnValueOnce({ name: 'offers' })
          .mockReturnValueOnce({ name: 'invoices' })
          .mockReturnValueOnce({ name: 'packages' })
          .mockReturnValueOnce({ name: 'numbering_circles' })
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);
      mockDb.pragma
        .mockReturnValueOnce(true)  // foreign_keys enabled
        .mockReturnValueOnce('wal'); // journal_mode

      const result = MigrationService.validateSchema();

      expect(result).toMatchObject({
        valid: true,
        errors: []
      });
    });

    it('should detect missing tables', () => {
      const mockStmt = {
        get: vi.fn()
          .mockReturnValueOnce({ name: 'settings' })
          .mockReturnValueOnce(null) // customers missing
          .mockReturnValueOnce({ name: 'offers' })
          .mockReturnValueOnce(null) // invoices missing
          .mockReturnValueOnce({ name: 'packages' })
          .mockReturnValueOnce({ name: 'numbering_circles' })
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);
      mockDb.pragma
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('wal');

      const result = MigrationService.validateSchema();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required table: customers');
      expect(result.errors).toContain('Missing required table: invoices');
    });

    it('should detect foreign key constraint issues', () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue({ name: 'test' }) // All tables exist
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);
      mockDb.pragma
        .mockReturnValueOnce(false) // foreign_keys disabled
        .mockReturnValueOnce('wal');

      const result = MigrationService.validateSchema();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Foreign key constraints are not enabled');
    });

    it('should detect wrong journal mode', () => {
      const mockStmt = {
        get: vi.fn().mockReturnValue({ name: 'test' })
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);
      mockDb.pragma
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('delete'); // Wrong journal mode

      const result = MigrationService.validateSchema();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Journal mode is delete, expected 'wal'");
    });

    it('should handle validation errors', () => {
      const error = new Error('Database locked');
      mockDb.prepare.mockImplementation(() => { throw error; });

      const result = MigrationService.validateSchema();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schema validation failed: Error: Database locked');
    });
  });
});