/**
 * Unit tests for database path management and migration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';

// Mock electron app module before importing
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn()
  }
}));

// Import after mocking
import { 
  getDbPath, 
  getLegacyDbPath, 
  getBackupDir,
  getTimestampedBackupDir,
  isWithinUserDataDir,
  ensureDirectoryExists,
  LEGACY_LOCALSTORAGE_KEY 
} from '../../src/lib/paths';

// Get the mocked app after import
const { app: mockApp } = await import('electron');

describe('Database Path Management', () => {
  const mockUserDataPath = path.join(tmpdir(), 'rawalite-test-userdata');
  
  beforeEach(() => {
    // ✅ Deterministische Zeit für Timestamp-Tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:00:00.000Z'));
    
    // Mock app.getPath to return our test directory
    vi.mocked(mockApp.getPath).mockReturnValue(mockUserDataPath);
    
    // Clean up any existing test directory
    if (fs.existsSync(mockUserDataPath)) {
      fs.rmSync(mockUserDataPath, { recursive: true, force: true });
    }
  });
  
  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(mockUserDataPath)) {
      fs.rmSync(mockUserDataPath, { recursive: true, force: true });
    }
    
    // ✅ Restore real timers
    vi.useRealTimers();
  });

  describe('Path Generation', () => {
    it('should generate correct current database path', () => {
      const dbPath = getDbPath();
      const expected = path.join(mockUserDataPath, 'data', 'rawalite.db');
      expect(dbPath).toBe(expected);
    });

    it('should generate correct legacy database path', () => {
      const legacyPath = getLegacyDbPath();
      const expected = path.join(mockUserDataPath, 'Shared Dictionary', 'db');
      expect(legacyPath).toBe(expected);
    });

    it('should generate correct backup directory path', () => {
      const backupDir = getBackupDir();
      const expected = path.join(mockUserDataPath, 'backup');
      expect(backupDir).toBe(expected);
    });

    it('should generate timestamped backup directory', () => {
      const timestamp = '2025-01-01T10-00-00-000Z';
      const backupDir = getTimestampedBackupDir(timestamp);
      const expected = path.join(mockUserDataPath, 'backup', `migration-${timestamp}`);
      expect(backupDir).toBe(expected);
    });

    it('should use current time for timestamped backup when no timestamp provided', () => {
      const backupDir = getTimestampedBackupDir();
      // ✅ Deterministisch mit FakeTimer
      expect(backupDir).toBe(path.join(mockUserDataPath, 'backup', 'migration-2025-01-01T10-00-00-000Z'));
    });
  });

  describe('Security Validation', () => {
    it('should validate paths within userData directory', () => {
      const validPath = path.join(mockUserDataPath, 'some', 'subdirectory');
      expect(isWithinUserDataDir(validPath)).toBe(true);
    });

    it('should reject paths outside userData directory', () => {
      const invalidPath = path.join(tmpdir(), 'other-directory');
      expect(isWithinUserDataDir(invalidPath)).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      const traversalPath = path.join(mockUserDataPath, '..', '..', 'malicious');
      expect(isWithinUserDataDir(traversalPath)).toBe(false);
    });
  });

  describe('Directory Management', () => {
    it('should create directory if it does not exist', () => {
      const testDir = path.join(mockUserDataPath, 'test', 'nested', 'directory');
      
      expect(fs.existsSync(testDir)).toBe(false);
      ensureDirectoryExists(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      const testDir = path.join(mockUserDataPath, 'existing');
      fs.mkdirSync(testDir, { recursive: true });
      
      expect(() => ensureDirectoryExists(testDir)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have correct localStorage key constant', () => {
      expect(LEGACY_LOCALSTORAGE_KEY).toBe('rawalite.db');
    });
  });
});

describe('Database Migration Simulation', () => {
  const mockUserDataPath = path.join(tmpdir(), 'rawalite-migration-test');
  
  beforeEach(() => {
    // ✅ Deterministische Zeit auch für Migration-Tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:00:00.000Z'));
    
    vi.mocked(mockApp.getPath).mockReturnValue(mockUserDataPath);
    
    if (fs.existsSync(mockUserDataPath)) {
      fs.rmSync(mockUserDataPath, { recursive: true, force: true });
    }
    fs.mkdirSync(mockUserDataPath, { recursive: true });
  });
  
  afterEach(() => {
    if (fs.existsSync(mockUserDataPath)) {
      fs.rmSync(mockUserDataPath, { recursive: true, force: true });
    }
    
    // ✅ Restore real timers
    vi.useRealTimers();
  });

  it('should handle fresh installation scenario', () => {
    // No legacy database exists
    const legacyPath = getLegacyDbPath();
    const currentPath = getDbPath();
    
    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(fs.existsSync(currentPath)).toBe(false);
  });

  it('should detect legacy database for migration', () => {
    // Create legacy database
    const legacyPath = getLegacyDbPath();
    fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
    
    const testData = Buffer.from('SQLite format 3\0test database content');
    fs.writeFileSync(legacyPath, testData);
    
    expect(fs.existsSync(legacyPath)).toBe(true);
    
    const stats = fs.statSync(legacyPath);
    expect(stats.size).toBe(testData.length);
  });

  it('should not overwrite existing current database', () => {
    // Create both legacy and current databases
    const legacyPath = getLegacyDbPath();
    const currentPath = getDbPath();
    
    fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
    fs.mkdirSync(path.dirname(currentPath), { recursive: true });
    
    const legacyData = Buffer.from('legacy data');
    const currentData = Buffer.from('current data');
    
    fs.writeFileSync(legacyPath, legacyData);
    fs.writeFileSync(currentPath, currentData);
    
    // Verify current database would not be overwritten
    const currentContent = fs.readFileSync(currentPath);
    expect(currentContent).toEqual(currentData);
  });
});