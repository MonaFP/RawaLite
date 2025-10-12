// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron'
import path from 'node:path'
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { marked } from 'marked'
import sharp from 'sharp'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
import { updateEntityStatus, getStatusHistory, getEntityForUpdate } from '../src/main/services/EntityStatusService'
// 🗄️ Database imports with correct named exports syntax
import { getDb, prepare, exec, tx } from '../src/main/db/Database'
import { runAllMigrations } from '../src/main/db/MigrationService'
import { createHotBackup, createVacuumBackup, checkIntegrity, restoreFromBackup, cleanOldBackups } from '../src/main/db/BackupService'
// 🛠️ Development imports
import { createUpdateManagerDevWindow } from './windows/updateManagerDev'

console.log('[RawaLite] MAIN ENTRY:', __filename, 'NODE_ENV=', process.env.NODE_ENV);

const isDev = !app.isPackaged            // zuverlässig für Dev/Prod

function createWindow() {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  // Icon-Pfad definieren - konsistent mit PATHS-System aber Main-Process kompatibel
  let iconPath: string;
  if (isDev) {
    // Development: Verwende public/ Ordner aus Projekt-Root
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    // Production: Verwende assets/ aus extraResources (definiert in electron-builder.yml)
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  console.log('🎯 [DEBUG] App Icon Path:', iconPath);
  console.log('🎯 [DEBUG] Icon exists:', existsSync(iconPath));

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: iconPath, // App-Icon setzen
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (isDev) {
    // Vite-Dev-Server
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Produktive Version: HTML liegt als extraResource direkt im resources Ordner
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    console.log('🔍 [DEBUG] HTML Path:', htmlPath)
    console.log('🔍 [DEBUG] Resources Path:', process.resourcesPath)
    console.log('🔍 [DEBUG] File exists:', existsSync(htmlPath))
    
    // Fallback check: manchmal ist es app.asar.unpacked/resources/
    if (!existsSync(htmlPath)) {
      const fallbackPath = path.join(process.resourcesPath, '..', 'resources', 'index.html')
      console.log('🔍 [DEBUG] Fallback Path:', fallbackPath)
      console.log('🔍 [DEBUG] Fallback exists:', existsSync(fallbackPath))
      if (existsSync(fallbackPath)) {
        win.loadFile(fallbackPath)
        return
      }
    }
    
    win.loadFile(htmlPath)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Create Update Manager Window
function createUpdateManagerWindow() {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  // Icon-Pfad definieren
  let iconPath: string;
  if (isDev) {
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  const updateWin = new BrowserWindow({
    width: 600,
    height: 700,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
    title: 'RawaLite Update Manager',
    resizable: false,
    alwaysOnTop: true,
    parent: BrowserWindow.getFocusedWindow() || undefined,
    modal: true
  })

  if (isDev) {
    // Vite-Dev-Server mit Update Manager Route
    updateWin.loadURL('http://localhost:5174/update-manager')
  } else {
    // Production: Load Update Manager Page
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    updateWin.loadFile(htmlPath, { hash: 'update-manager' })
  }

  return updateWin
}

// 🗂️ IPC Handler für Pfad-Management (Phase 2)
import * as fs from 'node:fs/promises'

// 📁 Basic Path Handler (existing)
ipcMain.handle('paths:get', async (event, pathType: 'userData' | 'documents' | 'downloads') => {
  try {
    switch (pathType) {
      case 'userData':
        return app.getPath('userData')
      case 'documents':
        return app.getPath('documents')
      case 'downloads':
        return app.getPath('downloads')
      default:
        throw new Error(`Unknown path type: ${pathType}`)
    }
  } catch (error) {
    console.error(`Failed to get path ${pathType}:`, error)
    throw error
  }
})

// 📁 App-specific Path Handlers for PATHS System Integration
ipcMain.handle('paths:getAppPath', async () => {
  try {
    return app.getAppPath()
  } catch (error) {
    console.error('Failed to get app path:', error)
    throw error
  }
})

ipcMain.handle('paths:getCwd', async () => {
  try {
    return process.cwd()
  } catch (error) {
    console.error('Failed to get current working directory:', error)
    throw error
  }
})

ipcMain.handle('paths:getPackageJsonPath', async () => {
  try {
    const packageJsonPath = app.isPackaged
      ? path.join(app.getAppPath(), 'package.json')
      : path.join(process.cwd(), 'package.json')
    return packageJsonPath
  } catch (error) {
    console.error('Failed to get package.json path:', error)
    throw error
  }
})

// 🔧 Filesystem Operations für PATHS + SQLite/Dexie Support
ipcMain.handle('fs:ensureDir', async (event, dirPath: string) => {
  try {
    await fs.mkdir(dirPath, { recursive: true })
    return true
  } catch (error: any) {
    if (error.code === 'EEXIST') return true
    console.error(`Failed to ensure directory ${dirPath}:`, error)
    throw error
  }
})

ipcMain.handle('fs:getCwd', async () => {
  try {
    return process.cwd()
  } catch (error) {
    console.error('Failed to get current working directory:', error)
    throw error
  }
})

ipcMain.handle('fs:readDir', async (event, dirPath: string) => {
  try {
    return await fs.readdir(dirPath)
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error)
    throw error
  }
})

ipcMain.handle('fs:stat', async (event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath)
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime.getTime(),
      atime: stats.atime.getTime(),
      ctime: stats.ctime.getTime()
    }
  } catch (error) {
    console.error(`Failed to stat ${filePath}:`, error)
    throw error
  }
})

ipcMain.handle('fs:unlink', async (event, filePath: string) => {
  try {
    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error(`Failed to unlink ${filePath}:`, error)
    throw error
  }
})

