// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, Menu, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { PDFPostProcessor, PDFAConversionOptions } from '../src/services/PDFPostProcessor'
import { initializeBackupSystem } from './backup'
import { initializeLogoSystem } from './logo'

// === SINGLE INSTANCE LOCK ===
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Another instance is already running, quit this instance
  log.info('Another instance is already running, quitting...')
  app.quit()
} else {
  // Handle second instance attempt - focus existing window
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('Second instance detected, focusing existing window')
    // Someone tried to run a second instance, focus our existing window instead
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const mainWindow = windows[0]
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// === AUTO-UPDATER CONFIGURATION ===
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = false // User confirmation required
autoUpdater.autoInstallOnAppQuit = false // Manual installation via quitAndInstall nur

// Auto-updater events for IPC communication
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...')
  sendUpdateMessage('checking-for-update')
})

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info)
  sendUpdateMessage('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes,
    releaseDate: info.releaseDate
  })
})

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info)
  sendUpdateMessage('update-not-available', info)
})

autoUpdater.on('error', (err) => {
  log.error('Update error:', err)
  sendUpdateMessage('update-error', {
    message: err.message,
    stack: err.stack
  })
})

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
  log.info(logMessage)
  sendUpdateMessage('download-progress', {
    percent: Math.round(progressObj.percent),
    transferred: progressObj.transferred,
    total: progressObj.total,
    bytesPerSecond: progressObj.bytesPerSecond
  })
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info)
  log.info(`Update ready for installation: v${info.version}`)
  sendUpdateMessage('update-downloaded', {
    version: info.version,
    releaseNotes: info.releaseNotes
  })
})

// Helper function to send update messages to renderer
function sendUpdateMessage(type: string, data?: any) {
  const allWindows = BrowserWindow.getAllWindows()
  allWindows.forEach(window => {
    window.webContents.send('update-message', { type, data })
  })
}

