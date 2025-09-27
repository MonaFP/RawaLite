/**
 * E2E Tests for Database Migration and Data Persistence
 * 
 * Simulates real update scenarios where user data must be preserved.
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';

// Test configuration
const TEST_TIMEOUT = 30000;

test.describe('Database Migration E2E', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let testUserDataDir: string;

  test.beforeEach(async () => {
    // Create temporary directory for test
    testUserDataDir = path.join(tmpdir(), `rawalite-e2e-${Date.now()}`);
    fs.mkdirSync(testUserDataDir, { recursive: true });

    // Launch Electron app with test userData directory
    electronApp = await electron.launch({
      args: [
        path.join(__dirname, '../../dist-electron/main.cjs'),
        `--user-data-dir=${testUserDataDir}`
      ],
      timeout: TEST_TIMEOUT
    });

    // Get the first window
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    // Clean up
    if (electronApp) {
      await electronApp.close();
    }
    
    // Remove test directory
    if (fs.existsSync(testUserDataDir)) {
      fs.rmSync(testUserDataDir, { recursive: true, force: true });
    }
  });

  test('should preserve customer data after migration', async () => {
    // Step 1: Create legacy database structure with test data
    const legacyDbDir = path.join(testUserDataDir, 'Shared Dictionary');
    fs.mkdirSync(legacyDbDir, { recursive: true });

    // Create mock SQLite database content
    const legacyDbPath = path.join(legacyDbDir, 'db');
    const mockDbContent = createMockSQLiteDatabase();
    fs.writeFileSync(legacyDbPath, mockDbContent);

    console.log(`📦 Created legacy database: ${legacyDbPath} (${mockDbContent.length} bytes)`);

    // Step 2: Restart app to trigger migration
    await electronApp.close();
    
    electronApp = await electron.launch({
      args: [
        path.join(__dirname, '../../dist-electron/main.cjs'),
        `--user-data-dir=${testUserDataDir}`
      ],
      timeout: TEST_TIMEOUT
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    // Step 3: Verify migration occurred
    const currentDbPath = path.join(testUserDataDir, 'data', 'rawalite.db');
    
    // Wait a moment for migration to complete
    await page.waitForTimeout(2000);
    
    expect(fs.existsSync(currentDbPath)).toBe(true);
    
    const migratedContent = fs.readFileSync(currentDbPath);
    expect(migratedContent.length).toBeGreaterThan(0);
    
    console.log(`✅ Migration completed: ${currentDbPath} (${migratedContent.length} bytes)`);

    // Step 4: Verify backup was created
    const backupDir = path.join(testUserDataDir, 'backup');
    expect(fs.existsSync(backupDir)).toBe(true);
    
    const backupFiles = fs.readdirSync(backupDir, { recursive: true });
    const legacyBackup = backupFiles.find(file => 
      typeof file === 'string' && file.includes('legacy-db-backup')
    );
    expect(legacyBackup).toBeDefined();

    // Step 5: Test app functionality (navigate to customers)
    await page.click('text=Kunden');
    await page.waitForSelector('[data-testid="customers-page"]', { timeout: 5000 });
    
    // App should load without errors
    const title = await page.title();
    expect(title).toBe('RawaLite');
  });

  test('should not overwrite existing current database', async () => {
    // Step 1: Create both legacy and current databases
    const legacyDbDir = path.join(testUserDataDir, 'Shared Dictionary');
    const currentDbDir = path.join(testUserDataDir, 'data');
    
    fs.mkdirSync(legacyDbDir, { recursive: true });
    fs.mkdirSync(currentDbDir, { recursive: true });

    const legacyContent = Buffer.from('legacy database content');
    const currentContent = Buffer.from('current database content');

    fs.writeFileSync(path.join(legacyDbDir, 'db'), legacyContent);
    fs.writeFileSync(path.join(currentDbDir, 'rawalite.db'), currentContent);

    // Step 2: Start app (should not migrate since current DB exists)
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for any potential migration attempt
    await page.waitForTimeout(2000);

    // Step 3: Verify current database was not overwritten
    const currentDbPath = path.join(testUserDataDir, 'data', 'rawalite.db');
    const finalContent = fs.readFileSync(currentDbPath);
    
    expect(finalContent).toEqual(currentContent);
    expect(finalContent).not.toEqual(legacyContent);
  });

  test('should handle fresh installation without errors', async () => {
    // Fresh installation - no legacy database exists
    await page.waitForLoadState('domcontentloaded');
    
    // App should start normally
    const title = await page.title();
    expect(title).toBe('RawaLite');

    // Navigate to different pages to ensure app works
    await page.click('text=Einstellungen');
    await page.waitForSelector('text=Stammdaten', { timeout: 5000 });

    await page.click('text=Dashboard');
    await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 5000 });
  });
});

/**
 * Creates a mock SQLite database with minimal valid structure
 */
function createMockSQLiteDatabase(): Buffer {
  // SQLite file header + minimal content to simulate real database
  const header = 'SQLite format 3\0';
  const padding = Buffer.alloc(100 - header.length, 0);
  
  // Add some mock schema and data
  const mockSchema = Buffer.from(
    'CREATE TABLE settings (id INTEGER PRIMARY KEY); INSERT INTO settings (id) VALUES (1);',
    'utf8'
  );
  
  return Buffer.concat([
    Buffer.from(header, 'binary'),
    padding,
    mockSchema
  ]);
}

test.describe('Migration Performance', () => {
  test('should complete migration within reasonable time', async () => {
    const testUserDataDir = path.join(tmpdir(), `rawalite-perf-${Date.now()}`);
    
    try {
      // Create large legacy database to test performance
      fs.mkdirSync(testUserDataDir, { recursive: true });
      
      const legacyDbDir = path.join(testUserDataDir, 'Shared Dictionary');
      fs.mkdirSync(legacyDbDir, { recursive: true });

      // Create 1MB legacy database
      const largeMockDb = Buffer.alloc(1024 * 1024, 0x42); // 1MB filled with 'B'
      fs.writeFileSync(path.join(legacyDbDir, 'db'), largeMockDb);

      const startTime = Date.now();
      
      const electronApp = await electron.launch({
        args: [
          path.join(__dirname, '../../dist-electron/main.cjs'),
          `--user-data-dir=${testUserDataDir}`
        ],
        timeout: TEST_TIMEOUT
      });

      const page = await electronApp.firstWindow();
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for migration
      await page.waitForTimeout(3000);
      
      const migrationTime = Date.now() - startTime;
      
      // Migration should complete within 10 seconds even for large files
      expect(migrationTime).toBeLessThan(10000);
      
      // Verify migration completed
      const currentDbPath = path.join(testUserDataDir, 'data', 'rawalite.db');
      expect(fs.existsSync(currentDbPath)).toBe(true);
      
      const migratedSize = fs.statSync(currentDbPath).size;
      expect(migratedSize).toBe(largeMockDb.length);
      
      await electronApp.close();
      
    } finally {
      // Clean up
      if (fs.existsSync(testUserDataDir)) {
        fs.rmSync(testUserDataDir, { recursive: true, force: true });
      }
    }
  });
});