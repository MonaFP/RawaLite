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
        total: offer.total
      });
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? this.getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'offer' as const,
        data: {
          offer,
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
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? this.getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'invoice' as const,
        data: {
          invoice,
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
    customColors?: any
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
          currentDate: new Date().toLocaleDateString('de-DE')
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
   * Helper method for PDF theme integration with v1.5.2 pastel themes
   */
  private static getCurrentPDFTheme(currentTheme: any, customColors: any): any {
    console.log('🎨 Building PDF theme from current theme:', currentTheme);
    
    // Use the passed currentTheme directly instead of reading from DOM
    // currentTheme should be the theme key like 'lavendel', 'himmelblau', etc.
    const currentThemeName = currentTheme || 'salbeigruen';
    console.log('📋 Current theme name:', currentThemeName);
    
    // v1.5.2 Pastel theme color mappings - Updated with correct theme names
    const pastelThemes = {
      default: {
        primary: '#1e3a2e',      // Standard Tannengrün
        secondary: '#2a4a35',    
        accent: '#f472b6',       
        background: '#f1f5f9',   
        text: '#1f2937'          
      },
      sage: {
        primary: '#7ba87b',      // Salbeigrün
        secondary: '#5a735a',    
        accent: '#6b976b',       
        background: '#f7f9f7',   
        text: '#2d4a2d'          
      },
      salbeigruen: {  // Legacy fallback
        primary: '#7ba87b',      
        secondary: '#5a735a',    
        accent: '#6b976b',       
        background: '#f7f9f7',   
        text: '#2d4a2d'          
      },
      sky: {
        primary: '#7ba2b8',      // Himmelblau
        secondary: '#5a6573',    
        accent: '#6b8ea7',       
        background: '#f7f9fb',   
        text: '#2d3a4a'          
      },
      himmelblau: {  // Legacy fallback
        primary: '#7ba2b8',      
        secondary: '#5a6573',    
        accent: '#6b8ea7',       
        background: '#f7f9fb',   
        text: '#2d3a4a'          
      },
      lavender: {
        primary: '#b87ba8',      // Lavendel
        secondary: '#735a73',    
        accent: '#a76b97',       
        background: '#f9f7fb',   
        text: '#4a2d4a'          
      },
      lavendel: {  // Legacy fallback
        primary: '#b87ba8',      
        secondary: '#735a73',    
        accent: '#a76b97',       
        background: '#f9f7fb',   
        text: '#4a2d4a'          
      },
      peach: {
        primary: '#b8a27b',      // Pfirsich
        secondary: '#73655a',    
        accent: '#a7916b',       
        background: '#fbf9f7',   
        text: '#4a3a2d'          
      },
      pfirsich: {  // Legacy fallback
        primary: '#b8a27b',      
        secondary: '#73655a',    
        accent: '#a7916b',       
        background: '#fbf9f7',   
        text: '#4a3a2d'          
      },
      rose: {
        primary: '#b87ba2',      // Rosé
        secondary: '#735a65',    
        accent: '#a76b91',       
        background: '#fbf7f9',   
        text: '#4a2d3a'          
      }
    };
    
    // Get the current theme colors or fall back to sage (salbeigruen)
    const themeColors = pastelThemes[currentThemeName as keyof typeof pastelThemes] || pastelThemes.sage;
    
    console.log('🎨 PDF theme colors selected:', themeColors);
    
    return {
      themeId: currentThemeName,
      theme: {
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        accent: themeColors.accent,
        background: themeColors.background,
        text: themeColors.text
      }
    };
  }
}

// Legacy function for backward compatibility (if needed)
export async function generatePDF(template: string, data: any, kleinunternehmer: boolean): Promise<Buffer> {
  throw new Error("Legacy generatePDF function deprecated - use PDFService class methods instead");
}