// IPC Handlers for auto-updater
ipcMain.handle('updater:check-for-updates', async () => {
  try {
    log.info('Manual update check requested')
    const result = await autoUpdater.checkForUpdates()
    return {
      success: true,
      updateInfo: result?.updateInfo || null
    }
  } catch (error) {
    log.error('Check for updates failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('updater:start-download', async () => {
  try {
    log.info('Starting download of available update')
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    log.error('Download update failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('updater:install-and-restart', async () => {
  try {
    log.info('Installing update and restarting application')
    
    // Ensure all windows are properly closed before update
    const allWindows = BrowserWindow.getAllWindows()
    log.info(`Closing ${allWindows.length} windows before update`)
    
    // Close all windows gracefully
    allWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close()
      }
    })
    
    // Wait for windows to close
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For Windows NSIS installer: isForceRunAfter=true ensures app restarts after install
    log.info('Executing quitAndInstall for Windows NSIS installer')
    autoUpdater.quitAndInstall(false, true)
    
    return { success: true }
  } catch (error) {
    log.error('Install and restart failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('updater:get-version', async () => {
  return {
    current: app.getVersion(),
    appName: app.getName()
  }
})

// PDF Theme Integration Import
// Note: Import path needs compilation compatibility
const pdfThemesPath = path.join(__dirname, '..', 'src', 'lib', 'pdfThemes.ts');
let injectThemeIntoTemplate: any = null;

// Dynamic import for theme integration (compiled compatibility)
async function loadThemeIntegration() {
  try {
    if (!injectThemeIntoTemplate) {
      // For development/build compatibility, we'll implement theme injection inline
      injectThemeIntoTemplate = (templateHTML: string, pdfThemeData: any): string => {
        if (!pdfThemeData) return templateHTML;
        
        // Find the closing </style> tag and inject theme CSS before it
        const styleEndIndex = templateHTML.lastIndexOf('</style>');
        
        if (styleEndIndex === -1) {
          console.warn('No <style> tag found in template, cannot inject theme CSS');
          return templateHTML;
        }
        
        const themeInjection = `
          
          /* === PDF THEME INTEGRATION === */
          :root {
            ${pdfThemeData.cssVariables}
          }
          
          ${pdfThemeData.themeCSS}
          /* === END THEME INTEGRATION === */
        `;
        
        // Insert theme CSS before closing </style>
        const themedTemplate = 
          templateHTML.substring(0, styleEndIndex) + 
          themeInjection + 
          templateHTML.substring(styleEndIndex);
        
        return themedTemplate;
      };
    }
  } catch (error) {
    console.warn('Theme integration not available:', error);
    injectThemeIntoTemplate = (template: string) => template; // Fallback
  }
}

const isDev = !app.isPackaged            // zuverlässig für Dev/Prod

function createMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Beenden',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { label: 'Rückgängig', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Wiederholen', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Ausschneiden', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopieren', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Einfügen', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Alles auswählen', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        { label: 'Vollbild', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'Entwicklertools', accelerator: 'F12', role: 'toggledevtools' },
          { label: 'Neu laden', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Erzwungenes Neu laden', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' }
        ] : [])
      ]
    },
    {
      label: 'Update',
      submenu: [
        {
          label: 'Nach Updates suchen',
          click: () => {
            log.info('Manual update check triggered from menu')
            autoUpdater.checkForUpdates().catch(err => {
              log.error('Manual update check failed:', err)
            })
          }
        },
        { type: 'separator' },
        {
          label: 'App-Version anzeigen',
          click: () => {
            const version = app.getVersion()
            dialog.showMessageBox({
              type: 'info',
              title: 'App-Version',
              message: `RawaLite Version ${version}`,
              detail: `Electron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
              buttons: ['OK']
            })
          }
        }
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über RawaLite',
          click: () => {
            // In-App Über-Dialog statt externe URL
            const allWindows = BrowserWindow.getAllWindows();
            const mainWindow = allWindows[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Über RawaLite',
                message: `RawaLite v${app.getVersion()}`,
                detail: 'Professional Business Management Solution\n\nCopyright © 2025 MonaFP. All rights reserved.',
                buttons: ['OK']
              });
            }
          }
        },
        {
          label: 'App-Version anzeigen',
          click: () => {
            // Version Info statt Dokumentation
            const allWindows = BrowserWindow.getAllWindows();
            const mainWindow = allWindows[0];
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Version Information',
                message: `RawaLite v${app.getVersion()}`,
                detail: `Electron: ${process.versions.electron}\nNode.js: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
                buttons: ['OK']
              });
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

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
    win.loadURL('http://localhost:5173')
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Statisches HTML aus dist-Ordner
    win.loadFile(path.join(rootPath, 'dist', 'index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    // SECURITY: Externe Navigation blockiert gemäß COPILOT_INSTRUCTIONS.md
    console.log('External navigation blocked:', url)
    return { action: 'deny' }
  })
}

// IPC Handler für App-Operationen
ipcMain.handle('app:restart', async () => {
  app.relaunch()
  app.exit()
})

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion()
})

// IPC Handler für Datenbank-Operationen
ipcMain.handle('db:load', async (): Promise<Uint8Array | null> => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
    if (!fs.existsSync(dbPath)) {
      return null
    }
    return fs.readFileSync(dbPath)
  } catch (error) {
    console.error('Error loading database:', error)
    return null
  }
})

ipcMain.handle('db:save', async (_, data: Uint8Array): Promise<boolean> => {
  try {
    const userDataPath = app.getPath('userData')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    
    const dbPath = path.join(userDataPath, 'database.sqlite')
    fs.writeFileSync(dbPath, data)
    return true
  } catch (error) {
    console.error('Error saving database:', error)
    return false
  }
})

