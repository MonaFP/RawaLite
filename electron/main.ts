// electron/main.ts
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
// 🗄️ Database imports with correct named exports syntax
import { getDb, prepare, exec, tx } from '../src/main/db/Database'
import { runAllMigrations } from '../src/main/db/MigrationService'
import { createHotBackup, createVacuumBackup, checkIntegrity, restoreFromBackup, cleanOldBackups } from '../src/main/db/BackupService'

const isDev = !app.isPackaged            // zuverlässig für Dev/Prod

function createWindow() {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
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

// Initialize database and run migrations when app is ready
app.whenReady().then(async () => {
  try {
    // Initialize database connection
    console.log('🗄️ Initializing database...')
    getDb()
    
    // Run pending migrations
    console.log('🔄 Running database migrations...')
    await runAllMigrations()
    
    // Create main window
    createWindow()
    
    console.log('✅ Application ready with database initialized')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    app.quit()
  }
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// === UPDATE SYSTEM INTEGRATION ===
const updateManager = new UpdateManagerService()

// Update IPC Handlers
ipcMain.handle('updates:check', async () => {
  return await updateManager.checkForUpdates()
})

ipcMain.handle('updates:getCurrentVersion', async () => {
  // Use app.getVersion() instead of private method
  return app.getVersion()
})

ipcMain.handle('updates:startDownload', async (event, updateInfo) => {
  return await updateManager.startDownload(updateInfo)
})

ipcMain.handle('updates:cancelDownload', async () => {
  return await updateManager.cancelDownload()
})

ipcMain.handle('updates:installUpdate', async (event, filePath) => {
  return await updateManager.installUpdate(filePath)
})

ipcMain.handle('updates:restartApp', async () => {
  return await updateManager.restartApplication()
})

ipcMain.handle('updates:getConfig', async () => {
  return updateManager.getConfig()
})

ipcMain.handle('updates:setConfig', async (event, config) => {
  return updateManager.setConfig(config)
})

ipcMain.handle('updates:openDownloadFolder', async () => {
  // Simple implementation - open downloads folder
  shell.showItemInFolder(app.getPath('downloads'))
})

ipcMain.handle('updates:verifyFile', async (event, filePath) => {
  // Basic file existence check
  try {
    await require('fs').promises.access(filePath)
    return true
  } catch {
    return false
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
    const headerTemplate = `
      <div style="font-size: 14px; width: 100%; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; background-color: #ffffff;">
        <div style="flex: 1; display: flex; align-items: center;">
          ${options.data.logo ? `<img src="${options.data.logo}" alt="Logo" style="max-height: 70px; max-width: 180px;">` : `<div style="color: ${primaryColor}; font-weight: bold; font-size: 16px;">${settings?.companyData?.name || 'RawaLite'}</div>`}
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
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 25px;  /* Reduced from 40px */
        }
        .company { 
          font-weight: bold; 
          color: ${primaryColor};
          font-size: 14px;  /* Explicit font size */
        }
        .logo { 
          max-width: 150px;  /* Reduced from 200px */
          max-height: 60px;  /* Reduced from 80px */
        }
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
          margin-top: 25px;  /* Reduced from 40px */
          padding: 15px;     /* Reduced from 20px */
          background-color: ${backgroundColor};  /* Use theme background */
          border: 1px solid ${accentColor};      /* Add subtle border */
          border-radius: 5px;
          border-left: 3px solid ${primaryColor};
          font-size: 11px;   /* Smaller notes text */
          color: ${textColor};  /* Use theme text color */
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div style="flex: 1;">
            <!-- Logo wird im PDF Header angezeigt, hier leer lassen -->
          </div>
          <div style="flex: 1;">
            <!-- Mittlere Spalte leer -->
          </div>
          <div style="flex: 1;">
            <!-- Firmenadresse wird im PDF Header angezeigt, hier leer lassen -->
          </div>
        </div>
      </div>

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
          ${entity.lineItems?.map((item: any) => `
            <tr class="${item.parentItemId ? 'sub-item' : ''}">
              <td>
                ${item.parentItemId ? '↳ ' : ''}${item.title}
                ${item.description ? `<br><small>${item.description}</small>` : ''}
              </td>
              <td>${item.quantity}</td>
              <td>€${item.unitPrice?.toFixed(2) || '0.00'}</td>
              <td>€${item.total?.toFixed(2) || '0.00'}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">Keine Positionen</td></tr>'}
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

      ${entity.notes ? `<div class="notes"><strong>Anmerkungen:</strong><br>${entity.notes}</div>` : ''}
    </body>
    </html>
  `;
}
