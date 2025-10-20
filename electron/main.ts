// electron/main.ts - Clean Refactored Version

import { app, BrowserWindow, ipcMain } from 'electron'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
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
import { registerFileHandlers } from './ipc/files'
import { registerUpdateManagerHandlers } from './ipc/update-manager'
import { registerUpdateIpc } from './ipc/updates'
import { initializeThemeIpc } from './ipc/themes'
import { initializeNavigationIpc } from './ipc/navigation'


console.log('[RawaLite] MAIN ENTRY:', __filename, 'NODE_ENV=', process.env.NODE_ENV);

const isDev = !app.isPackaged

// 🗄️ Database IPC Handlers - EXTRACTED to ipc/database.ts

// 💾 Backup IPC Handlers - EXTRACTED to ipc/backup.ts

// 📁 File Management IPC Handlers - EXTRACTED to ipc/files.ts

// 📱 Update Manager Windows - EXTRACTED to ipc/update-manager.ts

// === APP INITIALIZATION ===
let updateManager: UpdateManagerService;

app.whenReady().then(async () => {
  try {
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
    registerFileHandlers();
    registerUpdateManagerHandlers();
    
    // Initialize theme service with database
    initializeThemeIpc(getDb());
    
    // Initialize navigation service with database
    initializeNavigationIpc(getDb());
    
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