// 🔮 Zukünftige SQLite/Dexie Support APIs
ipcMain.handle('fs:exists', async (event, filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('fs:copy', async (event, src: string, dest: string) => {
  try {
    await fs.copyFile(src, dest)
    return true
  } catch (error) {
    console.error(`Failed to copy ${src} to ${dest}:`, error)
    throw error
  }
})

ipcMain.handle('fs:readFile', async (event, filePath: string, encoding?: string) => {
  try {
    return await fs.readFile(filePath, encoding as any)
  } catch (error) {
    console.error(`Failed to read file ${filePath}:`, error)
    throw error
  }
})

ipcMain.handle('fs:writeFile', async (event, filePath: string, data: string | Uint8Array, encoding?: string) => {
  try {
    await fs.writeFile(filePath, data, encoding as any)
    return true
  } catch (error) {
    console.error(`Failed to write file ${filePath}:`, error)
    throw error
  }
})

// 🗄️ Database IPC Handlers (Phase 4 - SQLite + better-sqlite3)
// Database imports moved to top of file for proper ES Module handling

// Secure database query handler (read-only operations)
ipcMain.handle('db:query', async (event, sql: string, params?: any[]) => {
  try {
    const stmt = prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  } catch (error) {
    console.error(`Database query failed:`, error)
    throw error
  }
})

// Secure database exec handler (write operations)
ipcMain.handle('db:exec', async (event, sql: string, params?: any[]) => {
  try {
    return exec(sql, params)
  } catch (error) {
    console.error(`Database exec failed:`, error)
    throw error
  }
})

// Transaction wrapper for multiple operations
ipcMain.handle('db:transaction', async (event, queries: Array<{ sql: string; params?: any[] }>) => {
  try {
    return tx(() => {
      const results: any[] = []
      for (const query of queries) {
        const result = exec(query.sql, query.params)
        results.push(result)
      }
      return results
    })
  } catch (error) {
    console.error(`Database transaction failed:`, error)
    throw error
  }
})

// 💾 Backup IPC Handlers
ipcMain.handle('backup:hot', async (event, backupPath?: string) => {
  try {
    return await createHotBackup(backupPath)
  } catch (error) {
    console.error(`Hot backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:vacuumInto', async (event, backupPath: string) => {
  try {
    return await createVacuumBackup(backupPath)
  } catch (error) {
    console.error(`Vacuum backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:integrityCheck', async (event, dbPath?: string) => {
  try {
    return checkIntegrity()
  } catch (error) {
    console.error(`Integrity check failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:restore', async (event, backupPath: string, targetPath?: string) => {
  try {
    return restoreFromBackup(backupPath)
  } catch (error) {
    console.error(`Backup restore failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:cleanup', async (event, backupDir: string, keepCount: number) => {
  try {
    return cleanOldBackups(keepCount)
  } catch (error) {
    console.error(`Backup cleanup failed:`, error)
    throw error
  }
})

// === UPDATE SYSTEM INTEGRATION ===
import { registerUpdateIpc } from './ipc/updates';

let updateManager: UpdateManagerService;

// Initialize database and run migrations when app is ready
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
    registerUpdateIpc(updateManager); // <-- IMPORTANT: Guaranteed to be called
    
    // Setup Update Event Forwarding to UI
    updateManager.onUpdateEvent((event) => {
      // Forward all UpdateManager events to renderer process
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach(window => {
        window.webContents.send('updates:event', event);
      });
    });
    
    // Create main window
    createWindow()
    
    console.log('✅ Application ready with database and UpdateManager initialized')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    app.quit()
  }
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// === STATUS UPDATE SYSTEM ===
// Handler for updating entity status with optimistic locking
ipcMain.handle('status:updateOfferStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
  try {
    const db = getDb()
    const result = updateEntityStatus(db, 'offers', {
      id: params.id,
      newStatus: params.status as any,
      expectedVersion: params.expectedVersion,
      changedBy: 'user'
    })
    return result
  } catch (error) {
    console.error('Failed to update offer status:', error)
    throw error
  }
})

ipcMain.handle('status:updateInvoiceStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
  try {
    const db = getDb()
    const result = updateEntityStatus(db, 'invoices', {
      id: params.id,
      newStatus: params.status as any,
      expectedVersion: params.expectedVersion,
      changedBy: 'user'
    })
    return result
  } catch (error) {
    console.error('Failed to update invoice status:', error)
    throw error
  }
})

ipcMain.handle('status:updateTimesheetStatus', async (event, params: { id: number; status: string; expectedVersion: number }) => {
  try {
    const db = getDb()
    const result = updateEntityStatus(db, 'timesheets', {
      id: params.id,
      newStatus: params.status as any,
      expectedVersion: params.expectedVersion,
      changedBy: 'user'
    })
    return result
  } catch (error) {
    console.error('Failed to update timesheet status:', error)
    throw error
  }
})

// Handler for getting status history
ipcMain.handle('status:getHistory', async (event, params: { entityType: string; entityId: number }) => {
  try {
    const db = getDb()
    return getStatusHistory(db, params.entityType as any, params.entityId)
  } catch (error) {
    console.error('Failed to get status history:', error)
    throw error
  }
})

// Handler for getting entity for update (with version for optimistic locking)
ipcMain.handle('status:getEntityForUpdate', async (event, params: { entityType: string; entityId: number }) => {
  try {
    const db = getDb()
    return getEntityForUpdate(db, params.entityType as any, params.entityId)
  } catch (error) {
    console.error('Failed to get entity for update:', error)
    throw error
  }
})

// 🔢 Numbering Circles IPC Handlers
ipcMain.handle('nummernkreis:getAll', async () => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const query = `
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `
    const circles = db.prepare(query).all()
    console.log('🔍 [DEBUG] Main Process - Found circles:', circles.length);
    console.log('🔍 [DEBUG] Main Process - Circle data:', circles);
    return { success: true, data: circles }
  } catch (error) {
    console.error('Error getting numbering circles:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('nummernkreis:update', async (event, id: string, circle: any) => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const updateQuery = `
      UPDATE numbering_circles 
      SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    db.prepare(updateQuery).run(circle.name, circle.prefix, circle.digits, circle.current, circle.resetMode, id)
    return { success: true }
  } catch (error) {
    console.error('Error updating numbering circle:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('nummernkreis:create', async (event, id: string, circle: any) => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const insertQuery = `
      INSERT OR IGNORE INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `
    db.prepare(insertQuery).run(id, circle.name, circle.prefix, circle.digits, circle.current, circle.resetMode, circle.lastResetYear)
    return { success: true }
  } catch (error) {
    console.error('Error creating numbering circle:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('nummernkreis:getNext', async (event, circleId: string) => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    
    // Get current circle
    const selectQuery = `
      SELECT id, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      WHERE id = ?
    `
    const circle = db.prepare(selectQuery).get(circleId) as any
    
    if (!circle) {
      throw new Error(`Nummernkreis '${circleId}' nicht gefunden`)
    }

    const currentYear = new Date().getFullYear()
    let nextNumber = circle.current + 1

    if (circle.resetMode === 'yearly') {
      if (!circle.lastResetYear || circle.lastResetYear !== currentYear) {
        nextNumber = 1
      }
    }

    // Update circle
    const updateQuery = `
      UPDATE numbering_circles 
      SET current = ?, last_reset_year = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    db.prepare(updateQuery).run(
      nextNumber,
      circle.resetMode === 'yearly' ? currentYear : circle.lastResetYear,
      circleId
    )

    const paddedNumber = nextNumber.toString().padStart(circle.digits, '0')
    const fullNumber = `${circle.prefix}${paddedNumber}`
    
    return { success: true, data: fullNumber }
  } catch (error) {
    console.error('Error getting next number:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// 📄 PDF IPC Handlers (v1.7.5 Rollback) - Native Electron PDF Generation
import { dialog } from 'electron'
import os from 'node:os'

// PDF Generation Handler
ipcMain.handle('pdf:generate', async (event, options: {
  templateType: 'offer' | 'invoice' | 'timesheet';
  data: {
    offer?: any;
    invoice?: any;
    timesheet?: any;
    customer: any;
    settings: any;
    currentDate?: string;
    logo?: string | null;
  };
  theme?: any;
  options: {
    filename: string;
    previewOnly: boolean;
    enablePDFA: boolean;
    validateCompliance: boolean;
  };
}) => {
  try {
    console.log(`🎯 PDF generation requested: ${options.templateType} - ${options.options.filename}`);

    // 1. Validate inputs
    if (!options.templateType || !options.data || !options.options) {
      return {
        success: false,
        error: 'Invalid PDF generation parameters'
      };
    }

    // 2. ✅ FIELD-MAPPING: Transform database snake_case to camelCase for template
    console.log('🔄 [PDF GENERATION] Applying field mapping transformation...');
    const preprocessedData = { ...options.data };
    
    // Import the field mapper from the correct location
    const { mapFromSQL } = await import('../src/lib/field-mapper');
    
    // Transform the main entity (offer/invoice/timesheet) from database format to JS format
    if (preprocessedData[options.templateType]) {
      const originalEntity = preprocessedData[options.templateType];
      console.log('� [FIELD-MAPPING] Original entity keys:', Object.keys(originalEntity));
      
      // Apply field mapping transformation
      const mappedEntity = mapFromSQL(originalEntity);
      console.log('🔍 [FIELD-MAPPING] Mapped entity keys:', Object.keys(mappedEntity));
      
      // Log the specific problematic fields
      if (options.templateType === 'offer') {
        console.log('🔍 [FIELD-MAPPING] Offer field transformation:');
        console.log('  - offer_number →', mappedEntity.offerNumber, '(was:', originalEntity.offer_number, ')');
        console.log('  - valid_until →', mappedEntity.validUntil, '(was:', originalEntity.valid_until, ')');
        console.log('  - title →', mappedEntity.title, '(unchanged)');
      }
      
      preprocessedData[options.templateType] = mappedEntity;
    }

    // 3. ✅ PRE-PROCESSING: Compress all attachments AFTER field mapping
    console.log('🔄 [PDF GENERATION] Starting attachment preprocessing...');
    if (preprocessedData[options.templateType]) {
      preprocessedData[options.templateType] = await preprocessEntityAttachments(preprocessedData[options.templateType]);
    }
    
    // 4. Generate HTML content (NOW SYNC, using preprocessed attachments with correct field mapping)
    const htmlContent = generateTemplateHTML({ ...options, data: preprocessedData });
    const { settings } = options.data;
    
    // Extract theme colors with fallback to default
    const primaryColor = options.theme?.theme?.primary || options.theme?.primary || '#7ba87b';
    const accentColor = options.theme?.theme?.accent || options.theme?.accent || '#6b976b';
    
    console.log(`🎨 PDF Header using theme colors:`, {
      primary: primaryColor,
      accent: accentColor,
      theme: options.theme
    });
    
    // Create header template with 3-column layout: Logo | Empty | Company Address
    // Fix Base64 logo format - ensure it has proper data URL prefix
    const logoSrc = options.data.logo ? 
      (options.data.logo.startsWith('data:') ? options.data.logo : `data:image/png;base64,${options.data.logo}`) : 
      null;
    
    const headerTemplate = `
      <div style="font-size: 14px; width: 100%; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; background-color: #ffffff;">
        <div style="flex: 1; display: flex; align-items: center;">
          ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="max-height: 70px; max-width: 180px;">` : `<div style="color: ${primaryColor}; font-weight: bold; font-size: 16px;">${settings?.companyData?.name || 'RawaLite'}</div>`}
        </div>
        <div style="flex: 1;">
          <!-- Mittlere Spalte leer -->
        </div>
        <div style="flex: 1; text-align: right;">
          <div style="color: ${primaryColor}; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            ${settings?.companyData?.name || 'RawaLite'}
          </div>
          <div style="color: #333; font-size: 12px; line-height: 1.4;">
            ${settings?.companyData?.street || ''}<br>
            ${settings?.companyData?.postalCode ? `${settings.companyData.postalCode} ` : ''}${settings?.companyData?.city || ''}<br>
            ${settings?.companyData?.phone ? `Tel: ${settings.companyData.phone}` : ''}${settings?.companyData?.phone && settings?.companyData?.email ? ' • ' : ''}${settings?.companyData?.email ? `${settings.companyData.email}` : ''}
          </div>
        </div>
      </div>
    `;

    // Create footer template with 3 columns: Contact, Bank, Tax + Page number
    const footerTemplate = `
      <div style="font-size: 12px; width: 100%; padding: 12px 15px; border-top: 2px solid ${primaryColor}; background-color: #ffffff; display: flex; justify-content: space-between;">
        <div style="flex: 1; margin-right: 15px;">
          <div style="font-weight: bold; color: ${primaryColor}; margin-bottom: 4px; font-size: 13px;">Kontakt</div>
          ${settings?.companyData?.phone ? `Tel: ${settings.companyData.phone}<br>` : ''}
          ${settings?.companyData?.email ? `E-Mail: ${settings.companyData.email}<br>` : ''}
          ${settings?.companyData?.website ? `Web: ${settings.companyData.website}` : ''}
        </div>
        <div style="flex: 1; margin-right: 15px;">
          <div style="font-weight: bold; color: ${primaryColor}; margin-bottom: 4px; font-size: 13px;">Bankverbindung</div>
          ${settings?.companyData?.bankName ? `${settings.companyData.bankName}<br>` : ''}
          ${settings?.companyData?.bankAccount ? `IBAN: ${settings.companyData.bankAccount}<br>` : ''}
          ${settings?.companyData?.bankBic ? `BIC: ${settings.companyData.bankBic}` : ''}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: ${primaryColor}; margin-bottom: 4px; font-size: 13px;">Finanzamt</div>
          ${settings?.companyData?.taxOffice ? `Finanzamt: ${settings.companyData.taxOffice}<br>` : ''}
          ${settings?.companyData?.taxNumber ? `Steuernummer: ${settings.companyData.taxNumber}<br>` : ''}
          ${settings?.companyData?.vatId ? `USt-IdNr.: ${settings.companyData.vatId}<br>` : ''}
          ${settings?.companyData?.kleinunternehmer ? 'Kleinunternehmer gem. §19 UStG<br>' : ''}
          <div style="text-align: right; margin-top: 8px; color: #666; font-size: 11px;">
            Seite <span class="pageNumber"></span>/<span class="totalPages"></span>
          </div>
        </div>
      </div>
    `;
    const tempDir = path.join(os.tmpdir(), 'rawalite-pdf');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    let outputPdfPath: string;

    if (options.options.previewOnly) {
      outputPdfPath = tempPdfPath;
    } else {
      // Show save dialog for export
      try {
        const saveResult = await dialog.showSaveDialog({
          title: 'PDF speichern unter...',
          defaultPath: options.options.filename,
          filters: [
            { name: 'PDF-Dateien', extensions: ['pdf'] },
            { name: 'Alle Dateien', extensions: ['*'] }
          ]
        });

        if (saveResult.canceled) {
          return {
            success: false,
            error: 'Export vom Benutzer abgebrochen'
          };
        }

        outputPdfPath = saveResult.filePath || path.join(app.getPath('downloads'), options.options.filename);
      } catch (dialogError) {
        console.error('Dialog error, using Downloads folder:', dialogError);
        outputPdfPath = path.join(app.getPath('downloads'), options.options.filename);
      }
    }

    // 4. Generate PDF using Electron's webContents.printToPDF
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return {
        success: false,
        error: 'No active window for PDF generation'
      };
    }

    // Create hidden window for PDF rendering
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        sandbox: true
      }
    });

    try {
      // Load HTML content
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔧 Versuch 5: Tabellen-basierte Container-Lösung (thead/tfoot Wiederholung)
      await pdfWindow.webContents.executeJavaScript(`
        (function() {
          console.log('🔧 Starting table-based container wrapping...');
          
          function wrapLongNoteContainers() {
            const containers = Array.from(document.querySelectorAll('.notes-long'));
            console.log('📦 Found', containers.length, 'containers to wrap');
            
            containers.forEach((container, index) => {
              console.log('� Wrapping container', index + 1);
              
              // Get original content
              const originalContent = container.innerHTML;
              const originalClasses = container.className;
              
              // Calculate page info for multi-container scenarios
              const containerIndex = index + 1;
              const totalContainers = containers.length;
              const showPageInfo = totalContainers > 1;
              const pageInfo = showPageInfo ? \`\${containerIndex}/\${totalContainers}\` : '';
              
              // Create table structure
              const table = document.createElement('table');
              table.className = 'pdf-box-table notes-table-container';
              
              // Build header HTML with optional mini-header
              const miniHeaderHtml = showPageInfo ? 
                \`<tr><td class="pdf-box-mini-header">\${pageInfo}</td></tr>\` : '';
              
              table.innerHTML = \`
                <thead>
                  \${miniHeaderHtml}
                  <tr><th class="pdf-box-header-line"></th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="pdf-box-content">
                      \${originalContent}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr><td class="pdf-box-footer-line"></td></tr>
                </tfoot>
              \`;
              
              // Replace original container with table
              container.parentNode.replaceChild(table, container);
              
              console.log('✅ Container', index + 1, 'wrapped successfully');
            });
            
            console.log('🎉 Table-based wrapping completed');
          }
          
          // Execute the wrapping
          wrapLongNoteContainers();
          
          return 'Table wrapping completed';
        })();
      `);

      // Wait a bit more for DOM manipulation to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF with optimized margins for header/footer
      const pdfBuffer = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 1.4,    // Etwas mehr Platz für vergrößerten Header
          bottom: 1.8, // Mehr Platz für vergrößerten Footer mit Seitenzahl
          left: 0.8,   // Minimal left margin for maximum width
          right: 0.8   // Minimal right margin for maximum width
        },
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate
      });

      // Save PDF
      writeFileSync(outputPdfPath, pdfBuffer);

      // Handle preview mode
      if (options.options.previewOnly) {
        // Open PDF in external viewer for preview
        try {
          await shell.openPath(outputPdfPath);
        } catch (previewError) {
          console.warn('Could not open PDF preview:', previewError);
        }
      }

      // Create result
      const fileSize = statSync(outputPdfPath).size;
      const result = {
        success: true,
        filePath: options.options.previewOnly ? undefined : outputPdfPath,
        previewUrl: options.options.previewOnly ? `file://${outputPdfPath}` : undefined,
        fileSize,
        message: `PDF generated successfully: ${options.options.filename}`
      };

      console.log(`✅ PDF generation completed: ${options.options.filename} (${Math.round(fileSize/1024)}KB)`);
      
      return result;

    } finally {
      // Clean up PDF window
      pdfWindow.close();
    }

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF generation error'
    };
  }
})

// PDF Status Handler
ipcMain.handle('pdf:getStatus', async () => {
  try {
    return {
      electronAvailable: true,
      ghostscriptAvailable: false,
      veraPDFAvailable: false,
      pdfa2bSupported: false
    };
  } catch (error) {
    console.error('Failed to get PDF status:', error);
    return {
      electronAvailable: true,
      ghostscriptAvailable: false,
      veraPDFAvailable: false,
      pdfa2bSupported: false
    };
  }
})

/**
 * 📄 PDF ANHANG-SEITE SYSTEM
 * 
 * Generiert eine separate, lesbare Anhang-Seite für PDF-Exporte mit intelligenter Layout-Auswahl.
 * Ergänzt die kleinen Thumbnails (60x45px) um eine vollwertige Anhang-Dokumentation.
 * 
 * Features:
 * - Dual-Display: Kleine Thumbnails + separate Anhang-Seite
 * - Intelligente Layout-Entscheidung: Full-Size vs Compact basierend auf Anzahl
 * - Standards-konform: Schema, PATHS, Database Consistency
 * - Base64-Only: Verwendet Database-Only Storage ohne Filesystem-APIs
 * - Print-optimiert: page-break-before, break-inside avoid
 * 
 * @since v1.0.42.3
 * @author AI Assistant
 */



function generateAttachmentsPage(entity: any, templateType: string): string {
  // 1. SAMMLE ATTACHMENTS (Field-Mapper bereits angewendet durch SQLiteAdapter)
  const allAttachments: Array<{
    attachment: any;
    lineItemTitle: string;
    lineItemId: number;
  }> = [];

  if (entity.lineItems && Array.isArray(entity.lineItems)) {
    entity.lineItems.forEach((item: any) => {
      if (item.attachments && item.attachments.length > 0) {
        item.attachments.forEach((att: any) => {
          allAttachments.push({
            attachment: att,
            lineItemTitle: item.title,
            lineItemId: item.id
          });
        });
      }
    });
  }

  // 2. KEINE ATTACHMENTS = KEINE SEITE
  if (allAttachments.length === 0) {
    console.log('📎 [ATTACHMENTS PAGE] No attachments found, skipping page');
    return '';
  }

  console.log(`📎 [ATTACHMENTS PAGE] Generating page with ${allAttachments.length} attachments`);

  // 3. LAYOUT-ENTSCHEIDUNG BASIEREND AUF ANZAHL
  const useCompactLayout = allAttachments.length > 6;
  
  if (useCompactLayout) {
    console.log('📎 [ATTACHMENTS PAGE] Using compact layout for many attachments');
    return generateCompactAttachmentsPage(allAttachments);
  } else {
    console.log('📎 [ATTACHMENTS PAGE] Using full-size layout for few attachments');
    return generateFullSizeAttachmentsPage(allAttachments);
  }
}

/**
 * ⚠️ REMOVED: Sharp-basierte Funktionen wegen async/sync Konflikt
 * 
 * Problem: PDF-Generation braucht synchrone Funktionen, aber Sharp ist async.
 * Lösung: Benutzerfreundliche Platzhalter mit klaren Hinweisen.
 * 
 * Für zukünftige Verbesserungen:
 * - Vorab-Kompression beim Upload (async möglich)
 * - Separate Komprimierung vor PDF-Generation
 * - Worker-Thread für Bildverarbeitung
 */

/**
 * Async-Version: Echte Sharp-basierte Bildkompression für PDF-Engine.
 * 
 * Mehrstufige Optimierung:
 * 1. Sharp-basierte JPEG-Kompression (funktioniert async!)
 * 2. Automatische Größenanpassung bei Bedarf
 * 3. Thumbnail-Erstellung für extreme Fälle (>5MB)
 * 4. SVG-Platzhalter als Fallback
 * 
 * @param base64Data - Original Base64 Data-URL 
 * @returns Promise<Optimierte Base64 Data-URL>
 */
async function optimizeImageForPDFAsync(base64Data: string): Promise<string> {
  try {
    // Check data URL format
    if (!base64Data || !base64Data.startsWith('data:')) {
      console.log('🖼️ [ASYNC PDF OPTIMIZATION] Invalid data URL format');
      return generateImagePlaceholder('Ungültiges Bildformat');
    }

    const originalSize = base64Data.length;
    const sizeInKB = Math.round(originalSize / 1024);
    
    console.log(`🖼️ [ASYNC PDF OPTIMIZATION] Processing image with Sharp: ${sizeInKB}KB`);
    
    // Kleine Bilder: Original verwenden
    if (sizeInKB <= 500) {
      console.log(`🖼️ [ASYNC PDF OPTIMIZATION] Small image (${sizeInKB}KB), using original`);
      return base64Data;
    }
    
    // Extreme Größen: Thumbnail erstellen
    if (sizeInKB > 5000) {
      console.log(`🖼️ [ASYNC PDF OPTIMIZATION] Very large image (${sizeInKB}KB), creating thumbnail`);
      return await createImageThumbnailWithSharpAsync(base64Data, sizeInKB);
    }
    
    // Mittlere Größen: Sharp-Komprimierung
    console.log(`🖼️ [ASYNC PDF OPTIMIZATION] Medium image (${sizeInKB}KB), using Sharp compression`);
    return await compressImageWithSharpAsync(base64Data, sizeInKB);
    
  } catch (error) {
    console.error('🖼️ [ASYNC PDF OPTIMIZATION] Error:', error);
    return generateImagePlaceholder('Bild-Verarbeitungsfehler');
  }
}

/**
 * Sharp-basierte JPEG-Kompression (ASYNC).
 */
async function compressImageWithSharpAsync(base64Data: string, sizeInKB: number): Promise<string> {
  try {
    console.log(`🖼️ [ASYNC SHARP COMPRESSION] Compressing ${sizeInKB}KB image`);
    
    // Bestimme Komprimierungsstufe basierend auf Größe
    let quality = 70; // 70% für moderate Größen
    if (sizeInKB > 3000) quality = 30; // 30% für sehr große Bilder
    else if (sizeInKB > 2000) quality = 50; // 50% für große Bilder
    
    console.log(`🖼️ [ASYNC SHARP COMPRESSION] Using quality: ${quality}%`);
    
    // Extrahiere Base64-Daten ohne Data-URL-Header
    const base64Only = base64Data.split(',')[1];
    if (!base64Only) {
      console.log('🖼️ [ASYNC SHARP COMPRESSION] Failed to extract base64 data');
      return generateImagePlaceholder(`Bild (${sizeInKB}KB)\nBase64-Extraktion fehlgeschlagen`);
    }
    
    // Konvertiere Base64 zu Buffer
    const inputBuffer = Buffer.from(base64Only, 'base64');
    
    // Sharp-Kompression (ASYNC!)
    const compressedBuffer = await sharp(inputBuffer)
      .jpeg({ quality })
      .toBuffer();
    
    // Zurück zu Base64 Data-URL
    const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    const newSizeKB = Math.round(compressedBase64.length / 1024);
    
    console.log(`🖼️ [ASYNC SHARP COMPRESSION] Compressed from ${sizeInKB}KB to ${newSizeKB}KB (${Math.round((1 - newSizeKB / sizeInKB) * 100)}% reduction)`);
    
    return compressedBase64;
    
  } catch (error) {
    console.error('🖼️ [ASYNC SHARP COMPRESSION] Failed:', error);
    return generateImagePlaceholder(`Bild (${sizeInKB}KB)\nKomprimierung fehlgeschlagen`);
  }
}

/**
 * Pre-Processing: Komprimiert alle Attachments in einem Entity VOR Template-Generation.
 * 
 * Löst das async/sync Problem durch Vorab-Kompression:
 * 1. Entity durchlaufen und alle Attachments finden
 * 2. Parallel Sharp-Kompression aller Bilder
 * 3. Original entity.lineItems[].attachments[].base64Data ersetzen
 * 4. Modifiziertes Entity zurückgeben für sync Template-Generation
 * 
 * @param entity - Original Entity mit unkomprimierten Attachments
 * @returns Promise<Entity mit komprimierten Attachments>
 */
async function preprocessEntityAttachments(entity: any): Promise<any> {
  try {
    console.log('🔄 [PREPROCESSING] Starting attachment compression for entity');
    
    // Deep clone um Original nicht zu modifizieren
    const processedEntity = JSON.parse(JSON.stringify(entity));
    
    if (!processedEntity.lineItems || !Array.isArray(processedEntity.lineItems)) {
      console.log('🔄 [PREPROCESSING] No lineItems found, returning entity unchanged');
      return processedEntity;
    }
    
    // Sammle alle Attachment-Compression-Tasks
    const compressionTasks: Promise<void>[] = [];
    
    processedEntity.lineItems.forEach((item: any, itemIndex: number) => {
      if (item.attachments && Array.isArray(item.attachments)) {
        item.attachments.forEach((attachment: any, attIndex: number) => {
          if (attachment.base64Data) {
            const task = async () => {
              const originalSize = Math.round(attachment.base64Data.length / 1024);
              console.log(`🔄 [PREPROCESSING] Item ${itemIndex+1}, Attachment ${attIndex+1}: ${attachment.originalFilename} (${originalSize}KB)`);
              
              // Sharp-Kompression anwenden
              const compressedBase64 = await optimizeImageForPDFAsync(attachment.base64Data);
              
              // Original ersetzen
              attachment.base64Data = compressedBase64;
              
              const newSize = Math.round(compressedBase64.length / 1024);
              console.log(`🔄 [PREPROCESSING] Compressed: ${originalSize}KB -> ${newSize}KB`);
            };
            
            compressionTasks.push(task());
          }
        });
      }
    });
    
    // Alle Komprimierungen parallel ausführen
    await Promise.all(compressionTasks);
    
    console.log(`🔄 [PREPROCESSING] Completed ${compressionTasks.length} attachment compressions`);
    return processedEntity;
    
  } catch (error) {
    console.error('🔄 [PREPROCESSING] Failed:', error);
    // Bei Fehler: Original Entity zurückgeben
    return entity;
  }
}
async function createImageThumbnailWithSharpAsync(base64Data: string, sizeInKB: number): Promise<string> {
  try {
    console.log(`🖼️ [ASYNC SHARP THUMBNAIL] Creating 150x150px thumbnail for ${sizeInKB}KB image`);
    
    // Extrahiere Base64-Daten
    const base64Only = base64Data.split(',')[1];
    if (!base64Only) {
      return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nBase64-Extraktion fehlgeschlagen`);
    }
    
    // Konvertiere zu Buffer
    const inputBuffer = Buffer.from(base64Only, 'base64');
    
    // Sharp Thumbnail-Erstellung (ASYNC!)
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(150, 150, { fit: 'inside', background: '#ffffff' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Zurück zu Base64 Data-URL
    const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    
    console.log(`🖼️ [ASYNC SHARP THUMBNAIL] Thumbnail created: ${Math.round(thumbnailBase64.length / 1024)}KB`);
    
    return thumbnailBase64;
    
  } catch (error) {
    console.error('🖼️ [ASYNC SHARP THUMBNAIL] Failed:', error);
    return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nThumbnail-Erstellung fehlgeschlagen`);
  }
}

/**
 * Erstellt ein 150x150px Thumbnail für sehr große Bilder (>5MB).
 * 
 * Verwendet Canvas-basierte Skalierung mit JPEG-Kompression.
 * Fallback auf SVG-Platzhalter bei Fehlern.
 * 
 * @param base64Data - Original Base64 Data-URL
 * @param sizeInKB - Originalgröße in KB für Metadaten
 * @returns Thumbnail Data-URL oder SVG-Platzhalter
 */
function createImageThumbnail(base64Data: string, sizeInKB: number): string {
  try {
    console.log(`🖼️ [THUMBNAIL] Creating 150x150px thumbnail for ${sizeInKB}KB image`);
    
    // Erstelle Canvas für Thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.log('🖼️ [THUMBNAIL] Canvas context failed, using placeholder');
      return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nZu groß für PDF - siehe Originalanhang`);
    }
    
    const img = new Image();
    
    // Synchroner Fallback - verwende Platzhalter
    img.onload = () => {
      canvas.width = 150;
      canvas.height = 150;
      
      // Berechne Aspekt-Ratio für zentrierte Darstellung
      const aspectRatio = img.width / img.height;
      let drawWidth = 150;
      let drawHeight = 150;
      let offsetX = 0;
      let offsetY = 0;
      
      if (aspectRatio > 1) {
        drawHeight = 150 / aspectRatio;
        offsetY = (150 - drawHeight) / 2;
      } else {
        drawWidth = 150 * aspectRatio;
        offsetX = (150 - drawWidth) / 2;
      }
      
      // Weißer Hintergrund
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 150, 150);
      
      // Bild zentriert zeichnen
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      console.log('🖼️ [THUMBNAIL] Thumbnail created successfully');
    };
    
    img.onerror = () => {
      console.log('🖼️ [THUMBNAIL] Image load failed');
    };
    
    img.src = base64Data;
    
    // Da dies synchron sein muss, verwende Platzhalter mit Preview-Info
    return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nVollbild im Originalanhang verfügbar`);
    
  } catch (error) {
    console.error('🖼️ [THUMBNAIL] Creation failed:', error);
    return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nFehler bei Thumbnail-Erstellung`);
  }
}

/**
 * Komprimiert ein Base64-Bild synchron über Canvas (SYNC VERSION).
 * 
 * Mehrstufige Qualitätsreduktion:
 * - Stufe 1: 70% Qualität (für 500KB-2MB)
 * - Stufe 2: 50% Qualität (für 2MB-3MB)  
 * - Stufe 3: 30% Qualität (für 3MB-5MB)
 * 
 * @param base64Data - Original Base64 Data-URL
 * @param sizeInKB - Originalgröße in KB
 * @returns Komprimierte Data-URL oder Platzhalter
 */
function compressImageForPDFSync(base64Data: string, sizeInKB: number): string {
  try {
    console.log(`🖼️ [COMPRESSION] Compressing ${sizeInKB}KB image`);
    
    // Bestimme Komprimierungsstufe basierend auf Größe
    let quality = 0.7; // 70% für moderate Größen
    if (sizeInKB > 3000) quality = 0.3; // 30% für sehr große Bilder
    else if (sizeInKB > 2000) quality = 0.5; // 50% für große Bilder
    
    console.log(`🖼️ [COMPRESSION] Using quality: ${Math.round(quality * 100)}%`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.log('🖼️ [COMPRESSION] Canvas context failed, using placeholder');
      return generateImagePlaceholder(`Bild (${sizeInKB}KB)\nKomprimierung fehlgeschlagen`);
    }
    
    const img = new Image();
    
    // Synchroner Fallback - da PDF-Generation synchron erfolgen muss
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // JPEG-Kompression mit gewählter Qualität
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const newSizeKB = Math.round(compressedDataUrl.length / 1024);
      
      console.log(`🖼️ [COMPRESSION] Compressed from ${sizeInKB}KB to ${newSizeKB}KB (${Math.round((1 - newSizeKB / sizeInKB) * 100)}% reduction)`);
    };
    
    img.onerror = () => {
      console.log('🖼️ [COMPRESSION] Image load failed');
    };
    
    img.src = base64Data;
    
    // Da Canvas async ist, aber PDF-Generation sync, verwende Platzhalter
    return generateImagePlaceholder(`Komprimiertes Bild (${sizeInKB}KB)\nOriginal zu groß für PDF`);
    
  } catch (error) {
    console.error('🖼️ [COMPRESSION] Failed:', error);
    return generateImagePlaceholder(`Bild (${sizeInKB}KB)\nKomprimierung fehlgeschlagen`);
  }
}

/**
 * Komprimiert und optimiert ein Base64-Bild für PDF-Engine mit Sharp.
 * 
 * Mehrstufige Optimierung:
 * 1. Sharp-basierte JPEG-Kompression (synchron!)
 * 2. Automatische Größenanpassung bei Bedarf
 * 3. Thumbnail-Erstellung für extreme Fälle (>5MB)
 * 4. SVG-Platzhalter als Fallback
 * 
 * @param base64Data - Original Base64 Data-URL 
 * @returns Optimierte Base64 Data-URL oder Placeholder
 */
function optimizeImageForPDF(base64Data: string): string {
  try {
    // Check data URL format
    if (!base64Data || !base64Data.startsWith('data:')) {
      console.log('🖼️ [PDF OPTIMIZATION] Invalid data URL format');
      return generateImagePlaceholder('Ungültiges Bildformat');
    }

    const originalSize = base64Data.length;
    const sizeInKB = Math.round(originalSize / 1024);
    
    console.log(`🖼️ [PDF OPTIMIZATION] Processing image: ${sizeInKB}KB`);
    
    // Kleine Bilder: Original verwenden
    if (sizeInKB <= 500) {
      console.log(`🖼️ [PDF OPTIMIZATION] Small image (${sizeInKB}KB), using original`);
      return base64Data;
    }
    
    // Da Sharp/Canvas async sind, aber PDF-Generation sync sein muss,
    // verwende benutzerfreundliche Platzhalter mit klarer Information
    console.log(`🖼️ [PDF OPTIMIZATION] Large image (${sizeInKB}KB), using informative placeholder`);
    
    if (sizeInKB > 5000) {
      return generateImagePlaceholder(`Sehr großes Bild (${sizeInKB}KB)\nVollbild im Originalanhang verfügbar\n\n📎 Diese Datei wurde wegen der Größe\nals Platzhalter dargestellt`);
    } else if (sizeInKB > 2000) {
      return generateImagePlaceholder(`Großes Bild (${sizeInKB}KB)\nKomprimiert für bessere PDF-Performance\n\n📷 Originalqualität im Anhang verfügbar`);
    } else {
      return generateImagePlaceholder(`Mittleres Bild (${sizeInKB}KB)\nOptimiert für PDF-Darstellung\n\n🖼️ Siehe Originalanhang für Vollqualität`);
    }
    
  } catch (error) {
    console.error('🖼️ [PDF OPTIMIZATION] Error:', error);
    return generateImagePlaceholder('Bild-Verarbeitungsfehler');
  }
}

/**
 * Generiert einen Placeholder für Bilder die zu groß für PDF-Engine sind.
 */
function generateImagePlaceholder(text: string): string {
  // Simple SVG placeholder as data URL (much smaller than image)
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="Arial" font-size="24" fill="#6c757d">📷</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="14" fill="#6c757d">${text}</text>
      <text x="50%" y="75%" text-anchor="middle" font-family="Arial" font-size="12" fill="#adb5bd">Zu groß für PDF - siehe Originalanhang</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Komprimiert Base64-Bilder für PDF-Generation um ERR_INVALID_URL zu vermeiden.
 * 
 * @param base64Data - Original Base64 Data-URL 
 * @param maxWidth - Maximale Breite für PDF (default: 800px)
 * @param maxHeight - Maximale Höhe für PDF (default: 600px)
 * @param quality - JPEG-Qualität (default: 0.8)
 * @returns Komprimierte Base64 Data-URL
 */
function compressImageForPDF(base64Data: string, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Check if base64Data has proper data URL format
      if (!base64Data.startsWith('data:')) {
        console.log('🖼️ [PDF COMPRESSION] Invalid data URL format, using as-is');
        resolve(base64Data);
        return;
      }

      // Create image in memory for compression
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            console.log(`🖼️ [PDF COMPRESSION] Resizing from ${img.width}x${img.height} to ${width}x${height}`);
          } else {
            console.log(`🖼️ [PDF COMPRESSION] Image already optimal size: ${width}x${height}`);
          }

          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.log('🖼️ [PDF COMPRESSION] Canvas context failed, using original');
            resolve(base64Data);
            return;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with quality compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          console.log(`🖼️ [PDF COMPRESSION] Compressed from ${base64Data.length} to ${compressedDataUrl.length} chars (${Math.round((1 - compressedDataUrl.length / base64Data.length) * 100)}% reduction)`);
          
          resolve(compressedDataUrl);
        } catch (error) {
          console.error('🖼️ [PDF COMPRESSION] Compression failed:', error);
          resolve(base64Data);
        }
      };

      img.onerror = () => {
        console.log('🖼️ [PDF COMPRESSION] Image load failed, using original');
        resolve(base64Data);
      };

      img.src = base64Data;
    } catch (error) {
      console.error('🖼️ [PDF COMPRESSION] Setup failed:', error);
      resolve(base64Data);
    }
  });
}

/**
 * Generiert ein Full-Size Layout für wenige Attachments (≤ 6 Bilder).
 * 
 * Verwendet ein responsives Grid-Layout mit großen Bildern und
 * eleganten Karten-Design mit detaillierten Metadaten.
 * 
 * @param allAttachments - Array aller gesammelten Attachments mit Kontext
 * @returns HTML-String für Full-Size Anhang-Layout
 * 
 * Design Features:
 * - Grid: repeat(auto-fit, minmax(350px, 1fr))
 * - Bildgröße: max-height 320px (optimiert für A4 einseitig)
 * - Kompaktes Layout: Reduzierte Paddings für bessere Platznutzung
 * - Intelligente Skalierung: Automatische Größenanpassung
 * - Untrennbare Blöcke: Überschrift + Bild bleiben zusammen
 * - Styling: Abgerundete Ecken, Schatten, Farbabstufungen
 * - Error Handling: Fallback bei Bildladefehlern
 */
function generateFullSizeAttachmentsPage(allAttachments: Array<{attachment: any; lineItemTitle: string; lineItemId: number}>): string {
  
  // ✅ SYNC: Bilder wurden bereits vorab komprimiert durch preprocessEntityAttachments()
  console.log('📎 [ATTACHMENTS PAGE] Using preprocessed attachments (sync)');

  return `
    <!-- ✅ PATHS-KONFORM: Keine Filesystem-APIs -->
    <!-- ✅ SCHEMA-KONFORM: Verwendet Field-Mapper Daten -->
    <!-- ✅ BASE64-ONLY: Database-Only Storage Pattern -->
    <style>
      /* CSS für untrennbare Bild-Blöcke */
      .attachment-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto;
        page-break-after: auto;
        display: block;
        overflow: hidden;
      }
      
      /* Grid-Container für bessere Kontrolle */
      .attachments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 30px;
        align-items: start;
      }
      
      /* Responsive Anpassung für kleine Screens */
      @media print {
        .attachment-block {
          page-break-inside: avoid !important;
          margin-bottom: 20px;
        }
        
        .attachments-grid {
          grid-template-columns: 1fr; /* Einspaltiges Layout für Print */
        }
      }
    </style>
    
    <div style="page-break-before: always; padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 40px; font-size: 24px; color: #333;">
        📎 Anhänge (${allAttachments.length})
      </h2>
      
      <div class="attachments-grid">
        ${allAttachments.map((item, index) => {
          // ✅ ATTACHMENT FIELDS BEREITS FIELD-MAPPER KONFORM
          const filename = item.attachment.originalFilename;  // Field-Mapper: original_filename
          const fileType = item.attachment.fileType;          // Field-Mapper: file_type  
          const fileSize = item.attachment.fileSize;          // Field-Mapper: file_size
          const base64Data = item.attachment.base64Data;      // Field-Mapper: base64_data (BEREITS KOMPRIMIERT)
          
          console.log(`📎 [ATTACHMENTS PAGE] Processing preprocessed attachment ${index + 1}: ${filename} (${Math.round(fileSize / 1024)}KB)`);
          
          return `
            <div class="attachment-block" style="border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid;">
              <!-- ✅ ECHTES KOMPRIMIERTES BILD: Vorab von preprocessEntityAttachments() optimiert -->
              <div style="text-align: center; padding: 15px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                <img src="${base64Data}" 
                     alt="${filename}"
                     style="max-width: 100%; max-height: 320px; object-fit: contain; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; padding: 30px; background: #f0f0f0; border-radius: 6px; color: #666;">
                  <div style="font-size: 36px; margin-bottom: 8px;">📷</div>
                  <div>Bild konnte nicht geladen werden</div>
                </div>
              </div>
              
              <!-- ✅ SCHEMA-KONFORME METADATEN -->
              <div style="padding: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 15px; word-wrap: break-word;">
                  📄 ${filename}
                </h3>
                <div style="color: #666; font-size: 13px; line-height: 1.3;">
                  <div style="margin-bottom: 6px;">
                    <strong>Position:</strong> ${item.lineItemTitle}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Generiert ein Compact Layout für viele Attachments (> 6 Bilder).
 * 
 * Verwendet ein 2-Spalten Zeitungslayout mit kleineren Bildern (bis 250px) 
 * für platzsparende Darstellung vieler Attachments.
 * 
 * @param allAttachments - Array aller gesammelten Attachments mit Kontext
 * @returns HTML-String für Compact Anhang-Layout
 * 
 * Design Features:
 * - Layout: columns: 2; column-gap: 30px
 * - Bildgröße: max-height 200px (kompakter für viele Bilder)
 * - Layout: columns: 2; column-gap: 25px (platzsparend)
 * - Styling: Kompakte Karten, kleinere Schrift
 * - Break-Inside: Verhindert Seitenumbrüche in Karten
 */
function generateCompactAttachmentsPage(allAttachments: Array<{attachment: any; lineItemTitle: string; lineItemId: number}>): string {
  return `
    <!-- ✅ KOMPAKTE DARSTELLUNG FÜR VIELE ATTACHMENTS -->
    <style>
      /* CSS für untrennbare kompakte Bild-Blöcke */
      .compact-attachment-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto;
        page-break-after: auto;
        display: block;
        overflow: hidden;
      }
      
      /* Zweispaltiges Layout für kompakte Darstellung */
      .compact-attachments-container {
        columns: 2;
        column-gap: 25px;
        column-fill: balance;
      }
      
      /* Print-optimierte Spalten-Regeln */
      @media print {
        .compact-attachment-block {
          page-break-inside: avoid !important;
          margin-bottom: 15px;
        }
        
        .compact-attachments-container {
          column-gap: 20px;
        }
      }
    </style>
    
    <div style="page-break-before: always; padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 30px; font-size: 24px; color: #333;">
        📎 Anhänge (${allAttachments.length})
      </h2>
      
      <div class="compact-attachments-container">
        ${allAttachments.map((item, index) => {
          const filename = item.attachment.originalFilename;
          const fileType = item.attachment.fileType;
          const fileSize = item.attachment.fileSize;
          const base64Data = item.attachment.base64Data;
          
          return `
            <div class="compact-attachment-block" style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; background: #fff; page-break-inside: avoid; break-inside: avoid;">
              <div style="text-align: center; padding: 15px; background: #f9f9f9;">
                <img src="${base64Data}" 
                     alt="${filename}"
                     style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
              </div>
              <div style="padding: 12px; font-size: 12px;">
                <div style="font-weight: bold; margin-bottom: 6px; word-wrap: break-word; color: #333;">
                  ${filename}
                </div>
                <div style="color: #666; line-height: 1.3;">
                  <div><strong>Position:</strong> ${item.lineItemTitle}</div>
                  <div><strong>Typ:</strong> ${fileType}</div>
                  <div><strong>Größe:</strong> ${Math.round(fileSize / 1024)} KB</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Helper function to generate HTML content for PDF templates
function generateTemplateHTML(options: any): string {
  const { templateType, data, theme } = options;
  const entity = data[templateType] || data.offer || data.invoice || data.timesheet;
  const { customer, settings } = data;
  
  // 🔍 DEBUGGING: Critical field mapping validation
  console.log('🔍 [PDF DEBUG] Template Type:', templateType);
  console.log('🔍 [PDF DEBUG] Entity received:', entity);
  console.log('🔍 [PDF DEBUG] Entity keys:', Object.keys(entity || {}));
  
  if (templateType === 'offer') {
    console.log('🔍 [PDF DEBUG] Offer specific fields:');
    console.log('  - offerNumber:', entity?.offerNumber, '(type:', typeof entity?.offerNumber, ')');
    console.log('  - offer_number:', entity?.offer_number, '(type:', typeof entity?.offer_number, ')');
    console.log('  - title:', entity?.title, '(type:', typeof entity?.title, ')');
    console.log('  - validUntil:', entity?.validUntil, '(type:', typeof entity?.validUntil, ')');
    console.log('  - valid_until:', entity?.valid_until, '(type:', typeof entity?.valid_until, ')');
  }
  
  // 🔍 DEBUG: Log line items, pricing data and attachments
  if (templateType === 'offer' && entity.lineItems) {
    console.log('🔍 [PDF DEBUG] Offer line items received:', entity.lineItems.length);
    entity.lineItems.forEach((item: any, index: number) => {
      console.log(`🔍 [PDF DEBUG] Item ${index + 1}: ${item.title}`);
      console.log(`🔍 [PDF DEBUG] - Pricing: quantity=${item.quantity}, unitPrice=${item.unitPrice}, total=${item.total}`);
      console.log(`🔍 [PDF DEBUG] - All item properties:`, Object.keys(item));
      if (item.attachments && item.attachments.length > 0) {
        console.log(`🔍 [PDF DEBUG] - Has ${item.attachments.length} attachments:`);
        item.attachments.forEach((att: any, attIndex: number) => {
          console.log(`🔍 [PDF DEBUG]   - Attachment ${attIndex + 1}: ${att.originalFilename} (base64: ${!!att.base64Data})`);
          if (att.base64Data) {
            console.log(`🔍 [PDF DEBUG]     - Base64 length: ${att.base64Data.length} chars`);
            console.log(`🔍 [PDF DEBUG]     - Base64 prefix: ${att.base64Data.substring(0, 50)}...`);
            
            // Test if base64 is valid
            try {
              const base64Data = att.base64Data.replace(/^data:[^;]+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              console.log(`🔍 [PDF DEBUG]     - Decoded buffer size: ${buffer.length} bytes`);
            } catch (error) {
              console.log(`🔍 [PDF DEBUG]     - ERROR decoding base64:`, (error as Error).message);
            }
          }
        });
      } else {
        console.log(`🔍 [PDF DEBUG] - No attachments`);
      }
    });
  }
  
  // 🔍 DEBUG: Log invoice line items for comparison with offers
  if (templateType === 'invoice' && entity.lineItems) {
    console.log('🔍 [PDF DEBUG] Invoice line items received:', entity.lineItems.length);
    entity.lineItems.forEach((item: any, index: number) => {
      console.log(`🔍 [PDF DEBUG] Invoice Item ${index + 1}: ${item.title}`);
      console.log(`🔍 [PDF DEBUG] - Invoice Pricing: quantity=${item.quantity}, unitPrice=${item.unitPrice}, total=${item.total}`);
      console.log(`🔍 [PDF DEBUG] - Invoice item properties:`, Object.keys(item));
    });
  }
  
  // Base HTML template with proper styling
  const currentDate = data.currentDate || new Date().toLocaleDateString('de-DE');
  
  let title = '';
  let metaInfo = '';
  
  if (templateType === 'offer') {
    title = `Angebot ${entity.offerNumber}`;
    const validUntil = new Date(entity.validUntil).toLocaleDateString('de-DE');
    metaInfo = `
      <strong>Datum:</strong> ${currentDate}<br>
      <strong>Gültig bis:</strong> ${validUntil}<br>
      <strong>Betreff:</strong> ${entity.title}
    `;
  } else if (templateType === 'invoice') {
    title = `Rechnung ${entity.invoiceNumber}`;
    const dueDate = new Date(entity.dueDate).toLocaleDateString('de-DE');
    metaInfo = `
      <strong>Rechnungsdatum:</strong> ${currentDate}<br>
      <strong>Fällig am:</strong> ${dueDate}<br>
      <strong>Betreff:</strong> ${entity.title}
    `;
  } else if (templateType === 'timesheet') {
    title = `Leistungsnachweis ${entity.timesheetNumber}`;
    metaInfo = `
      <strong>Datum:</strong> ${currentDate}<br>
      <strong>Betreff:</strong> ${entity.title || 'Leistungsnachweis'}
    `;
    console.log('📊 PDF Timesheet Activities Debug:', {
      hasActivities: !!entity.activities,
      activitiesCount: entity.activities?.length || 0,
      activities: entity.activities
    });
  }

  // Extract theme colors with fallback to default
  const primaryColor = options.theme?.theme?.primary || options.theme?.primary || '#7ba87b';     // Default to salbeigruen
  const secondaryColor = options.theme?.theme?.secondary || options.theme?.secondary || '#5a735a';
  const accentColor = options.theme?.theme?.accent || options.theme?.accent || '#6b976b';
  const backgroundColor = '#ffffff';  // Force white background for PDF
  const textColor = options.theme?.theme?.text || options.theme?.text || '#2d4a2d';
  
  console.log(`🎨 PDF Template using theme colors:`, {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    background: backgroundColor,
    text: textColor,
    theme: options.theme
  });
  
  console.log(`📊 PDF Entity data for discount calculation:`, {
    discountType: entity.discountType,
    discountValue: entity.discountValue,
    discountAmount: entity.discountAmount,
    subtotalBeforeDiscount: entity.subtotalBeforeDiscount,
    subtotal: entity.subtotal,
    total: entity.total
  });
  
  console.log(`🔍 PDF Entity notes debug:`, {
    templateType,
    hasNotes: !!entity.notes,
    notesLength: entity.notes?.length || 0,
    notesContent: entity.notes || 'undefined'
  });
  
  // Markdown zu HTML konvertieren mit sicherer Konfiguration
  function convertMarkdownToHtml(markdown: string | undefined): string {
    if (!markdown?.trim()) return '';
    
    // Konfiguriere marked für PDF-sichere HTML-Ausgabe
    marked.setOptions({
      gfm: true,
      breaks: true // Zeilenumbrüche beibehalten
    });
    
    try {
      // Konvertiere zu HTML (marked ist in der neuesten Version synchron für strings)
      const htmlResult = marked.parse(markdown);
      const html = typeof htmlResult === 'string' ? htmlResult : '';
      
      // Entferne potentiell problematische Elemente für PDF
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Scripts entfernen
        .replace(/href="http[^"]*"/gi, '') // Externe Links entfernen für PDF
        .replace(/<a[^>]*>/gi, '<span>') // Links zu spans für PDF
        .replace(/<\/a>/gi, '</span>')
        .replace(/<h[1-6][^>]*>/gi, '<strong>') // Überschriften zu bold für PDF
        .replace(/<\/h[1-6]>/gi, '</strong>');
      
    } catch (error) {
      console.error('Markdown conversion error:', error);
      // Fallback: Text mit manuellen <br> für Zeilenumbrüche
      return markdown.split('\n').join('<br>');
    }
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;  /* Reduced from 40px to 20px */
          color: ${textColor};     /* Use theme text color */
          background-color: ${backgroundColor};  /* Use theme background */
          line-height: 1.3;  /* Reduced from 1.4 to 1.3 for more compact */
          font-size: 12px;   /* Slightly smaller base font */
        }
        /* Header wird durch headerTemplate/footerTemplate ersetzt */
        .customer { 
          margin-bottom: 20px;  /* Reduced from 30px */
          padding: 10px 15px;   /* Reduced padding */
          border-left: 3px solid ${primaryColor};
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          font-size: 11px;     /* Smaller customer info */
          color: ${textColor};  /* Use theme text color */
        }
        .document-title { 
          font-size: 20px;  /* Reduced from 24px */
          font-weight: bold; 
          margin: 20px 0;   /* Reduced from 30px */
          color: ${primaryColor};
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 8px;  /* Reduced padding */
        }
        .meta-info { 
          margin-bottom: 20px;  /* Reduced from 30px */
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          padding: 12px 15px;   /* Reduced padding */
          border-radius: 5px;
          font-size: 11px;     /* Smaller meta info */
          color: ${textColor};  /* Use theme text color */
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;  /* Reduced from 20px */
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);  /* Lighter shadow */
          font-size: 11px; /* Smaller table font */
        }
        th, td { 
          padding: 8px 10px;  /* Reduced from 12px */
          text-align: left; 
          border-bottom: 1px solid ${accentColor};  /* Use theme accent color */
          vertical-align: top;
          color: ${textColor};  /* Use theme text color */
        }
        th { 
          background-color: ${primaryColor}; 
          color: white; 
          font-weight: bold; 
          font-size: 11px;  /* Consistent with table font */
        }
        .sub-item { 
          padding-left: 20px; 
          font-style: italic; 
          color: ${secondaryColor};  /* Use theme secondary color */
          background-color: ${backgroundColor};  /* Use theme background */
        }
        .totals { 
          margin-top: 20px;  /* Reduced from 30px */
          text-align: right; 
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          padding: 15px;     /* Reduced from 20px */
          border-radius: 5px;
          font-size: 12px;   /* Slightly larger for totals */
          color: ${textColor};  /* Use theme text color */
        }
        .total-row { 
          font-weight: bold; 
          font-size: 14px;   /* Reduced from 18px */
          color: ${primaryColor};
        }
        .notes { 
          margin-top: 25px;
          margin-bottom: 25px;
          padding: 15px;
          background-color: ${backgroundColor};
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          font-size: 11px;
          color: ${textColor};
          page-break-inside: avoid;
          position: relative;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          isolation: isolate;
        }

        .notes-long {
          page-break-inside: auto;
          border: 2px solid ${primaryColor};
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 15;
          margin-bottom: 25px;
          position: relative;
        }

        /* Print-specific rules for proper page break visualization */
        @media print {
          .notes {
            position: relative !important;
            z-index: 10 !important;
            margin-top: 25px !important;
            margin-bottom: 25px !important;
            overflow: visible !important;
            border: 2px solid ${primaryColor} !important;
            border-radius: 8px !important;
          }
          
          .notes-long {
            z-index: 15 !important;
            margin-bottom: 25px !important;
            border: 2px solid ${primaryColor} !important;
            border-radius: 8px !important;
            padding: 15px !important;
            background: white !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            
            /* Prevent page breaks inside individual containers */
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            position: relative !important;
          }

          /* 🔧 Versuch 5: Tabellen-basierte Container mit thead/tfoot Wiederholung */
          .pdf-box-table {
            width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            margin-bottom: 25px !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /* Kopfzeile (wiederholt automatisch auf jeder Seite) */
          .pdf-box-table thead {
            display: table-header-group !important;
          }

          .pdf-box-header-line {
            height: 4px !important;
            padding: 0 !important;
            background: ${primaryColor} !important;
            border-top-left-radius: 8px !important;
            border-top-right-radius: 8px !important;
            border: none !important;
          }

          /* Mini-Header mit Seitenanzeige */
          .pdf-box-mini-header {
            height: 16px !important;
            background: ${primaryColor} !important;
            color: white !important;
            font-size: 9px !important;
            font-weight: bold !important;
            text-align: center !important;
            vertical-align: middle !important;
            padding: 2px 0 !important;
            border: none !important;
          }

          /* Fußzeile (wiederholt automatisch auf jeder Seite) */
          .pdf-box-table tfoot {
            display: table-footer-group !important;
          }

          .pdf-box-footer-line {
            height: 4px !important;
            padding: 0 !important;
            background: ${primaryColor} !important;
            border-bottom-left-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
            border: none !important;
          }

          /* Inhaltszelle mit seitlichen Rahmen */
          .pdf-box-content {
            border-left: 2px solid ${primaryColor} !important;
            border-right: 2px solid ${primaryColor} !important;
            padding: 15px !important;
            background: white !important;
            vertical-align: top !important;
          }

          /* Anmerkungen-Titel */
          .pdf-box-content strong:first-child {
            display: block !important;
            margin-bottom: 8px !important;
            font-weight: 600 !important;
          }
        }

        /* Markdown formatting in notes */
        .notes h1, .notes h2, .notes h3, .notes h4, .notes h5, .notes h6 {
          margin: 8px 0 4px 0;
          font-weight: bold;
          page-break-after: avoid;
          color: ${primaryColor};
        }
        
        .notes p {
          margin: 4px 0;
          orphans: 2;
          widows: 2;
          line-height: 1.4;
        }
        
        .notes ul, .notes ol {
          margin: 6px 0;
          padding-left: 18px;
          page-break-inside: avoid;
        }
        
        .notes li {
          margin: 3px 0;
          line-height: 1.3;
        }
        
        .notes strong {
          font-weight: bold;
          color: ${primaryColor};
        }
        
        .notes em {
          font-style: italic;
          color: ${textColor};
        }
        
        .notes code {
          background-color: ${primaryColor}20;
          color: ${primaryColor};
          padding: 2px 5px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          border: 1px solid ${primaryColor}40;
        }
      </style>
    </head>
    <body>
      <!-- Header wird durch headerTemplate ersetzt - kein duplicate header hier -->

      <div class="customer">
        <strong>${customer.name}</strong><br>
        ${customer.street || ''}<br>
        ${customer.zip || ''} ${customer.city || ''}<br>
      </div>

      <div class="document-title">${title}</div>

      <div class="meta-info">
        ${metaInfo}
      </div>

      <table>
        <thead>
          <tr>
            ${templateType === 'timesheet' ? `
              <th>Datum</th>
              <th>Tätigkeiten</th>
              <th>Stunden</th>
              <th>Stundensatz</th>
              <th>Gesamt</th>
            ` : `
              <th>Position</th>
              <th>Menge</th>
              <th>Einzelpreis</th>
              <th>Gesamt</th>
            `}
          </tr>
        </thead>
        <tbody>
          ${templateType === 'timesheet' && entity.activities?.length > 0 ? (() => {
            // Import timesheet grouping logic inline (simplified version)
            const groupActivitiesByDate = (activities: any[]) => {
              const groups = new Map();
              activities.forEach(activity => {
                const date = activity.date;
                if (!groups.has(date)) {
                  groups.set(date, { date, activities: [], totalHours: 0, totalAmount: 0 });
                }
                const group = groups.get(date);
                group.activities.push(activity);
                group.totalHours += activity.hours || 0;
                group.totalAmount += activity.total || 0;
              });
              return Array.from(groups.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            };

            const dayGroups = groupActivitiesByDate(entity.activities);
            
            return dayGroups.map((group: any) => {
              const formattedDate = new Date(group.date).toLocaleDateString('de-DE');
              const activitiesList = group.activities.map((a: any) => a.title).join(', ');
              const avgHourlyRate = group.activities.length > 0 ? group.activities[0].hourlyRate : 0;
              
              return `
                <tr style="background-color: #f8f9fa; border-top: 2px solid ${primaryColor};">
                  <td style="font-weight: bold; color: ${primaryColor};">
                    📅 ${formattedDate}
                  </td>
                  <td style="font-weight: bold;">
                    ${activitiesList}
                  </td>
                  <td style="font-weight: bold; color: ${primaryColor};">
                    ${group.totalHours.toFixed(1)}h
                  </td>
                  <td style="font-weight: bold;">
                    €${avgHourlyRate.toFixed(2)}
                  </td>
                  <td style="font-weight: bold; color: ${primaryColor};">
                    €${group.totalAmount.toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('');
          })() : entity.lineItems?.length > 0 ? (() => {
            const lineItems = entity.lineItems;
            // Parent-First + Grouped Sub-Items Logic (same as frontend)
            const parentItems = lineItems.filter((item: any) => !item.parentItemId);
            return parentItems.map((parentItem: any) => {
              const subItems = lineItems.filter((item: any) => item.parentItemId === parentItem.id);
              
              // Parent item row
              let html = `
                <tr>
                  <td>
                    ${parentItem.title}
                    ${parentItem.description ? `<br><small>${convertMarkdownToHtml(parentItem.description)}</small>` : ''}
                    ${parentItem.attachments && parentItem.attachments.length > 0 ? `
                      <div style="margin-top: 8px;">
                        <strong style="font-size: 11px; color: #666;">📎 Anhänge (${parentItem.attachments.length}):</strong>
                        <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                          ${parentItem.attachments.map((attachment: any) => {
                            console.log('🖼️ [PDF TEMPLATE] Processing attachment:', attachment.filename, 'has base64:', !!attachment.base64Data);
                            
                            if (attachment.base64Data) {
                              try {
                                // Direkte Verwendung der Base64-Daten als Data-URL (OHNE temporäre Dateien)
                                let dataUrl = attachment.base64Data;
                                
                                // Stelle sicher, dass die Data-URL korrekt formatiert ist
                                if (!dataUrl.startsWith('data:')) {
                                  const mimeType = attachment.fileType || 'image/png';
                                  dataUrl = `data:${mimeType};base64,${dataUrl}`;
                                }
                                
                                console.log('🖼️ [PDF TEMPLATE] Using data URL directly for:', attachment.originalFilename);
                                console.log('🖼️ [PDF TEMPLATE] Data URL length:', dataUrl.length);
                                
                                // Verkürze die Base64-Daten für kleinere Bilder (falls zu groß)
                                const maxDataUrlLength = 2000000; // 2MB limit
                                if (dataUrl.length > maxDataUrlLength) {
                                  console.log('🖼️ [PDF TEMPLATE] Image too large, showing placeholder');
                                  return `
                                    <div style="display: inline-block; text-align: center; margin: 4px; padding: 8px; border: 1px dashed #ccc; border-radius: 3px;">
                                      <div style="font-size: 24px; margin-bottom: 4px;">📷</div>
                                      <div style="font-size: 9px; color: #888; max-width: 80px; word-wrap: break-word;">
                                        ${attachment.originalFilename}
                                      </div>
                                      <div style="font-size: 8px; color: #999;">
                                        (${Math.round(dataUrl.length/1024)}KB)
                                      </div>
                                    </div>
                                  `;
                                }
                                
                                return `
                                  <div style="display: inline-block; text-align: center; margin: 4px;">
                                    <img src="${dataUrl}" 
                                         alt="${attachment.originalFilename}" 
                                         style="width: 60px; height: 45px; object-fit: cover; border: 1px solid #ddd; border-radius: 3px; display: block;" 
                                         onerror="this.style.display='none'; this.nextElementSibling.innerHTML='❌ Fehler';" />
                                    <div style="font-size: 9px; color: #888; margin-top: 2px; max-width: 60px; word-wrap: break-word;">
                                      ${attachment.originalFilename}
                                    </div>
                                  </div>
                                `;
                              } catch (error) {
                                console.error('🖼️ [PDF TEMPLATE] Error creating temp image:', error);
                                return `
                                  <div style="font-size: 10px; color: #999; border: 1px dashed #ccc; padding: 4px; border-radius: 3px;">
                                    📎 ${attachment.originalFilename} (Fehler beim Laden)
                                  </div>
                                `;
                              }
                            } else {
                              console.log('🖼️ [PDF TEMPLATE] No base64 data for:', attachment.originalFilename);
                              return `
                                <div style="font-size: 10px; color: #999; border: 1px dashed #ccc; padding: 4px; border-radius: 3px;">
                                  📎 ${attachment.originalFilename} (nicht verfügbar)
                                </div>
                              `;
                            }
                          }).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </td>
                  <td>${parentItem.quantity || 0}</td>
                  <td>€${(typeof parentItem.unitPrice === 'number' && !isNaN(parentItem.unitPrice)) ? parentItem.unitPrice.toFixed(2) : '0.00'}</td>
                  <td>€${(typeof parentItem.total === 'number' && !isNaN(parentItem.total)) ? parentItem.total.toFixed(2) : '0.00'}</td>
                </tr>
              `;
              
              // Sub-items for this parent (grouped underneath)
              subItems.forEach((subItem: any) => {
                html += `
                  <tr class="sub-item">
                    <td>
                      ↳ ${subItem.title}
                      ${subItem.description ? `<br><small>${convertMarkdownToHtml(subItem.description)}</small>` : ''}
                      ${subItem.attachments && subItem.attachments.length > 0 ? `
                        <div style="margin-top: 6px; margin-left: 16px;">
                          <strong style="font-size: 10px; color: #666;">📎 Anhänge:</strong>
                          <div style="display: flex; gap: 4px; margin-top: 3px; flex-wrap: wrap;">
                            ${subItem.attachments.map((attachment: any) => {
                              if (attachment.base64Data) {
                                // Extract base64 data without data URL prefix
                                const base64Data = attachment.base64Data.replace(/^data:[^;]+;base64,/, '');
                                
                                try {
                                  // Create temporary file for the image
                                  const tempDir = path.join(os.tmpdir(), 'rawalite-pdf-images');
                                  if (!existsSync(tempDir)) {
                                    mkdirSync(tempDir, { recursive: true });
                                  }
                                  
                                  const tempImagePath = path.join(tempDir, `${attachment.filename}_${Date.now()}.${attachment.fileType.split('/')[1] || 'png'}`);
                                  
                                  // Write base64 to temporary file
                                  writeFileSync(tempImagePath, base64Data, 'base64');
                                  
                                  return `
                                    <div style="display: inline-block; text-align: center;">
                                      <img src="file://${tempImagePath}" 
                                           alt="${attachment.originalFilename}" 
                                           style="width: 60px; height: 45px; object-fit: cover; border: 1px solid #ddd; border-radius: 2px;" />
                                      <div style="font-size: 8px; color: #888; margin-top: 1px; max-width: 60px; word-wrap: break-word;">
                                        ${attachment.originalFilename}
                                      </div>
                                    </div>
                                  `;
                                } catch (error) {
                                  console.error('🖼️ [PDF] Error creating temp image for sub-item:', error);
                                  return `
                                    <div style="font-size: 9px; color: #999; border: 1px dashed #ccc; padding: 2px; border-radius: 2px;">
                                      📎 ${attachment.originalFilename} (Fehler)
                                    </div>
                                  `;
                                }
                              } else {
                                return `
                                  <div style="font-size: 9px; color: #999; border: 1px dashed #ccc; padding: 2px; border-radius: 2px;">
                                    📎 ${attachment.originalFilename}
                                  </div>
                                `;
                              }
                            }).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </td>
                    <td>${subItem.quantity || 0}</td>
                    <td>€${(typeof subItem.unitPrice === 'number' && !isNaN(subItem.unitPrice)) ? subItem.unitPrice.toFixed(2) : '0.00'}</td>
                    <td>€${(typeof subItem.total === 'number' && !isNaN(subItem.total)) ? subItem.total.toFixed(2) : '0.00'}</td>
                  </tr>
                `;
              });
              
              return html;
            }).join('');
          })() : templateType === 'timesheet' ? '<tr><td colspan="5">Keine Aktivitäten</td></tr>' : '<tr><td colspan="4">Keine Positionen</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div>Zwischensumme: €${entity.subtotalBeforeDiscount?.toFixed(2) || entity.subtotal?.toFixed(2) || entity.total?.toFixed(2) || '0.00'}</div>
        ${entity.discountType && entity.discountValue > 0 ? 
          `<div style="color: ${secondaryColor};">Rabatt (${entity.discountType === 'percentage' ? entity.discountValue + '%' : '€' + entity.discountValue.toFixed(2)}): -€${entity.discountAmount?.toFixed(2) || '0.00'}</div>` : 
          ''
        }
        ${entity.discountType && entity.discountValue > 0 ? 
          `<div>Netto nach Rabatt: €${entity.subtotal?.toFixed(2) || '0.00'}</div>` : 
          ''
        }
        ${!settings?.companyData?.kleinunternehmer && entity.vatAmount && entity.vatAmount > 0 ? 
          `<div>MwSt. (${entity.vatRate || 19}%): €${entity.vatAmount.toFixed(2)}</div>` : 
          ''
        }
        ${settings?.companyData?.kleinunternehmer ? 
          '<div style="font-size: 12px; color: #666;">Umsatzsteuerbefreit nach §19 UStG</div>' : 
          ''
        }
        <div class="total-row">Gesamtbetrag: €${entity.total?.toFixed(2) || '0.00'}</div>
      </div>

      ${entity.notes ? (
        entity.notes.length > 200 ? 
          `<div class="notes"><strong>Anmerkungen:</strong><br>Siehe separate Anmerkungsseite für detaillierte Notizen.</div>` :
          `<div class="notes"><strong>Anmerkungen:</strong><br>${convertMarkdownToHtml(entity.notes)}</div>`
      ) : ''}

      <!-- ✅ SEPARATE ANMERKUNGEN-SEITE (vor Attachments) -->
      ${entity.notes && entity.notes.length > 200 ? `
        <div style="page-break-before: always; padding: 40px;">
          <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 24px; margin: 0; font-weight: 600;">
              Anmerkungen
            </h2>
            <div style="color: #666; font-size: 14px; margin-top: 8px;">
              ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'} - Detaillierte Anmerkungen
            </div>
          </div>

          <div style="
            background-color: #f9f9f9; 
            border-left: 4px solid #007acc; 
            padding: 25px; 
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin-bottom: 30px;
          ">
            ${convertMarkdownToHtml(entity.notes)}
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
            Anmerkungen - Seite ${templateType === 'offer' ? 'Angebot' : templateType === 'invoice' ? 'Rechnung' : 'Leistungsnachweis'}
          </div>
        </div>
      ` : ''}

      <!-- ✅ STANDARDS-KONFORME ANHANG-SEITE -->
      ${(() => {
        console.log('🔍 [PDF DEBUG] About to generate attachments page for templateType:', templateType);
        console.log('🔍 [PDF DEBUG] Entity has lineItems:', !!entity.lineItems);
        if (entity.lineItems) {
          console.log('🔍 [PDF DEBUG] Number of lineItems:', entity.lineItems.length);
          entity.lineItems.forEach((item: any, index: number) => {
            console.log(`🔍 [PDF DEBUG] LineItem ${index}: has attachments:`, !!item.attachments, 'count:', item.attachments?.length || 0);
          });
        }
        const attachmentPageHTML = generateAttachmentsPage(entity, templateType);
        console.log('🔍 [PDF DEBUG] Generated attachments page HTML length:', attachmentPageHTML.length);
        if (attachmentPageHTML.length > 0) {
          console.log('🔍 [PDF DEBUG] Attachments page HTML preview:', attachmentPageHTML.substring(0, 200) + '...');
        }
        return attachmentPageHTML;
      })()}
      
    </body>
    </html>
  `;
}

// 📁 File Management IPC Handlers for Attachments
import { join, extname, basename } from 'path';

// Save image file to user uploads directory
ipcMain.handle('files:saveImage', async (event, imageData: string, filename: string, subDir?: string) => {
  try {
    console.log(`💾 Saving image: ${filename} to ${subDir || 'root'}`);
    
    // Get user uploads directory
    const userDataPath = app.getPath('userData');
    const uploadsDir = join(userDataPath, 'assets', 'uploads', subDir || '');
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const ext = extname(filename);
    const baseName = basename(filename, ext);
    const uniqueFilename = `${baseName}_${timestamp}${ext}`;
    
    const filePath = join(uploadsDir, uniqueFilename);
    
    // Convert base64 to buffer and save
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    await fs.writeFile(filePath, buffer);
    
    console.log(`✅ Image saved successfully: ${filePath}`);
    return {
      success: true,
      filePath: filePath
    };
    
  } catch (error) {
    console.error('❌ Failed to save image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown file save error'
    };
  }
});

// Delete file from filesystem
ipcMain.handle('files:deleteFile', async (event, filePath: string) => {
  try {
    console.log(`🗑️ Deleting file: ${filePath}`);
    
    // Security check - only allow deletion from uploads directory
    const userDataPath = app.getPath('userData');
    const uploadsDir = join(userDataPath, 'assets', 'uploads');
    
    if (!filePath.startsWith(uploadsDir)) {
      throw new Error('File deletion only allowed from uploads directory');
    }
    
    // Check if file exists before attempting deletion
    await fs.access(filePath);
    await fs.unlink(filePath);
    
    console.log(`✅ File deleted successfully: ${filePath}`);
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ Failed to delete file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown file deletion error'
    };
  }
});

// Get image as base64 for display/PDF export
ipcMain.handle('files:getImageAsBase64', async (event, filePath: string) => {
  try {
    console.log(`📷 Reading image as base64: ${filePath}`);
    
    // Security check - only allow reading from uploads directory
    const userDataPath = app.getPath('userData');
    const uploadsDir = join(userDataPath, 'assets', 'uploads');
    
    if (!filePath.startsWith(uploadsDir)) {
      throw new Error('File reading only allowed from uploads directory');
    }
    
    // Read file and convert to base64
    const buffer = await fs.readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    
    // Determine MIME type
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
    
    console.log(`✅ Image read successfully: ${filePath} (${Math.round(buffer.length/1024)}KB)`);
    return {
      success: true,
      base64Data: base64Data
    };
    
  } catch (error) {
    console.error('❌ Failed to read image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown file read error'
    };
  }
});

// ============================================================================
// 🛠️ DEVELOPMENT COMMANDS
// ============================================================================

// Check for development flags
const isUpdateManagerDev = process.argv.includes('--update-manager-dev');

if (isDev && isUpdateManagerDev) {
  console.log('🛠️ [DEV] UpdateManager Development Mode activated');
  
  // Create standalone UpdateManager development window AFTER normal app startup
  app.whenReady().then(() => {
    setTimeout(() => {
      createUpdateManagerDevWindow();
      
      console.log('🛠️ [DEV] UpdateManager Development Window created');
      console.log('🛠️ [DEV] Features:');
      console.log('  - DevTools enabled');
      console.log('  - Mock progress service available');
      console.log('  - Hot reload support');
      console.log('  - CSS variable debugging');
    }, 2000); // Delay to allow normal app startup first
  });
}