// IPC Handler für PDF-Generierung
ipcMain.handle('pdf:generate', async (event, options: {
  templateType: 'offer' | 'invoice' | 'timesheet';
  data: {
    offer?: any;
    invoice?: any;
    timesheet?: any;
    customer: any;
    settings: any;
    currentDate?: string;
  };
  theme?: any; // ✅ Theme-Daten hinzufügen
  options: {
    filename: string;
    previewOnly: boolean;
    enablePDFA: boolean;
    validateCompliance: boolean;
  };
}) => {
  try {
    console.log(`🎯 PDF generation requested: ${options.templateType} - ${options.options.filename}`);
    
    // 🚨 IPC DEBUG: Check what arrives via IPC
    console.log('🔍 IPC TRANSMISSION DEBUG:');
    console.log('  - options.data exists:', !!options.data);
    console.log('  - options.data.offer exists:', !!options.data.offer);
    if (options.data.offer) {
      console.log('  - offer.offerNumber:', options.data.offer.offerNumber);
      console.log('  - offer.lineItems exists:', !!options.data.offer.lineItems);
      console.log('  - offer.lineItems length:', options.data.offer.lineItems?.length || 0);
      if (options.data.offer.lineItems && options.data.offer.lineItems.length > 0) {
        console.log('  - First line item structure:', Object.keys(options.data.offer.lineItems[0] || {}));
        console.log('  - First line item values:', options.data.offer.lineItems[0]);
      }
    }
    
    // 1. Validate inputs
    if (!options.templateType || !options.data || !options.options) {
      return {
        success: false,
        error: 'Invalid PDF generation parameters'
      };
    }

    // 2. Get template path
    const templatePath = getTemplatePath(options.templateType);
    if (!fs.existsSync(templatePath)) {
      return {
        success: false,
        error: `Template not found: ${options.templateType}`
      };
    }

    // 3. Render template with data - ENHANCED with Field Mapping
    const templateData = {
      [options.templateType]: options.data.offer || options.data.invoice || options.data.timesheet,
      customer: options.data.customer,
      settings: options.data.settings,
      company: {
        // Map company fields to match template expectations
        ...options.data.settings?.companyData,
        zip: options.data.settings?.companyData?.postalCode || options.data.settings?.companyData?.zip, // FIX: Map postalCode to zip
        taxId: options.data.settings?.companyData?.taxNumber || options.data.settings?.companyData?.taxId // FIX: Map taxNumber to taxId
      },
      currentDate: options.data.currentDate || new Date().toLocaleDateString('de-DE'),
      theme: options.theme // ✅ CRITICAL FIX: Theme-Daten für PDF-Templates hinzufügen
    };
    
    // 🚨 KRITISCHER DEBUG: Prüfe was wirklich ankommt
    console.log('🚨 RAW DEBUG - options.data.settings:');
    console.log('  - settings object:', !!options.data.settings);
    if (options.data.settings) {
      console.log('  - settings.companyData:', !!options.data.settings.companyData);
      console.log('  - settings keys:', Object.keys(options.data.settings));
      if (options.data.settings.companyData) {
        console.log('  - companyData.kleinunternehmer:', options.data.settings.companyData.kleinunternehmer);
        console.log('  - companyData keys:', Object.keys(options.data.settings.companyData));
      }
    }
    console.log('🚨 RAW DEBUG - options.theme:');
    console.log('  - theme object:', !!options.theme);
    if (options.theme) {
      console.log('  - theme keys:', Object.keys(options.theme));
      console.log('  - theme.theme:', !!options.theme.theme);
    }
    
    // 🔍 DEBUG: Log template data structure ERWEITERT
    console.log('📊 Template Data Structure:');
    console.log('  - Type:', options.templateType);
    console.log('  - Offer exists:', !!templateData.offer);
    console.log('  - Customer exists:', !!templateData.customer);
    console.log('  - Company exists:', !!templateData.company);
    if (templateData.company) {
      console.log('  - Company Kleinunternehmer:', templateData.company.kleinunternehmer);
      console.log('  - Company Name (name field):', templateData.company.name); // ✅ CORRECT DEBUG
      console.log('  - Company Street:', templateData.company.street);
      console.log('  - Company City:', templateData.company.city);
      console.log('  - Company Keys:', Object.keys(templateData.company));
    }
    console.log('  - Theme exists:', !!templateData.theme);
    if (templateData.theme) {
      console.log('  - Theme ID:', templateData.theme.themeId);
      console.log('  - Theme Colors:', templateData.theme.primary, templateData.theme.secondary, templateData.theme.accent);
      console.log('  - Theme.theme exists:', !!templateData.theme.theme);
      if (templateData.theme.theme) {
        console.log('  - Nested Theme Colors:', templateData.theme.theme.primary, templateData.theme.theme.secondary);
      }
    }
    if (templateData.offer) {
      console.log('  - Offer Number:', templateData.offer.offerNumber);
      console.log('  - Offer VAT Amount:', templateData.offer.vatAmount);
      console.log('  - Offer VAT Rate:', templateData.offer.vatRate);
      console.log('  - Line Items Count:', templateData.offer.lineItems?.length || 0);
      
      // 🚨 CRITICAL DEBUG: Line Items Details
      if (templateData.offer.lineItems && templateData.offer.lineItems.length > 0) {
        console.log('🔍 LINE ITEMS DETAILED ANALYSIS:');
        templateData.offer.lineItems.forEach((item: any, index: number) => {
          console.log(`  Item ${index}:`, {
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            types: {
              quantity: typeof item.quantity,
              unitPrice: typeof item.unitPrice,
              total: typeof item.total
            }
          });
        });
      }
    }
    if (templateData.settings) {
      console.log('  - Settings exists:', !!templateData.settings);
      console.log('  - Settings.companyData exists:', !!templateData.settings.companyData);
      if (templateData.settings.companyData) {
        console.log('  - Settings companyData Kleinunternehmer:', templateData.settings.companyData.kleinunternehmer);
      }
    }
    
    // 🧪 CRITICAL TEST: Test template variable resolution
    console.log('🧪 TEMPLATE VARIABLE RESOLUTION TEST:');
    const testVars = ['offer.offerNumber', 'customer.name', 'company.name'];
    testVars.forEach(varPath => {
      const value = getNestedValue(templateData, varPath);
      console.log(`  {{${varPath}}} = ${value !== undefined ? `"${value}"` : 'UNDEFINED'}`);
    });
    
    const htmlContent = await renderTemplate(templatePath, templateData);    // 4. Create temporary file for PDF generation
    const tempDir = path.join(os.tmpdir(), 'rawalite-pdf');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
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

    // 5. Generate PDF using Electron's webContents.printToPDF
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
      
      // Generate PDF
      const pdfBuffer = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 2.5,
          bottom: 2,
          left: 2.5,
          right: 2
        }
      });

      // Save initial PDF
      fs.writeFileSync(tempPdfPath, pdfBuffer);
      
      let finalPdfPath = tempPdfPath;
      let validationResult;

      // 6. PDF/A-2b conversion if enabled
      if (options.options.enablePDFA) {
        const pdfaPath = tempPdfPath.replace('.pdf', '_pdfa.pdf');
        
        const conversionOptions: PDFAConversionOptions = {
          inputPath: tempPdfPath,
          outputPath: pdfaPath,
          title: `${options.templateType} - ${options.options.filename}`,
          author: options.data.settings?.companyName || 'RawaLite',
          subject: `Business ${options.templateType}`,
          keywords: ['PDF/A', 'Business', options.templateType],
          creator: 'RawaLite PDF Service',
          producer: 'RawaLite v1.5.6 with Electron & Ghostscript'
        };

        const conversionResult = await PDFPostProcessor.convertToPDFA(conversionOptions);
        
        if (conversionResult.success && conversionResult.outputPath) {
          finalPdfPath = conversionResult.outputPath;
          validationResult = conversionResult.validationResult;
        } else {
          console.warn('PDF/A conversion failed, using standard PDF:', conversionResult.error);
        }
      }

      // 7. Move to final location if not preview
      if (!options.options.previewOnly && finalPdfPath !== outputPdfPath) {
        fs.copyFileSync(finalPdfPath, outputPdfPath);
        finalPdfPath = outputPdfPath;
      }

      // 8. Handle preview mode
      if (options.options.previewOnly) {
        // Open PDF in external viewer for preview
        try {
          await shell.openPath(finalPdfPath);
        } catch (previewError) {
          console.warn('Could not open PDF preview:', previewError);
        }
      }

      // 9. Create result
      const fileSize = fs.statSync(finalPdfPath).size;
      const result = {
        success: true,
        filePath: options.options.previewOnly ? undefined : finalPdfPath,
        previewUrl: options.options.previewOnly ? `file://${finalPdfPath}` : undefined,
        fileSize,
        compliance: validationResult,
        message: `PDF generated successfully: ${options.options.filename}`
      };

      console.log(`✅ PDF generation completed: ${options.options.filename} (${Math.round(fileSize/1024)}KB)`);
      return result;

    } finally {
      // Clean up PDF window
      pdfWindow.close();
      
      // Robust cleanup with retry mechanism
      cleanupTempFile(tempPdfPath);
    }

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF generation error'
    };
  }
})

