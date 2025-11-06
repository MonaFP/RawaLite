/**
 * 🎯 PDFService - Native Electron PDF Generation (v1.7.5 Rollback)
 * 
 * Features:
 * - Native Electron PDF generation with dialog support
 * - PDF preview functionality via previewUrl
 * - User-selectable save locations
 * - Theme-aware PDF styling
 * - Logo embedding with Base64 support
 * - Error handling and validation
 * 
 * Migrated from v1.7.5 for superior UX (native preview vs browser popups)
 */

import type { Customer, Offer, Invoice } from '../persistence/adapter';

export interface PDFResult {
  success: boolean;
  filePath?: string;
  previewUrl?: string;
  fileSize?: number;
  error?: string;
}

/**
 * 📄 PDFService - Main service for PDF generation and management
 */
export class PDFService {

  /**
   * Export offer to PDF with save dialog or preview
   */
  static async exportOfferToPDF(
    offer: Offer,
    customer: Customer,
    settings: any,
    isPreview: boolean = false,
    currentTheme?: any,
    customColors?: any,
    logoData?: string | null // Base64-encoded Logo-Daten für PDF
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting offer ${offer.offerNumber} to PDF (preview: ${isPreview})`);
      console.log('📋 Offer data received for PDF:', {
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount: offer.discountAmount,
        subtotalBeforeDiscount: offer.subtotalBeforeDiscount,
        subtotal: offer.subtotal,
        total: offer.total,
        lineItemsWithAttachments: offer.lineItems?.map(item => ({ 
          id: item.id, 
          title: item.title,
          attachmentCount: item.attachments?.length || 0 
        }))
      });
      
      // Process attachments - convert file paths to base64 for PDF embedding
      const processedOffer = await this.processOfferAttachments(offer);
      
      // Generate theme data for PDF styling
      console.log('🎨 [PDF-DEBUG] Input currentTheme for PDF generation:', currentTheme);
      console.log('🎨 [PDF-DEBUG] Type of currentTheme:', typeof currentTheme);
      console.log('🎨 [PDF-DEBUG] Truthy check:', !!currentTheme);
      
      // CRITICAL FIX: Ensure theme data is properly generated
      // Handle both string themes (from useTheme) and complex theme objects
      const pdfTheme = currentTheme ? this.getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // VALIDATION: Log theme structure for debugging
      if (pdfTheme) {
        console.log('🎨 [PDF-VALIDATION] Theme structure:', {
          hasThemeId: !!pdfTheme.themeId,
          hasThemeObject: !!pdfTheme.theme,
          hasColors: pdfTheme.theme ? {
            primary: !!pdfTheme.theme.primary,
            secondary: !!pdfTheme.theme.secondary,
            accent: !!pdfTheme.theme.accent,
            text: !!pdfTheme.theme.text
          } : null
        });
      } else {
        console.warn('⚠️ [PDF-WARNING] No PDF theme generated - theme data might be missing or null');
      }
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'offer' as const,
        data: {
          offer: processedOffer,
          customer,
          settings,
          currentDate: new Date().toLocaleDateString('de-DE'),
          logo: logoData // Logo-Daten für Template-Einbettung
        },
        // Theme data at the top level for template access
        theme: pdfTheme ? {
          themeId: pdfTheme.themeId,
          theme: pdfTheme.theme,
          primary: pdfTheme.theme.primary,
          secondary: pdfTheme.theme.secondary,
          accent: pdfTheme.theme.accent
        } : null,
        options: {
          filename: `Angebot_${offer.offerNumber}_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          previewOnly: isPreview,
          enablePDFA: false,
          validateCompliance: false
        }
      };

      console.log('🔄 Calling PDF generation via IPC (with logo:', !!logoData, ')...', templateData);
      const result = await window.electronAPI?.pdf?.generate(templateData);
      console.log('📋 PDF generation result:', result);
      
      if (result?.success) {
        console.log('✅ PDF generation successful:', result.filePath);
        
        if (isPreview && result.previewUrl) {
          console.log('🔍 Opening PDF preview...');
        }

        return result;
      } else {
        console.error('❌ PDF generation failed:', result?.error);
        return result || {
          success: false,
          error: 'PDF generation failed - no result'
        };
      }
    } catch (error) {
      console.error('PDF Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF generation error'
      };
    }
  }

  /**
   * Export invoice to PDF with save dialog or preview
   */
  static async exportInvoiceToPDF(
    invoice: Invoice,
    customer: Customer,
    settings: any,
    isPreview: boolean = false,
    currentTheme?: any,
    customColors?: any,
    logoData?: string | null // Base64-encoded Logo-Daten für PDF
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting invoice ${invoice.invoiceNumber} to PDF (preview: ${isPreview})`);
      console.log('🔍 Invoice notes debug:', {
        hasNotes: !!invoice.notes,
        notesLength: invoice.notes?.length || 0,
        notesContent: invoice.notes ? (invoice.notes.substring(0, 100) + (invoice.notes.length > 100 ? '...' : '')) : 'undefined',
        fullNotes: invoice.notes
      });
      console.log('📋 Invoice data received for PDF:', {
        discountType: invoice.discountType,
        discountValue: invoice.discountValue,
        discountAmount: invoice.discountAmount,
        subtotalBeforeDiscount: invoice.subtotalBeforeDiscount,
        subtotal: invoice.subtotal,
        total: invoice.total,
        lineItemsWithAttachments: invoice.lineItems?.map(item => ({ 
          id: item.id, 
          title: item.title,
          attachmentCount: item.attachments?.length || 0 
        }))
      });
      
      // Process attachments - convert file paths to base64 for PDF embedding
      const processedInvoice = await this.processInvoiceAttachments(invoice);
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? this.getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'invoice' as const,
        data: {
          invoice: processedInvoice,
          customer,
          settings,
          currentDate: new Date().toLocaleDateString('de-DE'),
          logo: logoData // Logo-Daten für Template-Einbettung
        },
        // Theme data at the top level for template access
        theme: pdfTheme ? {
          themeId: pdfTheme.themeId,
          theme: pdfTheme.theme,
          primary: pdfTheme.theme.primary,
          secondary: pdfTheme.theme.secondary,
          accent: pdfTheme.theme.accent
        } : null,
        options: {
          filename: `Rechnung_${invoice.invoiceNumber}_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          previewOnly: isPreview,
          enablePDFA: false,
          validateCompliance: false
        }
      };

      console.log('🔄 Calling PDF generation via IPC...', templateData);
      const result = await window.electronAPI?.pdf?.generate(templateData);
      console.log('📋 PDF generation result:', result);
      
      if (result?.success) {
        console.log('✅ PDF generation successful:', result.filePath);
        
        if (isPreview && result.previewUrl) {
          console.log('🔍 Opening PDF preview...');
        }

        return result;
      } else {
        console.error('❌ PDF generation failed:', result?.error);
        return result || {
          success: false,
          error: 'PDF generation failed - no result'
        };
      }
    } catch (error) {
      console.error('PDF Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF generation error'
      };
    }
  }

  /**
   * Export timesheet to PDF with save dialog or preview
   */
  static async exportTimesheetToPDF(
    timesheet: any,
    customer: Customer,
    settings: any,
    isPreview: boolean = false,
    currentTheme?: any,
    customColors?: any,
    logoData?: string | null // Base64-encoded Logo-Daten für PDF
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting timesheet ${timesheet.timesheetNumber} to PDF (preview: ${isPreview})`);
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? this.getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'timesheet' as const,
        data: {
          timesheet,
          customer,
          settings,
          currentDate: new Date().toLocaleDateString('de-DE'),
          logo: logoData // Logo-Daten für Template-Einbettung
        },
        // Theme data at the top level for template access
        theme: pdfTheme ? {
          themeId: pdfTheme.themeId,
          theme: pdfTheme.theme,
          primary: pdfTheme.theme.primary,
          secondary: pdfTheme.theme.secondary,
          accent: pdfTheme.theme.accent
        } : null,
        options: {
          filename: `Leistungsnachweis_${timesheet.timesheetNumber}_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          previewOnly: isPreview,
          enablePDFA: false,
          validateCompliance: false
        }
      };

      console.log('🔄 Calling PDF generation via IPC...', templateData);
      const result = await window.electronAPI?.pdf?.generate(templateData);
      console.log('📋 PDF generation result:', result);
      
      if (result?.success) {
        console.log('✅ PDF generation successful:', result.filePath);
        
        if (isPreview && result.previewUrl) {
          console.log('🔍 Opening PDF preview...');
        }

        return result;
      } else {
        console.error('❌ PDF generation failed:', result?.error);
        return result || {
          success: false,
          error: 'PDF generation failed - no result'
        };
      }
    } catch (error) {
      console.error('PDF Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF generation error'
      };
    }
  }

  /**
   * Check PDF system status
   */
  static async getSystemStatus(): Promise<{
    electronAvailable: boolean;
    ghostscriptAvailable: boolean;
    veraPDFAvailable: boolean;
    pdfa2bSupported: boolean;
  }> {
    try {
      const status = await window.electronAPI?.pdf?.getStatus();
      return status || {
        electronAvailable: false,
        ghostscriptAvailable: false,
        veraPDFAvailable: false,
        pdfa2bSupported: false
      };
    } catch (error) {
      console.error('PDF Status Check Error:', error);
      return {
        electronAvailable: false,
        ghostscriptAvailable: false,
        veraPDFAvailable: false,
        pdfa2bSupported: false
      };
    }
  }

  /**
   * Process offer attachments for PDF embedding
   * Since we use database-only storage, attachments already have base64Data
   */
  private static async processOfferAttachments(offer: Offer): Promise<Offer> {
    if (!offer.lineItems) {
      console.log('📷 [PDF] No line items found in offer');
      return offer;
    }

    console.log('📷 [PDF] Processing attachments for', offer.lineItems.length, 'line items');

    // With database-only storage, attachments already have base64Data
    // Just log what we have for debugging
    offer.lineItems.forEach((lineItem) => {
      if (lineItem.attachments && lineItem.attachments.length > 0) {
        console.log(`📷 [PDF] Line item ${lineItem.id} has ${lineItem.attachments.length} attachments:`);
        lineItem.attachments.forEach((attachment) => {
          console.log(`📷 [PDF] - ${attachment.originalFilename} (${attachment.fileType}) - has base64: ${!!attachment.base64Data}`);
          if (attachment.base64Data) {
            console.log(`📷 [PDF] - Base64 data length: ${attachment.base64Data.length} chars`);
          }
        });
      } else {
        console.log(`📷 [PDF] Line item ${lineItem.id} has no attachments`);
      }
    });

    return offer; // Return as-is since base64Data is already available
  }

  /**
   * Process invoice attachments for PDF embedding
   * Since we use database-only storage, attachments already have base64Data
   */
  private static async processInvoiceAttachments(invoice: Invoice): Promise<Invoice> {
    if (!invoice.lineItems) {
      console.log('📷 [PDF] No line items found in invoice');
      return invoice;
    }

    console.log('📷 [PDF] Processing invoice attachments for', invoice.lineItems.length, 'line items');

    // With database-only storage, attachments already have base64Data
    // Just log what we have for debugging
    invoice.lineItems.forEach((lineItem) => {
      if (lineItem.attachments && lineItem.attachments.length > 0) {
        console.log(`📷 [PDF] Invoice line item ${lineItem.id} has ${lineItem.attachments.length} attachments:`);
        lineItem.attachments.forEach((attachment) => {
          console.log(`📷 [PDF] - ${attachment.originalFilename} (${attachment.fileType}) - has base64: ${!!attachment.base64Data}`);
          if (attachment.base64Data) {
            console.log(`📷 [PDF] - Base64 data length: ${attachment.base64Data.length} chars`);
          }
        });
      } else {
        console.log(`📷 [PDF] Invoice line item ${lineItem.id} has no attachments`);
      }
    });

    return invoice; // Return as-is since base64Data is already available
  }

  /**
   * Helper method for PDF theme integration with v1.5.2 pastel themes
   * 
   * CRITICAL FIX: Handles both string theme names and complex theme objects
   * Fallback to 'sage' (salbeigruen) if theme is null/undefined
   */
  private static getCurrentPDFTheme(currentTheme: any, customColors: any): any {
    console.log('🎨 [PDF-DEBUG] Building PDF theme from current theme:', currentTheme);
    console.log('🎨 [PDF-DEBUG] Type of currentTheme:', typeof currentTheme);
    console.log('🎨 [PDF-DEBUG] Custom colors:', customColors);
    
    // CRITICAL: Handle null/undefined/empty currentTheme with graceful fallback
    // currentTheme can be: string ('sage', 'default'), object with legacyId, or null
    let currentThemeName = 'sage'; // Default fallback is sage (salbeigruen)
    
    if (currentTheme) {
      if (typeof currentTheme === 'string') {
        // Direct string theme name (e.g., 'sage', 'peach')
        currentThemeName = currentTheme;
      } else if (typeof currentTheme === 'object') {
        // Complex theme object - extract theme key
        currentThemeName = currentTheme.themeKey || currentTheme.legacyId || currentTheme.id || 'sage';
      }
    } else {
      console.warn('⚠️ [PDF-WARNING] currentTheme is null/undefined - using fallback to sage (salbeigruen)');
    }
    
    console.log('📋 [PDF-DEBUG] Current theme name resolved to:', currentThemeName);
    
    // v1.5.2 Pastel theme color mappings - Updated with CORRECT Migration 027 theme colors
    const pastelThemes = {
      default: {
        primary: '#1e3a2e',      // Standard Tannengrün (Migration 027)
        secondary: '#2a4a35',    
        accent: '#8b9dc3',       // FIX: Updated from Migration 027
        background: '#f1f5f9',   
        text: '#1e293b'          // FIX: Updated from Migration 027
      },
      sage: {
        primary: '#7d9b7d',      // FIX: Updated from '#7ba87b' to Migration 027 value
        secondary: '#5a735a',    
        accent: '#d2ddcf',       // FIX: Updated from '#6b976b' to Migration 027 value
        background: '#fbfcfb',   // FIX: Updated from '#f7f9f7' to Migration 027 value
        text: '#1e293b'          // FIX: Updated from Migration 027
      },
      salbeigruen: {  // Legacy fallback
        primary: '#7d9b7d',      // FIX: Updated to match sage
        secondary: '#5a735a',    
        accent: '#d2ddcf',       // FIX: Updated to match sage
        background: '#fbfcfb',   // FIX: Updated to match sage
        text: '#1e293b'          // FIX: Updated to match sage
      },
      sky: {
        primary: '#8bacc8',      // FIX: Updated from '#7ba2b8' to Migration 027 value
        secondary: '#5a6573',    
        accent: '#a2d1ec',       // FIX: Updated from '#6b8ea7' to Migration 027 value
        background: '#fbfcfd',   // FIX: Updated from '#f7f9fb' to Migration 027 value
        text: '#1e293b'          // FIX: Updated from Migration 027
      },
      himmelblau: {  // Legacy fallback
        primary: '#8bacc8',      // FIX: Updated to match sky
        secondary: '#5a6573',    
        accent: '#a2d1ec',       // FIX: Updated to match sky
        background: '#fbfcfd',   // FIX: Updated to match sky
        text: '#1e293b'          // FIX: Updated to match sky
      },
      lavender: {
        primary: '#a89dc8',      // FIX: Updated from '#b87ba8' to Migration 027 value
        secondary: '#735a73',    
        accent: '#cf9ad6',       // FIX: Updated from '#a76b97' to Migration 027 value
        background: '#fcfbfd',   // FIX: Updated from '#f9f7fb' to Migration 027 value
        text: '#1e293b'          // FIX: Updated from Migration 027
      },
      lavendel: {  // Legacy fallback
        primary: '#a89dc8',      // FIX: Updated to match lavender
        secondary: '#735a73',    
        accent: '#cf9ad6',       // FIX: Updated to match lavender
        background: '#fcfbfd',   // FIX: Updated to match lavender
        text: '#1e293b'          // FIX: Updated to match lavender
      },
      peach: {
        primary: '#c8a89d',      // FIX: Updated from '#b8a27b' to Migration 027 value
        secondary: '#73655a',    
        accent: '#feecd4',       // FIX: Updated from '#a7916b' to Migration 027 value
        background: '#fdfcfb',   // FIX: Updated from '#fbf9f7' to Migration 027 value
        text: '#1e293b'          // FIX: Updated from Migration 027
      },
      pfirsich: {  // Legacy fallback
        primary: '#c8a89d',      // FIX: Updated to match peach
        secondary: '#73655a',    
        accent: '#feecd4',       // FIX: Updated to match peach
        background: '#fdfcfb',   // FIX: Updated to match peach
        text: '#1e293b'          // FIX: Updated to match peach
      },
      rose: {
        primary: '#c89da8',      // FIX: Updated from '#b87ba2' to Migration 027 value
        secondary: '#735a65',    
        accent: '#feb2a8',       // FIX: Updated from '#a76b91' to Migration 027 value
        background: '#fdfbfc',   // FIX: Updated from '#fbf7f9' to Migration 027 value
        text: '#1e293b'          // FIX: Updated from Migration 027
      }
    };
    
    // Get the current theme colors or fall back to sage (salbeigruen)
    const themeColors = pastelThemes[currentThemeName as keyof typeof pastelThemes] || pastelThemes.sage;
    
    console.log('🎨 [PDF-DEBUG] PDF theme colors selected:', themeColors);
    console.log('🎨 [PDF-DEBUG] Available pastel themes:', Object.keys(pastelThemes));
    
    // ⚠️ CRITICAL FIX-007: Return structure expected by pdf-templates.ts
    // Template expects: options.theme?.theme?.primary OR options.theme?.primary
    // So we return: { theme: { primary, secondary, accent, background, text } }
    const result = {
      theme: {
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        accent: themeColors.accent,
        background: themeColors.background,
        text: themeColors.text
      }
    };
    
    console.log('🎨 [PDF-DEBUG] Final PDF theme result (FIX-007 compatible):', result);
    return result;
  }
}

// Legacy function for backward compatibility (if needed)
export async function generatePDF(template: string, data: any, kleinunternehmer: boolean): Promise<Buffer> {
  throw new Error("Legacy generatePDF function deprecated - use PDFService class methods instead");
}