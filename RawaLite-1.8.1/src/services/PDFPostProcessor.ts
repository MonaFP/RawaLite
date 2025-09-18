/**
 * 🏭 PDFPostProcessor - PDF/A-2b Conversion & Validation Service
 * 
 * Features:
 * - Ghostscript PDF/A-2b conversion
 * - veraPDF compliance validation
 * - Metadata embedding for archival quality
 * - Professional document standards compliance
 * 
 * Architecture:
 * 1. Input: Standard PDF from Electron webContents.printToPDF
 * 2. Process: Ghostscript conversion to PDF/A-2b standard
 * 3. Validate: veraPDF compliance verification
 * 4. Output: Professional-grade PDF/A-2b document
 */

import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

export interface PDFAConversionOptions {
  inputPath: string;
  outputPath: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  colorProfile?: 'sRGB' | 'CMYK';
  compressionLevel?: 1 | 2 | 3; // 1=high quality, 3=high compression
}

export interface PDFAValidationResult {
  isCompliant: boolean;
  standard: string; // e.g., "PDF/A-2b"
  errors: string[];
  warnings: string[];
  summary: string;
  validationTime: number;
}

export interface PDFAConversionResult {
  success: boolean;
  outputPath?: string;
  inputSize: number;
  outputSize?: number;
  compressionRatio?: number;
  validationResult?: PDFAValidationResult;
  error?: string;
  processingTime: number;
}

/**
 * 🔧 PDF Post-Processor for professional document conversion
 */
export class PDFPostProcessor {
  
  private static readonly GHOSTSCRIPT_EXECUTABLE = process.platform === 'win32' ? 'gswin64c.exe' : 'gs';
  private static readonly VERAPDF_EXECUTABLE = process.platform === 'win32' ? 'verapdf.bat' : 'verapdf';
  
  /**
   * 🎯 Convert standard PDF to PDF/A-2b format
   */
  static async convertToPDFA(options: PDFAConversionOptions): Promise<PDFAConversionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate input file
      if (!fs.existsSync(options.inputPath)) {
        return {
          success: false,
          error: `Input file not found: ${options.inputPath}`,
          inputSize: 0,
          processingTime: Date.now() - startTime
        };
      }

      const inputSize = fs.statSync(options.inputPath).size;
      
      // 2. Check if Ghostscript is available
      const isGhostscriptAvailable = await this.checkGhostscriptAvailability();
      if (!isGhostscriptAvailable) {
        console.warn('⚠️ Ghostscript not available - PDF/A conversion skipped');
        return {
          success: false,
          error: 'Ghostscript not found. Please install Ghostscript for PDF/A-2b conversion.',
          inputSize,
          processingTime: Date.now() - startTime
        };
      }

      // 3. Perform PDF/A-2b conversion with Ghostscript
      const conversionSuccess = await this.runGhostscriptConversion(options);
      
      if (!conversionSuccess) {
        return {
          success: false,
          error: 'PDF/A-2b conversion failed during Ghostscript processing',
          inputSize,
          processingTime: Date.now() - startTime
        };
      }

      // 4. Get output file size
      const outputSize = fs.existsSync(options.outputPath) ? fs.statSync(options.outputPath).size : 0;
      const compressionRatio = inputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0;

      // 5. Validate PDF/A compliance (optional)
      let validationResult: PDFAValidationResult | undefined;
      const isVeraPDFAvailable = await this.checkVeraPDFAvailability();
      
      if (isVeraPDFAvailable) {
        validationResult = await this.validatePDFA(options.outputPath);
      } else {
        console.warn('⚠️ veraPDF not available - PDF/A validation skipped');
      }

      console.log(`✅ PDF/A-2b conversion completed: ${path.basename(options.outputPath)}`);
      console.log(`📊 Size: ${this.formatFileSize(inputSize)} → ${this.formatFileSize(outputSize)} (${compressionRatio >= 0 ? '-' : '+'}${Math.abs(compressionRatio)}%)`);

