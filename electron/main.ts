// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, protocol } from 'electron'
import path from 'node:path'
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { marked } from 'marked'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
import { updateEntityStatus, getStatusHistory, getEntityForUpdate } from '../src/main/services/EntityStatusService'
// 🗄️ Database imports with correct named exports syntax
import { getDb, prepare, exec, tx } from '../src/main/db/Database'
import { runAllMigrations } from '../src/main/db/MigrationService'
import { createHotBackup, createVacuumBackup, checkIntegrity, restoreFromBackup, cleanOldBackups } from '../src/main/db/BackupService'

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

    // 2. Generate HTML content and extract data for headers
    const htmlContent = generateTemplateHTML(options);
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

// Helper function to generate HTML content for PDF templates
function generateTemplateHTML(options: any): string {
  const { templateType, data, theme } = options;
  const entity = data[templateType] || data.offer || data.invoice || data.timesheet;
  const { customer, settings } = data;
  
  // 🔍 DEBUG: Log line items and attachments
  if (templateType === 'offer' && entity.lineItems) {
    console.log('🔍 [PDF DEBUG] Offer line items received:', entity.lineItems.length);
    entity.lineItems.forEach((item: any, index: number) => {
      console.log(`🔍 [PDF DEBUG] Item ${index + 1}: ${item.title}`);
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
            <th>Position</th>
            <th>Menge</th>
            <th>Einzelpreis</th>
            <th>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${entity.lineItems?.length > 0 ? (() => {
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
                  <td>${parentItem.quantity}</td>
                  <td>€${parentItem.unitPrice?.toFixed(2) || '0.00'}</td>
                  <td>€${parentItem.total?.toFixed(2) || '0.00'}</td>
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
                    <td>${subItem.quantity}</td>
                    <td>€${subItem.unitPrice?.toFixed(2) || '0.00'}</td>
                    <td>€${subItem.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                `;
              });
              
              return html;
            }).join('');
          })() : '<tr><td colspan="4">Keine Positionen</td></tr>'}
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

      ${entity.notes ? `<div class="notes${entity.notes.length > 500 ? ' notes-long' : ''}"><strong>Anmerkungen:</strong><br>${convertMarkdownToHtml(entity.notes)}</div>` : ''}
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