// Helper: Get template file path
function getTemplatePath(templateType: string): string {
  if (isDev) {
    // Development: Templates im Projekt-Root/templates
    const rootPath = process.cwd();
    return path.join(rootPath, 'templates', `${templateType}.html`);
  } else {
    // Production: Templates in extraResources/app/templates
    const resourcesPath = process.resourcesPath;
    return path.join(resourcesPath, 'app', 'templates', `${templateType}.html`);
  }
}

// Helper: Render template with data using simple string replacement
async function renderTemplate(templatePath: string, data: any): Promise<string> {
  try {
    let template = fs.readFileSync(templatePath, 'utf-8');
    
    // STEP 1: Process conditionals and loops FIRST (before variable replacement)
    console.log('🔄 Processing conditionals and loops first...');
    
    template = template.replace(/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
      const value = getNestedValue(data, condition.trim());
      const result = value ? content : '';
      console.log(`🔄 Conditional {{#if ${condition.trim()}}}: value=${!!value}, showing=${!!result}`);
      return result;
    });

    template = template.replace(/\{\{#unless\s+([^}]+)\}\}(.*?)\{\{\/unless\}\}/gs, (match, condition, content) => {
      const value = getNestedValue(data, condition.trim());
      const result = !value ? content : '';
      console.log(`🔄 Conditional {{#unless ${condition.trim()}}}: value=${!!value}, showing=${!!result}`);
      return result;
    });

    // Handle loops {{#each}}
    template = template.replace(/\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayVar, itemTemplate) => {
      const array = getNestedValue(data, arrayVar.trim());
      console.log(`🔄 Loop {{#each ${arrayVar.trim()}}}: array length=${Array.isArray(array) ? array.length : 'NOT_ARRAY'}`);
      
      if (!Array.isArray(array)) {
        console.log(`⚠️ {{#each}} target is not an array:`, array);
        return '';
      }
      
      console.log(`📋 Processing ${array.length} items in loop...`);
      return array.map((item, index) => {
        console.log(`  📄 Item ${index}:`, Object.keys(item || {}));
        
        // 🚨 CRITICAL DEBUG: Check actual values
        if (item && typeof item === 'object') {
          console.log(`    🔍 Item values:`, {
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          });
        }
        
        return itemTemplate.replace(/\{\{this\.([^}]+)\}\}/g, (_match: string, prop: string) => {
          const itemValue = String(item[prop] || '');
          if (itemValue) {
            console.log(`    ✅ {{this.${prop}}} = "${itemValue}"`);
          } else {
            console.log(`    ⚠️ Empty {{this.${prop}}} (value was: ${item[prop]})`);
          }
          return itemValue;
        }).replace(/\{\{formatCurrency\s+this\.([^}]+)\}\}/g, (_match: string, prop: string) => {
          // CRITICAL FIX: Handle formatCurrency within loop context
          const amount = item[prop];
          console.log(`💰 [LOOP] Formatting currency: this.${prop} = ${amount}`);
          if (typeof amount === 'number') {
            const formatted = amount.toFixed(2).replace('.', ',') + ' €';
            console.log(`✅ [LOOP] Currency formatted: ${amount} → ${formatted}`);
            return formatted;
          }
          console.log(`⚠️ [LOOP] Invalid currency value for: this.${prop}`);
          return '0,00 €';
        });
      }).join('');
    });

    // STEP 2: Handle special formatters BEFORE general variable replacement
    template = template.replace(/\{\{formatDate\s+([^}]+)\}\}/g, (match, dateVar) => {
      const dateValue = getNestedValue(data, dateVar.trim());
      console.log(`📅 Formatting date: ${dateVar.trim()} = ${dateValue}`);
      if (dateValue) {
        try {
          const formatted = new Date(dateValue).toLocaleDateString('de-DE');
          console.log(`✅ Date formatted: ${dateValue} → ${formatted}`);
          return formatted;
        } catch (err) {
          console.error(`❌ Date formatting failed for ${dateValue}:`, err);
          return String(dateValue);
        }
      }
      console.log(`⚠️ Empty date value for: ${dateVar.trim()}`);
      return '';
    });

    template = template.replace(/\{\{formatCurrency\s+([^}]+)\}\}/g, (match, amountVar) => {
      const amount = getNestedValue(data, amountVar.trim());
      console.log(`💰 Formatting currency: ${amountVar.trim()} = ${amount}`);
      if (typeof amount === 'number') {
        const formatted = amount.toFixed(2).replace('.', ',') + ' €';
        console.log(`✅ Currency formatted: ${amount} → ${formatted}`);
        return formatted;
      }
      console.log(`⚠️ Invalid currency value for: ${amountVar.trim()}`);
      return '0,00 €';
    });

    // STEP 3: Replace simple {{variable}} with actual values  
    console.log('🔄 Starting Handlebars-like variable replacement...');
    template = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const parts = variable.trim().split('.');
      let value = data;
      let path = '';
      
      for (const part of parts) {
        path += (path ? '.' : '') + part;
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          console.log(`⚠️ Missing value for: ${variable.trim()} (failed at: ${path})`);
          return ''; // Return empty string for missing values
        }
      }
      
      const result = String(value || '');
      if (result) {
        console.log(`✅ Replaced {{${variable.trim()}}} = "${result}"`);
      } else {
        console.log(`⚠️ Empty result for {{${variable.trim()}}}`);
      }
      return result;
    });

    // STEP 4: AFTER template rendering - Apply theme colors to the FINAL HTML
    if (data.theme && data.theme.theme) {
      console.log('🎨 Applying theme colors to RENDERED template:', data.theme.themeId);
      console.log('🎨 Theme colors:', data.theme.theme);
      
      // Direct color replacement for reliable PDF rendering
      const theme = data.theme.theme;
      
      // === COMPREHENSIVE COLOR REPLACEMENT STRATEGY ===
      console.log('🔄 Starting color replacements on FINAL HTML...');
      
      // 1. Replace PRIMARY colors (brand colors that should be theme primary)
      template = template.replace(/#1e3a2e/g, theme.primary);  // Main brand color
      template = template.replace(/color: #1e3a2e/g, `color: ${theme.primary}`);  // With CSS property
      
      // 2. Replace SECONDARY colors (text and supporting elements)
      template = template.replace(/#0f2419/g, theme.secondary); // Secondary brand
      template = template.replace(/color: #333/g, `color: ${theme.secondary}`);
      template = template.replace(/color: #666/g, `color: ${theme.secondary}`);
      template = template.replace(/color: #555/g, `color: ${theme.secondary}`);
      
      // 3. Replace ACCENT colors (highlights and active elements)
      template = template.replace(/#10b981/g, theme.accent);    // Accent color
      
      // 4. Replace BORDERS with theme-based transparency
      template = template.replace(/border-bottom: 1px solid #e0e0e0/g, `border-bottom: 1px solid ${theme.primary}33`);
      template = template.replace(/border-top: 1px solid #e0e0e0/g, `border-top: 1px solid ${theme.primary}33`);
      template = template.replace(/border: 1px solid #d0d0d0/g, `border: 1px solid ${theme.primary}44`);
      template = template.replace(/border-right: 1px solid #e0e0e0/g, `border-right: 1px solid ${theme.primary}33`);
      template = template.replace(/border-top: 2px solid #1e3a2e/g, `border-top: 2px solid ${theme.primary}`);
      template = template.replace(/border-bottom: 1px solid #ccc/g, `border-bottom: 1px solid ${theme.primary}66`);
      
      // 5. Replace BACKGROUND colors with theme-based transparency
      template = template.replace(/background-color: #f8f9fa/g, `background-color: ${theme.primary}11`);
      template = template.replace(/background-color: #fafafa/g, `background-color: ${theme.primary}08`);
      
      // 6. ADDITIONAL COMPREHENSIVE REPLACEMENTS (from template analysis)
      // These are ALL colors found in the template that should be themed:
      
      // Text colors that should match theme
      template = template.replace(/color: #000/g, `color: ${theme.secondary}`); // Black text to theme secondary
      
      // All border variations found in template
      template = template.replace(/1px solid #e0e0e0/g, `1px solid ${theme.primary}33`);
      template = template.replace(/1px solid #d0d0d0/g, `1px solid ${theme.primary}44`);
      template = template.replace(/1px solid #ccc/g, `1px solid ${theme.primary}66`);
      template = template.replace(/2px solid #1e3a2e/g, `2px solid ${theme.primary}`);
      
      // Background variations
      template = template.replace(/#f8f9fa/g, `${theme.primary}11`); // Table header background
      template = template.replace(/#fafafa/g, `${theme.primary}08`); // Sub-item background
      
      // ✨ FINAL CATCH-ALL: Replace any remaining #1e3a2e instances
      template = template.replace(/#1e3a2e/g, theme.primary);
      
      console.log('✅ Applied COMPREHENSIVE color replacements to FINAL HTML for theme:', theme.primary, theme.secondary, theme.accent);
      console.log('🔍 Total replacements: Primary brand, text colors, borders, backgrounds');
      console.log('📄 Template length after replacements:', template.length, 'characters');
    } else {
      console.log('⚠️ No theme data provided or incorrect structure:', data.theme);
    }

    return template;
    
  } catch (error) {
    console.error('Template rendering failed:', error);
    throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper: Get nested object value by dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => {
    return current && typeof current === 'object' ? current[prop] : undefined;
  }, obj);
}

// IPC Handler für PDF-Status
ipcMain.handle('pdf:getStatus', async () => {
  try {
    const capabilities = await PDFPostProcessor.getSystemCapabilities();
    return {
      electronAvailable: true,
      ...capabilities
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

// Helper: Robust temporary file cleanup with retry mechanism
function cleanupTempFile(filePath: string): void {
  const maxRetries = 5;
  const retryDelay = 2000; // Start with 2 seconds
  
  function attemptCleanup(retryCount: number = 0): void {
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Cleaned up temporary PDF file: ${path.basename(filePath)}`);
        }
      } catch (error) {
        if (retryCount < maxRetries) {
          console.log(`⏳ Retry ${retryCount + 1}/${maxRetries} - PDF file still locked, retrying in ${retryDelay * (retryCount + 1)}ms...`);
          attemptCleanup(retryCount + 1);
        } else {
          // Final attempt failed - log warning but don't crash
          console.warn(`⚠️ Could not clean up temporary PDF file after ${maxRetries} attempts:`, path.basename(filePath));
          console.warn('File may be opened in external viewer. Manual cleanup may be required.');
          
          // Optional: Try to schedule cleanup for later (when app closes)
          const cleanupOnExit = () => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Cleaned up temporary file on app exit: ${path.basename(filePath)}`);
              }
            } catch (e) {
              // Silent fail on exit cleanup
            }
          };
          
          // Schedule cleanup when app is about to quit
          app.once('before-quit', cleanupOnExit);
        }
      }
    }, retryDelay * (retryCount + 1)); // Exponential backoff
  }
  
  attemptCleanup();
}

app.whenReady().then(() => {
  createMenu()
  createWindow()
  
  // Initialize theme integration
  loadThemeIntegration()
  
  // Initialize backup system
  initializeBackupSystem()
  
  // Initialize logo system
  initializeLogoSystem()
  
  // Auto-check for updates on startup (delayed to avoid blocking app start)
  setTimeout(() => {
    log.info('Starting automatic update check on app ready')
    autoUpdater.checkForUpdates().catch(err => {
      log.warn('Startup update check failed:', err.message)
    })
  }, 5000) // 5 second delay
})
app.on('window-all-closed', () => { 
  log.info('All windows closed')
  if (process.platform !== 'darwin') app.quit() 
})
app.on('activate', () => { 
  log.info('App activated')
  if (BrowserWindow.getAllWindows().length === 0) createWindow() 
})
app.on('before-quit', (event) => {
  log.info('App is about to quit')
})
app.on('will-quit', (event) => {
  log.info('App will quit')
})
