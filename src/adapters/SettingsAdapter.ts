import { getDB, all, run, withTx } from '../persistence/sqlite/db';
import type { Settings, CompanyData, NumberingCircle, DesignSettings, LogoSettings } from '../lib/settings';
import { defaultSettings } from '../lib/settings';

export class SettingsAdapter {
  // Convert SQLite row to CompanyData format
  private mapSQLiteToCompanyData(row: any): CompanyData {
    return {
      name: row.companyName || '', // ✅ CRITICAL FIX: companyName -> name mapping
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
      // Design settings are ONLY stored in SQLite database
      if (row.designSettings && typeof row.designSettings === 'string') {
        return JSON.parse(row.designSettings);
      }
    } catch (error) {
      console.warn('Error parsing design settings from database:', error);
    }
    
    // Return defaults if parsing fails or no settings found
    return defaultSettings.designSettings;
  }

  // Extract logo settings from company data
  private extractLogoSettings(row: any): LogoSettings {
    try {
      if (row.logoSettings && typeof row.logoSettings === 'string') {
        return JSON.parse(row.logoSettings);
      }
    } catch (error) {
      console.warn('Error parsing logo settings from database:', error);
    }
    
    // Return empty defaults if parsing fails or no settings found
    return defaultSettings.logoSettings;
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
      console.log('🗄️ [DB] Loaded designSettings from SQLite:', settingsRow.designSettings);
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

    // Get numbering circles from SQLite (NO MORE localStorage!)
    const numberingCircles = all<NumberingCircle>(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY id
    `);

    const settings: Settings = {
      companyData,
      logoSettings: this.extractLogoSettings(settingsRow),
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

  async updateCompanyData(companyData: CompanyData & { designSettings?: string; logoSettings?: string }): Promise<void> {
    await withTx(async () => {
      const sqliteData = this.mapCompanyDataToSQLite(companyData);
      const timestamp = new Date().toISOString();

      // Update or insert company data (including design and logo settings)
      run(`
        INSERT OR REPLACE INTO settings (
          id, companyName, street, zip, city, phone, email, website, 
          taxId, vatId, kleinunternehmer, bankName, bankAccount, bankBic, 
          logo, designSettings, logoSettings, updatedAt
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        companyData.logoSettings || null,
        timestamp
      ]);
    });
  }

  async updateLogoSettings(logoSettings: LogoSettings): Promise<void> {
    await withTx(async () => {
      const timestamp = new Date().toISOString();
      const logoSettingsJSON = JSON.stringify(logoSettings);

      // Update nur die logoSettings Spalte
      run(`
        UPDATE settings 
        SET logoSettings = ?, updatedAt = ?
        WHERE id = 1
      `, [logoSettingsJSON, timestamp]);

      console.log('💾 Updated logoSettings in database:', logoSettingsJSON);
    });
  }

  async updateNumberingCircles(numberingCircles: NumberingCircle[]): Promise<void> {
    await withTx(async () => {
      const timestamp = new Date().toISOString();
      
      // Update all numbering circles in SQLite
      for (const circle of numberingCircles) {
        run(`
          INSERT OR REPLACE INTO numbering_circles 
          (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 
            COALESCE((SELECT createdAt FROM numbering_circles WHERE id = ?), ?), 
            ?)
        `, [
          circle.id,
          circle.name,
          circle.prefix,
          circle.digits,
          circle.current,
          circle.resetMode,
          circle.lastResetYear || null,
          circle.id, // for COALESCE lookup
          timestamp, // fallback createdAt for new records
          timestamp  // updatedAt
        ]);
      }
      
      console.log('✅ Updated numbering circles in SQLite:', numberingCircles.map(c => c.id));
    });
  }

  async getNextNumber(circleId: string): Promise<string> {
    return withTx(async () => {
      // Get current circle data from SQLite
      const circles = all<NumberingCircle>(`
        SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
        FROM numbering_circles 
        WHERE id = ?
      `, [circleId]);
      
      const circle = circles[0];
      if (!circle) {
        throw new Error(`Nummernkreis '${circleId}' nicht gefunden`);
      }

      const currentYear = new Date().getFullYear();
      let newCurrent = circle.current + 1;

      // Check if we need to reset for yearly numbering
      if (circle.resetMode === 'yearly' && circle.lastResetYear !== currentYear) {
        newCurrent = 1;
      }

      // Update the circle in SQLite
      const timestamp = new Date().toISOString();
      run(`
        UPDATE numbering_circles 
        SET current = ?, lastResetYear = ?, updatedAt = ?
        WHERE id = ?
      `, [newCurrent, currentYear, timestamp, circleId]);

      const formattedNumber = `${circle.prefix}${newCurrent.toString().padStart(circle.digits, '0')}`;
      console.log(`✅ Generated number for ${circleId}: ${formattedNumber}`);
      
      return formattedNumber;
    });
  }
}
