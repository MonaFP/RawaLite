// electron/main.ts - Clean Refactored Version

import { app, BrowserWindow, ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
// ✅ FIX-1.4: Config Validation
import { ConfigValidationService } from '../src/main/services/ConfigValidationService'
// 🗄️ Database imports
import { getDb } from '../src/main/db/Database'
import { runAllMigrations } from '../src/main/db/MigrationService'
// 📱 Window Management - EXTRACTED
import { createWindow } from './windows/main-window'
import { createUpdateManagerWindow } from './windows/update-window'
import { createUpdateManagerDevWindow } from './windows/updateManagerDev'
// 🔌 IPC Handlers - ALL EXTRACTED
import { registerPathHandlers } from './ipc/paths'
import { registerFilesystemHandlers } from './ipc/filesystem'
import { registerStatusHandlers } from './ipc/status'
import { registerNumberingHandlers } from './ipc/numbering'
import { registerPdfCoreHandlers } from './ipc/pdf-core'
import { registerDatabaseHandlers } from './ipc/database'
import { registerBackupHandlers } from './ipc/backup'
import { registerRollbackHandlers } from './ipc/rollback' // ✅ Phase 2: Rollback handlers
import { registerFileHandlers } from './ipc/files'
import { registerUpdateManagerHandlers } from './ipc/update-manager'
import { registerUpdateIpc } from './ipc/updates'
import { initializeThemeIpc } from './ipc/themes'
import { initializeFooterIpc } from './ipc/footer'
import { initializeNavigationIpc } from './ipc/navigation'
import { initializeConfigurationIpc } from './ipc/configuration'


console.log('[RawaLite] MAIN ENTRY:', __filename, 'NODE_ENV=', process.env.NODE_ENV);

const isDev = !app.isPackaged

// ✅ FIX-1.3: isDev logging for environment detection
console.log(`[RawaLite] Environment: ${isDev ? '🔨 DEVELOPMENT' : '🚀 PRODUCTION'} (isPackaged=${app.isPackaged})`);
console.log(`[RawaLite] Database will use: ${isDev ? 'rawalite-dev.db' : 'rawalite.db'}`);

// 🗄️ Database IPC Handlers - EXTRACTED to ipc/database.ts

// 💾 Backup IPC Handlers - EXTRACTED to ipc/backup.ts

// 📁 File Management IPC Handlers - EXTRACTED to ipc/files.ts

// 📱 Update Manager Windows - EXTRACTED to ipc/update-manager.ts

// === APP INITIALIZATION ===
let updateManager: UpdateManagerService;

// 🆕 PHASE 1: Fresh DB on First Install Detection
const DB_INITIALIZED_MARKER = path.join(
  app.getPath('userData'),
  'database',
  '.db-initialized'
);

const ensureFreshDbOnFirstRun = () => {
  const isFirstRun = !fs.existsSync(DB_INITIALIZED_MARKER);
  
  if (isFirstRun) {
    console.log('🆕 [PHASE 1] First run detected - Fresh DB initialization starting...');
    
    try {
      const dbPath = path.join(app.getPath('userData'), 'database', 'rawalite.db');
      const dbDir = path.dirname(dbPath);
      
      // Ensure directory exists
      fs.mkdirSync(dbDir, { recursive: true });
      
      // Remove old DB if exists (clean slate)
      if (fs.existsSync(dbPath)) {
        console.log(`  ⚠️  Found existing DB, removing for fresh start: ${dbPath}`);
        fs.unlinkSync(dbPath);
      }
      
      console.log(`  ✅ Fresh DB path ready: ${dbPath}`);
      
      // Create marker file
      const markerDir = path.dirname(DB_INITIALIZED_MARKER);
      fs.mkdirSync(markerDir, { recursive: true });
      fs.writeFileSync(DB_INITIALIZED_MARKER, JSON.stringify({
        version: app.getVersion(),
        timestamp: new Date().toISOString(),
        initialized: true,
        type: 'fresh-start'
      }, null, 2));
      
      console.log(`  ✅ [PHASE 1] First-run marker created`);
    } catch (error) {
      console.error('❌ [PHASE 1] Error during first-run setup:', error);
      throw error;
    }
  } else {
    console.log('✅ [PHASE 1] Existing installation detected - using existing DB');
  }
};

app.whenReady().then(async () => {
  try {
    // 🆕 PHASE 1: Ensure fresh DB on first run
    console.log('🆕 [PHASE 1] Checking first-run status...');
    ensureFreshDbOnFirstRun();
    
    // ✅ FIX-1.4: Validate configuration before startup
    console.log('🔧 Validating application configuration...')
    const configValidation = ConfigValidationService.validateConfiguration()
    
    if (!configValidation.valid) {
      console.error('❌ Configuration validation failed:')
      configValidation.errors.forEach(error => console.error(`  - ${error}`))
      app.quit()
      return
    }
    
    if (configValidation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:')
      configValidation.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
    
    console.log(`✅ Configuration valid (${configValidation.environment} environment)`)

    // Initialize database connection
    console.log('🗄️ Initializing database...')
    getDb()
    
    // Run pending migrations
    console.log('🔄 Running database migrations...')
    await runAllMigrations()
    
    // Initialize UpdateManager and register IPC
    updateManager = new UpdateManagerService();
    updateManager.initializeHistoryService(getDb());
    registerUpdateIpc(updateManager);
    
    // Register all extracted IPC handlers
    registerPathHandlers();
    registerFilesystemHandlers();
    registerStatusHandlers();
    registerNumberingHandlers();
    registerPdfCoreHandlers();
    registerDatabaseHandlers();
    registerBackupHandlers();
    registerRollbackHandlers(); // ✅ Phase 2: Rollback & migration handlers
    registerFileHandlers();
    registerUpdateManagerHandlers();
    
    // Initialize theme service with database
    initializeThemeIpc(getDb());
    initializeFooterIpc(getDb());
    
    // Initialize navigation service with database
    initializeNavigationIpc(getDb());
    
    // Initialize configuration service with database
    initializeConfigurationIpc(getDb());
    
    // Setup Update Event Forwarding to UI
    updateManager.onUpdateEvent((event) => {
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach(window => {
        window.webContents.send('updates:event', event);
      });
    });
    
    // Create main window
    createWindow()
    
    console.log('✅ Application ready with all modules initialized')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    app.quit()
  }
})

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') app.quit() 
})

app.on('activate', () => { 
  if (BrowserWindow.getAllWindows().length === 0) createWindow() 
})

console.log('✅ Main process initialization complete');