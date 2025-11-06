/**
 * PDF Core IPC Handlers
 * 
 * Handles the main PDF generation and status requests.
 * 
 * ⚠️ CRITICAL FIX-007: PDF Theme System Parameter-Based
 * This module contains the critical theme color extraction logic that MUST be preserved:
 * - primaryColor = options.theme?.theme?.primary || options.theme?.primary || '#7ba87b'
 * - accentColor = options.theme?.theme?.accent || options.theme?.accent || '#6b976b'
 * 
 * This prevents the old DOM-inspection approach and uses parameter-based theme passing.
 * 
 * @since v1.0.42.5
 * @critical FIX-007
 */

import { ipcMain, BrowserWindow, dialog, app, shell } from 'electron';
import { writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateTemplateHTML } from './pdf-templates';
import type Database from 'better-sqlite3';
import { DatabaseThemeService } from '../../src/services/DatabaseThemeService';

let themeService: DatabaseThemeService | null = null;

/**
 * Register all PDF core IPC handlers
 * 
 * @param db - Database instance for theme color loading
 */
export function registerPdfCoreHandlers(db?: Database.Database): void {
  console.log('🔌 [PDF-CORE] Registering PDF core IPC handlers...');
  
  // Initialize theme service if database provided
  if (db) {
    themeService = new DatabaseThemeService(db);
    console.log('✅ [PDF-CORE] Theme service initialized for database-based color loading');
  } else {
    console.warn('⚠️ [PDF-CORE] No database provided - will use hardcoded theme colors');
  }
  
  // Main PDF generation handler
  ipcMain.handle('pdf:generate', handlePdfGenerate);
  
  // PDF status/capability handler  
  ipcMain.handle('pdf:getStatus', handlePdfGetStatus);
  
  console.log('✅ [PDF-CORE] PDF core handlers registered successfully');
}

/**
 * Main PDF Generation Handler
 * 
 * ⚠️ CRITICAL FIX-007: Parameter-based theme color extraction
 * 
 * @param event - IPC event
 * @param options - PDF generation options with theme
 */
async function handlePdfGenerate(event: any, options: {
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
}) {
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
    const { mapFromSQL } = await import('../../src/lib/field-mapper');
    
    // Transform the main entity (offer/invoice/timesheet) from database format to JS format
    if (preprocessedData[options.templateType]) {
      const originalEntity = preprocessedData[options.templateType];
      console.log('🔍 [FIELD-MAPPING] Original entity keys:', Object.keys(originalEntity));
      
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
      
      // ✅ ALSO MAP lineItems and their attachments through field-mapper
      if (mappedEntity.lineItems && Array.isArray(mappedEntity.lineItems)) {
        console.log('🔍 [FIELD-MAPPING] Processing lineItems field mapping...');
        mappedEntity.lineItems = mappedEntity.lineItems.map((lineItem: any) => {
          const mappedLineItem = mapFromSQL(lineItem);
          
          // Also map attachments for each lineItem
          if (lineItem.attachments && Array.isArray(lineItem.attachments)) {
            mappedLineItem.attachments = lineItem.attachments.map((attachment: any) => mapFromSQL(attachment));
            console.log(`🔍 [FIELD-MAPPING] Line Item ${lineItem.id}: Mapped ${lineItem.attachments.length} attachments`);
          }
          
          return mappedLineItem;
        });
        
        console.log(`🔍 [FIELD-MAPPING] Processed ${mappedEntity.lineItems.length} lineItems`);
      }
      
      preprocessedData[options.templateType] = mappedEntity;
    }

    // 3. ✅ PRE-PROCESSING: Compress all attachments AFTER field mapping
    console.log('🔄 [PDF GENERATION] Starting attachment preprocessing...');
    if (preprocessedData[options.templateType]) {
      // Import from pdf-images module (will be created in Phase 4)
      // For now, use placeholder - will be implemented in Phase 4
      console.log('📝 [PDF-CORE] Attachment preprocessing placeholder - will be implemented in Phase 4');
      // preprocessedData[options.templateType] = await preprocessEntityAttachments(preprocessedData[options.templateType]);
    }
    
    // 4. Generate HTML content (NOW SYNC, using preprocessed attachments with correct field mapping)
    console.log('📝 [PDF-CORE] Generating HTML content using pdf-templates module...');
    const htmlContent = generateTemplateHTML({ ...options, data: preprocessedData });
    
    const { settings } = options.data;
    
    // ⚠️ FIX-008b: Database-based theme color loading (after backup restore)
    // Load theme colors from database instead of hardcoded fallbacks
    let primaryColor = '#7ba87b';   // Sage fallback
    let accentColor = '#6b976b';    // Sage fallback
    
    if (themeService && options.theme) {
      try {
        console.log('🎨 [PDF-FIX-008b] Loading theme from database:', options.theme);
        
        // Get theme name from options (can be string or object)
        let themeName = options.theme;
        if (typeof options.theme === 'object' && options.theme.themeKey) {
          themeName = options.theme.themeKey;
        } else if (typeof options.theme === 'object' && options.theme.name) {
          themeName = options.theme.name;
        }
        
        // Try to get theme by key
        const dbTheme = await (themeService as DatabaseThemeService).getThemeByKey(String(themeName).toLowerCase());
        
        if (dbTheme && dbTheme.colors) {
          console.log('✅ [PDF-FIX-008b] Theme loaded from database:', Object.keys(dbTheme.colors));
          // Use database colors for primary/accent
          primaryColor = dbTheme.colors['primary'] || dbTheme.colors['primary-bg'] || primaryColor;
          accentColor = dbTheme.colors['accent'] || dbTheme.colors['accent-color'] || accentColor;
          console.log('🎨 [PDF-FIX-008b] Using DB theme colors:', { primary: primaryColor, accent: accentColor });
        } else {
          console.warn('⚠️ [PDF-FIX-008b] Theme not found in database, using hardcoded colors');
          // Fallback to parameter-based (FIX-007 original)
          primaryColor = options.theme?.theme?.primary || options.theme?.primary || primaryColor;
          accentColor = options.theme?.theme?.accent || options.theme?.accent || accentColor;
        }
      } catch (error) {
        console.error('❌ [PDF-FIX-008b] Error loading theme from database:', error);
        // Fallback to original FIX-007 logic
        primaryColor = options.theme?.theme?.primary || options.theme?.primary || primaryColor;
        accentColor = options.theme?.theme?.accent || options.theme?.accent || accentColor;
      }
    } else {
      console.log('ℹ️ [PDF-FIX-008b] Theme service not available or no theme specified, using defaults');
      // Fallback to original FIX-007 logic
      primaryColor = options.theme?.theme?.primary || options.theme?.primary || primaryColor;
      accentColor = options.theme?.theme?.accent || options.theme?.accent || accentColor;
    }
    
    console.log(`🎨 PDF Header using theme colors:`, {
      primary: primaryColor,
      accent: accentColor,
      themeLoaded: themeService ? 'from-database' : 'hardcoded'
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

    // Setup temporary directory
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
}

/**
 * PDF Status Handler
 * Returns PDF generation capabilities and status
 */
async function handlePdfGetStatus() {
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
}