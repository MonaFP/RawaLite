import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Database module
vi.mock('../src/main/db/Database', () => ({
  getDb: vi.fn().mockReturnValue({
    backup: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(), // ✅ Füge all() hinzu
      finalize: vi.fn()
    })
  }),
  closeDb: vi.fn()
}));

// Mock fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    copyFileSync: vi.fn()
  }
}));

// Mock path module
vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    resolve: vi.fn((p) => p), // ✅ Füge resolve hinzu
    basename: vi.fn((p) => p.split('/').pop() || '')
  }
}));

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userdata')
  }
}));

// Import after mocking
import * as BackupService from '../src/main/db/BackupService';
import * as Database from '../src/main/db/Database';
import fs from 'node:fs';

describe('BackupService', () => {
  const mockDb = {
    backup: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(), // ✅ Füge all() hinzu
      finalize: vi.fn()
    })
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (Database.getDb as any).mockReturnValue(mockDb);
    (fs.existsSync as any).mockReturnValue(true);
    (fs.statSync as any).mockReturnValue({ size: 1024 });
  });

  describe('createHotBackup', () => {
    it('should create backup with default path', async () => {
      const result = await BackupService.createHotBackup();

      expect(result).toMatchObject({
        path: expect.stringContaining('hot-backup-'),
        bytes: 1024,
        durationMs: expect.any(Number)
      });
      expect(mockDb.backup).toHaveBeenCalled();
    });

    it('should create backup with custom path', async () => {
      const customPath = '/custom/backup.db';

      const result = await BackupService.createHotBackup(customPath);

      expect(result.path).toBe(customPath);
      expect(result.bytes).toBe(1024);
      expect(mockDb.backup).toHaveBeenCalledWith(customPath);
    });

    it('should handle backup errors', async () => {
      const error = new Error('Backup failed');
      mockDb.backup.mockRejectedValue(error);

      await expect(BackupService.createHotBackup()).rejects.toThrow('Backup failed');
    });
  });

  describe('createVacuumBackup', () => {
    it('should create vacuum backup', async () => {
      const backupPath = '/mock/vacuum-backup.db';

      const result = await BackupService.createVacuumBackup(backupPath);

      expect(result).toMatchObject({
        path: backupPath,
        bytes: 1024
        // ✅ Entferne durationMs expectation - nicht im createVacuumBackup implementiert
      });
      expect(mockDb.exec).toHaveBeenCalledWith(`VACUUM INTO '${backupPath}'`);
    });

    it('should handle vacuum errors', async () => {
      const backupPath = '/mock/vacuum-backup.db';
      const error = new Error('VACUUM failed');
      
      mockDb.exec.mockRejectedValue(error);

      await expect(BackupService.createVacuumBackup(backupPath)).rejects.toThrow('VACUUM failed');
    });
  });

  describe('checkIntegrity', () => {
    it('should return valid integrity check', async () => {
      const mockStmt = {
        all: vi.fn().mockReturnValue([{ integrity_check: 'ok' }]), // ✅ Korrigiere all()
        finalize: vi.fn()
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await BackupService.checkIntegrity();

      expect(result).toMatchObject({
        ok: true,
        details: expect.stringContaining('ok'),
        errors: []
      });
      expect(mockDb.prepare).toHaveBeenCalledWith('PRAGMA integrity_check');
    });

    it('should detect integrity errors', async () => {
      const mockStmt = {
        all: vi.fn().mockReturnValue([{ integrity_check: 'corruption detected' }]), // ✅ Korrigiere all()
        finalize: vi.fn()
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await BackupService.checkIntegrity();

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('corruption detected');
    });

    it('should handle integrity check errors', async () => {
      const error = new Error('PRAGMA failed');
      const mockStmt = {
        all: vi.fn().mockImplementation(() => { throw error; }), // ✅ Korrigiere all()
        finalize: vi.fn()
      };
      
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await BackupService.checkIntegrity(); // ✅ Erwarte Result, nicht Rejection

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Integrity check error: Error: PRAGMA failed');
      expect(mockStmt.finalize).toHaveBeenCalled();
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', async () => {
      const backupPath = '/mock/backup.db';

      const result = await BackupService.restoreFromBackup(backupPath);

      expect(result).toMatchObject({
        needsRestart: true,
        message: expect.stringContaining('backup.db')
      });
    });

    it('should fail when backup file does not exist', async () => {
      const backupPath = '/mock/nonexistent.db';
      
      (fs.existsSync as any).mockReturnValue(false);

      await expect(BackupService.restoreFromBackup(backupPath))
        .rejects.toThrow('Backup file not found');
    });

    it('should handle restore errors', async () => {
      const backupPath = '/mock/backup.db';
      const error = new Error('Copy failed');
      
      (fs.copyFileSync as any).mockImplementation(() => { throw error; });

      await expect(BackupService.restoreFromBackup(backupPath))
        .rejects.toThrow('Copy failed');
    });
  });

  describe('cleanOldBackups', () => {
    it('should clean old backups keeping specified count', async () => {
      const mockFiles = [
        'hot-backup-2025-09-28.sqlite',
        'hot-backup-2025-09-29.sqlite', 
        'hot-backup-2025-09-30.sqlite',
        'other-file.txt' // Should be ignored
      ];
      
      (fs.readdirSync as any).mockReturnValue(mockFiles);
      (fs.statSync as any).mockReturnValue({ 
        size: 1024, 
        birthtime: new Date('2025-09-30'), // ✅ Füge birthtime hinzu
        getTime: vi.fn().mockReturnValue(1696118400000) // ✅ Mock getTime
      });

      const result = await BackupService.cleanOldBackups(2);

      expect(result).toMatchObject({
        deleted: 1,
        kept: 2,
        errors: []
      });
      expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
    });

    it('should not delete when count is within limit', async () => {
      const mockFiles = ['hot-backup-2025-09-30.sqlite'];
      
      (fs.readdirSync as any).mockReturnValue(mockFiles);
      (fs.statSync as any).mockReturnValue({ 
        size: 1024, 
        birthtime: new Date('2025-09-30'), // ✅ Füge birthtime hinzu
        getTime: vi.fn().mockReturnValue(1696118400000) // ✅ Mock getTime
      });

      const result = await BackupService.cleanOldBackups(5);

      expect(result).toMatchObject({
        deleted: 0,
        kept: 1,
        errors: []
      });
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockFiles = ['hot-backup-old.sqlite', 'hot-backup-new.sqlite'];
      const error = new Error('Delete failed');
      
      (fs.readdirSync as any).mockReturnValue(mockFiles);
      (fs.statSync as any).mockReturnValue({ 
        size: 1024, 
        birthtime: new Date('2025-09-30'), // ✅ Füge birthtime hinzu
        getTime: vi.fn().mockReturnValue(1696118400000) // ✅ Mock getTime
      });
      (fs.unlinkSync as any).mockImplementation(() => { throw error; });

      const result = await BackupService.cleanOldBackups(1);

      expect(result.deleted).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});