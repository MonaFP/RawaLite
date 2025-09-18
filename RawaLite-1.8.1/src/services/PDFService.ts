/**
 * 🎯 PDFService - Simplified Professional PDF Generation
 * 
 * Features:
 * - Native Electron PDF generation with dialog support
 * - PDF preview functionality
 * - User-selectable save locations
 * - Theme-aware PDF styling
 * - Logo embedding with Base64 support
 * - Error handling and validation
 */

import type { Customer, Offer, Invoice } from '../persistence/adapter';
import type { Settings } from '../lib/settings';
import type { ThemeColor, CustomColorSettings } from '../lib/themes';
import { getCurrentPDFTheme } from '../lib/pdfThemes';

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
    settings: Settings,
    isPreview: boolean = false,
    currentTheme?: ThemeColor,
    customColors?: CustomColorSettings,
    logoData?: string | null // Base64-encoded Logo-Daten für PDF
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting offer ${offer.offerNumber} to PDF (preview: ${isPreview})`);
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'offer',
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
    settings: Settings,
    isPreview: boolean = false,
    currentTheme?: ThemeColor,
    customColors?: CustomColorSettings,
    logoData?: string | null // Base64-encoded Logo-Daten für PDF
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting invoice ${invoice.invoiceNumber} to PDF (preview: ${isPreview})`);
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'invoice',
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
    settings: Settings,
    isPreview: boolean = false,
    currentTheme?: ThemeColor,
    customColors?: CustomColorSettings
  ): Promise<PDFResult> {
    try {
      console.log(`📄 Exporting timesheet ${timesheet.timesheetNumber} to PDF (preview: ${isPreview})`);
      
      // Generate theme data for PDF styling
      const pdfTheme = currentTheme ? getCurrentPDFTheme(currentTheme, customColors) : null;
      console.log('🎨 Generated PDF theme data:', pdfTheme);
      
      // Prepare data for template rendering
      const templateData = {
        templateType: 'timesheet',
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
}