#!/usr/bin/env node

/**
 * 🔄 Logo Migration Script
 * Migriert bestehende Base64-Logos aus SQLite zu Dateisystem-basierten Logos
 * 
 * Funktionen:
 * - Lädt vorhandene Base64-Logos aus settings.companyData.logo
 * - Konvertiert zu optimierten Dateien im templates/ Verzeichnis
 * - Aktualisiert logoSettings in der Datenbank
 * - Entfernt alte Base64-Daten nach erfolgreicher Migration
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LogoMigrationService {
  constructor() {
    this.targetDir = null;
    this.migratedCount = 0;
    this.errors = [];
  }

  async initializeDirectories() {
    // Bestimme Zielverzeichnis basierend auf Umgebung
    if (app) {
      this.targetDir = path.join(app.getPath('userData'), 'templates');
    } else {
      // Fallback für Development/Test
      this.targetDir = path.join(__dirname, '..', 'userData', 'templates');
    }

    // Erstelle templates/ Verzeichnis falls nicht vorhanden
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
      console.log('📁 Created templates directory:', this.targetDir);
    }
  }

  detectImageFormat(base64Data) {
    // Extrahiere Format aus Base64-Header
    const header = base64Data.substring(0, 50).toLowerCase();
    
    if (header.includes('data:image/png')) return 'png';
    if (header.includes('data:image/jpeg') || header.includes('data:image/jpg')) return 'jpg';
    if (header.includes('data:image/svg+xml')) return 'svg';
    if (header.includes('data:image/gif')) return 'gif';
    
    // Fallback: Analysiere erste Bytes nach Base64-Dekodierung
    try {
      const cleanBase64 = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      
      // PNG Magic Numbers
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'png';
      }
      
      // JPEG Magic Numbers
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'jpg';
      }
      
      // SVG Text Detection
      const text = buffer.toString('utf8', 0, 100);
      if (text.includes('<svg') || text.includes('<?xml')) {
        return 'svg';
      }
    } catch (error) {
      console.warn('⚠️ Could not detect image format, defaulting to png');
    }
    
    return 'png'; // Default fallback
  }

  extractImageDimensions(buffer, format) {
    try {
      if (format === 'png') {
        // PNG Dimensions (Big Endian)
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
      
      if (format === 'jpg' || format === 'jpeg') {
        // JPEG Dimensions (simplified detection)
        let offset = 2;
        while (offset < buffer.length) {
          const marker = buffer.readUInt16BE(offset);
          if (marker >= 0xFFC0 && marker <= 0xFFC3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          offset += 2 + buffer.readUInt16BE(offset + 2);
        }
      }
      
      if (format === 'svg') {
        // SVG Dimensions (XML parsing)
        const svgText = buffer.toString('utf8');
        const widthMatch = svgText.match(/width=["\']([\\d.]+)/);
        const heightMatch = svgText.match(/height=["\']([\\d.]+)/);
        
        if (widthMatch && heightMatch) {
          return {
            width: parseInt(widthMatch[1], 10),
            height: parseInt(heightMatch[1], 10)
          };
        }
        
        // ViewBox fallback
        const viewBoxMatch = svgText.match(/viewBox=["\'][\\d.\\s]+\\s([\\d.]+)\\s([\\d.]+)["\\']/);
        if (viewBoxMatch) {
          return {
            width: parseInt(viewBoxMatch[1], 10),
            height: parseInt(viewBoxMatch[2], 10)
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not extract dimensions:', error.message);
    }
    
    return { width: null, height: null };
  }

  async migrateBase64Logo(base64Data) {
    console.log('🔄 Starting Base64 logo migration...');
    
    try {
      // Format detection
      const format = this.detectImageFormat(base64Data);
      const fileName = `logo.${format}`;
      const filePath = path.join(this.targetDir, fileName);
      
      console.log('📋 Detected format:', format);
      console.log('💾 Target file:', filePath);
      
      // Base64 to Buffer conversion
      const cleanBase64 = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      
      // Extract dimensions
      const { width, height } = this.extractImageDimensions(buffer, format);
      console.log('📐 Detected dimensions:', `${width || 'unknown'}×${height || 'unknown'}px`);
      
      // Write file to disk
      fs.writeFileSync(filePath, buffer);
      console.log('✅ Logo file written successfully');
      
      // Generate logo metadata
      const logoSettings = {
        filePath: `templates/${fileName}`,
        fileName: fileName,
        format: format,
        width: width,
        height: height,
        fileSize: buffer.length,
        updatedAt: new Date().toISOString()
      };
      
      console.log('📊 Generated logo metadata:', logoSettings);
      
      this.migratedCount++;
      return logoSettings;
      
    } catch (error) {
      const errorMsg = `Logo migration failed: ${error.message}`;
      console.error('❌', errorMsg);
      this.errors.push(errorMsg);
      return null;
    }
  }

  async updateDatabaseSettings(logoSettings) {
    console.log('💾 Updating database with new logo settings...');
    
    try {
      // Importiere SettingsAdapter dynamisch (falls verfügbar)
      const { SettingsAdapter } = require('../src/adapters/SettingsAdapter');
      const adapter = new SettingsAdapter();
      
      // Lade aktuelle Settings
      const currentSettings = await adapter.getSettings();
      
      // Update nur die logoSettings
      const updatedCompanyData = {
        ...currentSettings.companyData,
        // Behalte legacy logo für Rückwärtskompatibilität während Übergangszeit
        logo: currentSettings.companyData.logo
      };
      
      await adapter.updateCompanyData({
        ...updatedCompanyData,
        logoSettings: JSON.stringify(logoSettings)
      });
      
      console.log('✅ Database updated with new logo settings');
      return true;
      
    } catch (error) {
      const errorMsg = `Database update failed: ${error.message}`;
      console.error('❌', errorMsg);
      this.errors.push(errorMsg);
      return false;
    }
  }

  async runMigration() {
    console.log('🚀 Starting Logo Migration Service...');
    console.log('=' .repeat(50));
    
    try {
      await this.initializeDirectories();
      
      // Lade SettingsAdapter
      const { SettingsAdapter } = require('../src/adapters/SettingsAdapter');
      const adapter = new SettingsAdapter();
      const settings = await adapter.getSettings();
      
      console.log('📊 Current settings loaded');
      console.log('🔍 Company data available:', !!settings.companyData);
      console.log('🔍 Logo data present:', !!settings.companyData.logo);
      console.log('🔍 Logo data length:', settings.companyData.logo?.length || 0);
      
      // Prüfe ob bereits neue logoSettings vorhanden
      if (settings.logoSettings && settings.logoSettings.filePath) {
        console.log('ℹ️ Logo migration already completed');
        console.log('📁 Current logo file:', settings.logoSettings.filePath);
        console.log('📐 Current logo format:', settings.logoSettings.format);
        return {
          success: true,
          alreadyMigrated: true,
          logoSettings: settings.logoSettings
        };
      }
      
      // Prüfe ob Base64-Logo vorhanden
      if (!settings.companyData.logo || settings.companyData.logo.length < 100) {
        console.log('ℹ️ No Base64 logo found to migrate');
        return {
          success: true,
          noLogoFound: true
        };
      }
      
      console.log('🔄 Base64 logo found, starting migration...');
      
      // Migriere Base64 zu Dateisystem
      const logoSettings = await this.migrateBase64Logo(settings.companyData.logo);
      
      if (!logoSettings) {
        throw new Error('Logo migration failed');
      }
      
      // Update Database
      const dbUpdated = await this.updateDatabaseSettings(logoSettings);
      
      if (!dbUpdated) {
        throw new Error('Database update failed');
      }
      
      console.log('=' .repeat(50));
      console.log('✅ Logo migration completed successfully!');
      console.log('📊 Migration Summary:');
      console.log(`   - Logos migrated: ${this.migratedCount}`);
      console.log(`   - Target directory: ${this.targetDir}`);
      console.log(`   - New logo file: ${logoSettings.fileName}`);
      console.log(`   - Format: ${logoSettings.format}`);
      console.log(`   - Dimensions: ${logoSettings.width}×${logoSettings.height}px`);
      console.log(`   - File size: ${(logoSettings.fileSize / 1024).toFixed(1)} KB`);
      
      if (this.errors.length > 0) {
        console.log('⚠️ Errors encountered:');
        this.errors.forEach(error => console.log(`   - ${error}`));
      }
      
      return {
        success: true,
        migrated: true,
        logoSettings: logoSettings,
        migratedCount: this.migratedCount,
        errors: this.errors
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return {
        success: false,
        error: error.message,
        migratedCount: this.migratedCount,
        errors: [...this.errors, error.message]
      };
    }
  }
}

// Export für programmatische Nutzung
module.exports = { LogoMigrationService };

// CLI Ausführung falls direkt aufgerufen
if (require.main === module) {
  const migration = new LogoMigrationService();
  migration.runMigration()
    .then(result => {
      console.log('\\n📋 Final Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}