      return {
        success: true,
        outputPath: options.outputPath,
        inputSize,
        outputSize,
        compressionRatio,
        validationResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ PDF/A conversion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
        inputSize: fs.existsSync(options.inputPath) ? fs.statSync(options.inputPath).size : 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🔍 Validate PDF/A compliance using veraPDF
   */
  static async validatePDFA(filePath: string): Promise<PDFAValidationResult> {
    const startTime = Date.now();
    
    try {
      if (!fs.existsSync(filePath)) {
        return {
          isCompliant: false,
          standard: 'Unknown',
          errors: [`File not found: ${filePath}`],
          warnings: [],
          summary: 'Validation failed - file not found',
          validationTime: Date.now() - startTime
        };
      }

      const isVeraPDFAvailable = await this.checkVeraPDFAvailability();
      if (!isVeraPDFAvailable) {
        return {
          isCompliant: false,
          standard: 'Unknown',
          errors: ['veraPDF not available'],
          warnings: ['PDF/A validation skipped - veraPDF not installed'],
          summary: 'Validation skipped - veraPDF not found',
          validationTime: Date.now() - startTime
        };
      }

      // Run veraPDF validation
      const validationOutput = await this.runVeraPDFValidation(filePath);
      const parsedResult = this.parseVeraPDFOutput(validationOutput);
      
      const result: PDFAValidationResult = {
        ...parsedResult,
        validationTime: Date.now() - startTime
      };
      
      return result;

    } catch (error) {
      console.error('❌ PDF/A validation failed:', error);
      return {
        isCompliant: false,
        standard: 'Unknown',
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: [],
        summary: 'Validation failed due to error',
        validationTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🛠️ Check if Ghostscript is available on the system
   */
  private static async checkGhostscriptAvailability(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const gs = spawn(this.GHOSTSCRIPT_EXECUTABLE, ['--version'], { stdio: 'pipe' });
        
        gs.on('close', (code) => {
          resolve(code === 0);
        });
        
        gs.on('error', () => {
          resolve(false);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          gs.kill();
          resolve(false);
        }, 5000);
      });
    } catch {
      return false;
    }
  }

  /**
   * 🛠️ Check if veraPDF is available on the system
   */
  private static async checkVeraPDFAvailability(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const verapdf = spawn(this.VERAPDF_EXECUTABLE, ['--version'], { stdio: 'pipe' });
        
        verapdf.on('close', (code) => {
          resolve(code === 0);
        });
        
        verapdf.on('error', () => {
          resolve(false);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          verapdf.kill();
          resolve(false);
        }, 5000);
      });
    } catch {
      return false;
    }
  }

  /**
   * 🏭 Run Ghostscript PDF/A-2b conversion
   */
  private static async runGhostscriptConversion(options: PDFAConversionOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Ghostscript arguments for PDF/A-2b conversion
      const gsArgs = [
        '-dPDFA=2',
        '-dBATCH',
        '-dNOPAUSE',
        '-dUseCIEColor=true',
        '-dPDFACompatibilityPolicy=1',
        '-sDEVICE=pdfwrite',
        `-sOutputFile=${options.outputPath}`,
        '-dEmbedAllFonts=true',
        '-dSubsetFonts=true',
        '-dCompressFonts=true',
        `-dPDFSETTINGS=/${this.getGhostscriptQualitySetting(options.compressionLevel)}`,
        '-dColorImageResolution=300',
        '-dGrayImageResolution=300',
        '-dMonoImageResolution=1200',
        options.inputPath
      ];

      // Add ICC color profile for PDF/A compliance
      if (options.colorProfile === 'sRGB') {
        gsArgs.push('-sColorConversionStrategy=sRGB');
      }

      console.log(`🏭 Running Ghostscript PDF/A-2b conversion...`);
      console.log(`📁 Input: ${path.basename(options.inputPath)}`);
      console.log(`📁 Output: ${path.basename(options.outputPath)}`);
      
      const gs = spawn(this.GHOSTSCRIPT_EXECUTABLE, gsArgs, { 
        stdio: ['ignore', 'pipe', 'pipe'] 
      });

      let stdout = '';
      let stderr = '';

      gs.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      gs.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      gs.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Ghostscript conversion completed successfully');
          resolve(true);
        } else {
          console.error(`❌ Ghostscript failed with exit code ${code}`);
          console.error('STDERR:', stderr);
          reject(new Error(`Ghostscript conversion failed: ${stderr}`));
        }
      });

      gs.on('error', (error) => {
        console.error('❌ Ghostscript process error:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        gs.kill();
        reject(new Error('Ghostscript conversion timeout'));
      }, 30000);
    });
  }

  /**
   * 🔍 Run veraPDF validation
   */
  private static async runVeraPDFValidation(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const verapdfArgs = [
        '--format', 'text',
        '--flavour', '2b', // PDF/A-2b validation
        filePath
      ];

      console.log(`🔍 Running veraPDF validation: ${path.basename(filePath)}`);
      
      const verapdf = spawn(this.VERAPDF_EXECUTABLE, verapdfArgs, { 
        stdio: ['ignore', 'pipe', 'pipe'] 
      });

      let stdout = '';
      let stderr = '';

      verapdf.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      verapdf.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      verapdf.on('close', (code) => {
        if (code === 0 || code === 1) { // veraPDF returns 1 for non-compliant files, which is normal
          resolve(stdout);
        } else {
          console.error(`❌ veraPDF failed with exit code ${code}`);
          console.error('STDERR:', stderr);
          reject(new Error(`veraPDF validation failed: ${stderr}`));
        }
      });

      verapdf.on('error', (error) => {
        console.error('❌ veraPDF process error:', error);
        reject(error);
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        verapdf.kill();
        reject(new Error('veraPDF validation timeout'));
      }, 15000);
    });
  }

  /**
   * 📊 Parse veraPDF output into structured result
   */
  private static parseVeraPDFOutput(output: string): Omit<PDFAValidationResult, 'validationTime'> {
    const lines = output.split('\n');
    let isCompliant = false;
    let standard = 'PDF/A-2b';
    const errors: string[] = [];
    const warnings: string[] = [];
    let summary = 'Validation completed';

    // Parse veraPDF text output
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('PDF file is compliant')) {
        isCompliant = true;
        summary = 'PDF/A-2b compliant';
      } else if (trimmedLine.includes('PDF file is not compliant')) {
        isCompliant = false;
        summary = 'PDF/A-2b non-compliant';
      } else if (trimmedLine.startsWith('ERROR:')) {
        errors.push(trimmedLine.replace('ERROR:', '').trim());
      } else if (trimmedLine.startsWith('WARNING:')) {
        warnings.push(trimmedLine.replace('WARNING:', '').trim());
      } else if (trimmedLine.includes('flavour')) {
        // Extract detected PDF/A standard
        const match = trimmedLine.match(/flavour[:\s]+([^\s]+)/i);
        if (match) {
          standard = match[1];
        }
      }
    }

    return {
      isCompliant,
      standard,
      errors,
      warnings,
      summary
    };
  }

  /**
   * ⚙️ Get Ghostscript quality setting based on compression level
   */
  private static getGhostscriptQualitySetting(compressionLevel?: number): string {
    switch (compressionLevel) {
      case 1: return 'prepress'; // Highest quality, largest file
      case 2: return 'printer';  // Balanced quality and size
      case 3: return 'ebook';    // Smallest size, good quality
      default: return 'printer'; // Default balanced setting
    }
  }

  /**
   * 📏 Format file size for human-readable display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 🔧 Get system capabilities for PDF processing
   */
  static async getSystemCapabilities(): Promise<{
    ghostscriptAvailable: boolean;
    veraPDFAvailable: boolean;
    platform: string;
    pdfa2bSupported: boolean;
  }> {
    const [ghostscriptAvailable, veraPDFAvailable] = await Promise.all([
      this.checkGhostscriptAvailability(),
      this.checkVeraPDFAvailability()
    ]);

    return {
      ghostscriptAvailable,
      veraPDFAvailable,
      platform: process.platform,
      pdfa2bSupported: ghostscriptAvailable // PDF/A-2b requires Ghostscript
    };
  }

  /**
   * 📋 Generate PDF metadata for PDF/A compliance
   */
  static generatePDFAMetadata(options: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  }): string {
    const metadata = {
      Title: options.title || 'RawaLite Document',
      Author: options.author || 'RawaLite',
      Subject: options.subject || 'Business Document',
      Keywords: options.keywords?.join(', ') || 'PDF/A, Business, Invoice, Offer',
      Creator: options.creator || 'RawaLite PDF Service',
      Producer: options.producer || 'RawaLite v1.5.6 with Electron & Ghostscript',
      CreationDate: new Date().toISOString(),
      ModDate: new Date().toISOString()
    };

    return Object.entries(metadata)
      .map(([key, value]) => `/${key} (${value})`)
      .join('\n');
  }
}