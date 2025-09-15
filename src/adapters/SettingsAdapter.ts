import { getDB, all, run, withTx } from '../persistence/sqlite/db';
import type { Settings, CompanyData, NumberingCircle, DesignSettings } from '../lib/settings';
import { defaultSettings } from '../lib/settings';

export class SettingsAdapter {
  // Convert SQLite row to CompanyData format
  private mapSQLiteToCompanyData(row: any): CompanyData {
    return {
      name: row.companyName || '',
      street: row.street || '',
      postalCode: row.zip || '', // zip -> postalCode mapping
      city: row.city || '',
      phone: row.phone || '',
      email: row.email || '',
      website: row.website || '',
      taxNumber: row.taxId || '', // taxId -> taxNumber mapping
      vatId: row.vatId || '',
      kleinunternehmer: Boolean(row.kleinunternehmer), // INTEGER -> boolean
      bankName: row.bankName || '',
      bankAccount: row.bankAccount || '',
      bankBic: row.bankBic || '',
      logo: row.logo || ''
    };
  }

  // Extract design settings from company data
  private extractDesignSettings(row: any): DesignSettings {
    try {
      // Check if design settings are stored in a custom field
      if (row.designSettings && typeof row.designSettings === 'string') {
        return JSON.parse(row.designSettings);
      }
    } catch (error) {
      console.warn('Error parsing design settings from database:', error);
    }
    
    // Fallback to defaults
    return defaultSettings.designSettings;
  }

  // Convert CompanyData to SQLite format
  private mapCompanyDataToSQLite(data: CompanyData & { designSettings?: string }) {
    return {
      companyName: data.name,
      street: data.street,
      zip: data.postalCode, // postalCode -> zip mapping
      city: data.city,
      phone: data.phone,
      email: data.email,
      website: data.website,
      taxId: data.taxNumber, // taxNumber -> taxId mapping
      vatId: data.vatId,
      kleinunternehmer: data.kleinunternehmer ? 1 : 0, // boolean -> INTEGER
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      bankBic: data.bankBic,
      logo: data.logo,
      designSettings: data.designSettings // Store design settings as JSON string
    };
  }

  async getSettings(): Promise<Settings> {
    await getDB();
    
    // Get company data from SQLite
    const settingsRows = all<any>("SELECT * FROM settings WHERE id = 1");
    const settingsRow = settingsRows[0];
    
    let companyData: CompanyData;
    let designSettings: DesignSettings;
    let needsInitialSave = false;
    
    if (settingsRow) {
      companyData = this.mapSQLiteToCompanyData(settingsRow);
      designSettings = this.extractDesignSettings(settingsRow);
      
      // ✨ KRITISCH: Prüfen ob designSettings existieren, sonst Default-Werte speichern
      if (!settingsRow.designSettings) {
        console.log('🔧 No design settings found in database - initializing defaults');
        designSettings = defaultSettings.designSettings;
        needsInitialSave = true;
      }
    } else {
      // ✨ Beim ersten Start: Defaults verwenden und sofort speichern
      console.log('🔧 No settings record found - creating initial settings');
      companyData = defaultSettings.companyData;
      designSettings = defaultSettings.designSettings;
      needsInitialSave = true;
    }

    // Get numbering circles from localStorage (for now, until we migrate to SQLite)
    let numberingCircles: NumberingCircle[];
    try {
      const stored = localStorage.getItem('rawalite-numbering');
      if (stored) {
        numberingCircles = JSON.parse(stored);
      } else {
        // Use defaults and save them immediately for persistence
        numberingCircles = defaultSettings.numberingCircles;
        localStorage.setItem('rawalite-numbering', JSON.stringify(numberingCircles));
        console.log('Initialized default numbering circles in localStorage');
      }
    } catch (error) {
      console.warn('Error loading numbering circles from localStorage:', error);
      numberingCircles = defaultSettings.numberingCircles;
      // Try to save defaults even after error
      try {
        localStorage.setItem('rawalite-numbering', JSON.stringify(numberingCircles));
      } catch (saveError) {
        console.error('Could not save default numbering circles:', saveError);
      }
    }

    const settings: Settings = {
      companyData,
      numberingCircles,
      designSettings
    };

    // ✨ KRITISCH: Beim ersten Start ODER fehlenden Design-Settings sofort in SQLite speichern
    if (needsInitialSave) {
      try {
        console.log('💾 Saving initial design settings to SQLite:', designSettings);
        const companyDataWithDesign = {
          ...companyData,
          designSettings: JSON.stringify(designSettings)
        };
        await this.updateCompanyData(companyDataWithDesign);
        console.log('✅ Successfully initialized design settings in SQLite');
      } catch (error) {
        console.error('❌ Could not save initial design settings:', error);
      }
    }

    return settings;
  }

  async updateCompanyData(companyData: CompanyData & { designSettings?: string }): Promise<void> {
    await withTx(async () => {
      const sqliteData = this.mapCompanyDataToSQLite(companyData);
      const timestamp = new Date().toISOString();

      // Update or insert company data (including design settings)
      run(`
        INSERT OR REPLACE INTO settings (
          id, companyName, street, zip, city, phone, email, website, 
          taxId, vatId, kleinunternehmer, bankName, bankAccount, bankBic, 
          logo, designSettings, updatedAt
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        sqliteData.companyName,
        sqliteData.street,
        sqliteData.zip,
        sqliteData.city,
        sqliteData.phone,
        sqliteData.email,
        sqliteData.website,
        sqliteData.taxId,
        sqliteData.vatId,
        sqliteData.kleinunternehmer,
        sqliteData.bankName,
        sqliteData.bankAccount,
        sqliteData.bankBic,
        sqliteData.logo,
        sqliteData.designSettings,
        timestamp
      ]);
    });
  }

  async updateNumberingCircles(numberingCircles: NumberingCircle[]): Promise<void> {
    // Store in localStorage for now (we'll migrate to SQLite later)
    try {
      localStorage.setItem('rawalite-numbering', JSON.stringify(numberingCircles));
    } catch (error) {
      console.error('Error saving numbering circles:', error);
      throw error;
    }
  }

  async getNextNumber(circleId: string): Promise<string> {
    const settings = await this.getSettings();
    const circle = settings.numberingCircles.find(c => c.id === circleId);
    
    if (!circle) {
      throw new Error(`Nummernkreis '${circleId}' nicht gefunden`);
    }

    const currentYear = new Date().getFullYear();
    let newCurrent = circle.current + 1;

    // Check if we need to reset for yearly numbering
    if (circle.resetMode === 'yearly' && circle.lastResetYear !== currentYear) {
      newCurrent = 1;
    }

    // Update the circle
    const updatedCircles = settings.numberingCircles.map(c => 
      c.id === circleId 
        ? { ...c, current: newCurrent, lastResetYear: currentYear }
        : c
    );

    // Save immediately
    await this.updateNumberingCircles(updatedCircles);

    return `${circle.prefix}${newCurrent.toString().padStart(circle.digits, '0')}`;
  }
}
