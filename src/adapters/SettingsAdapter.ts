import { getDB, all, run, withTx } from '../persistence/sqlite/db';
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { defaultSettings } from '../lib/settings';
import PATHS from '../lib/paths';

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

  // Convert CompanyData to SQLite format
  private mapCompanyDataToSQLite(data: CompanyData) {
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
      logo: data.logo
    };
  }

  async getSettings(): Promise<Settings> {
    await getDB();
    
    // Get company data from SQLite
    const settingsRows = all<any>("SELECT * FROM settings WHERE id = 1");
    const settingsRow = settingsRows[0];
    
    let companyData: CompanyData;
    if (settingsRow) {
      companyData = this.mapSQLiteToCompanyData(settingsRow);
    } else {
      companyData = defaultSettings.companyData;
    }

    // ✅ Get numbering circles from SQLite (Phase 2)
    let numberingCircles: NumberingCircle[];
    try {
      const circles = all<{
        id: string;
        name: string;
        prefix: string;
        digits: number;
        current: number;
        resetMode: 'never' | 'yearly';
        lastResetYear: number | null;
      }>(`
        SELECT id, name, prefix, digits, current, resetMode, lastResetYear
        FROM numbering_circles
        ORDER BY name
      `);
      
      if (circles.length > 0) {
        numberingCircles = circles.map(c => ({
          id: c.id,
          name: c.name,
          prefix: c.prefix,
          digits: c.digits,
          current: c.current,
          resetMode: c.resetMode,
          lastResetYear: c.lastResetYear ?? undefined
        }));
      } else {
        // Fallback zu Default-Werten falls keine Kreise in DB
        numberingCircles = defaultSettings.numberingCircles;
      }
    } catch (error) {
      console.warn('Error loading numbering circles from SQLite, trying localStorage fallback:', error);
      
      // 🔄 Fallback zu localStorage für Migration
      try {
        const stored = localStorage.getItem('rawalite-numbering');
        if (stored) {
          numberingCircles = JSON.parse(stored);
        } else {
          numberingCircles = defaultSettings.numberingCircles;
        }
      } catch (localStorageError) {
        console.warn('LocalStorage fallback failed:', localStorageError);
        numberingCircles = defaultSettings.numberingCircles;
      }
    }

    return {
      companyData,
      numberingCircles
    };
  }

  async updateCompanyData(companyData: CompanyData): Promise<void> {
    await withTx(async () => {
      const sqliteData = this.mapCompanyDataToSQLite(companyData);
      const timestamp = new Date().toISOString();

      // Update or insert company data
      run(`
        INSERT OR REPLACE INTO settings (
          id, companyName, street, zip, city, phone, email, website, 
          taxId, vatId, kleinunternehmer, bankName, bankAccount, bankBic, 
          logo, updatedAt
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        timestamp
      ]);
    });
  }

  async updateNumberingCircles(numberingCircles: NumberingCircle[]): Promise<void> {
    // ✅ Store in SQLite (Phase 2)
    try {
      await withTx(async () => {
        for (const circle of numberingCircles) {
          run(`
            INSERT OR REPLACE INTO numbering_circles 
            (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, 
              COALESCE((SELECT createdAt FROM numbering_circles WHERE id = ?), datetime('now')),
              datetime('now')
            )
          `, [
            circle.id,
            circle.name,
            circle.prefix,
            circle.digits,
            circle.current,
            circle.resetMode,
            circle.lastResetYear ?? null,
            circle.id // für COALESCE
          ]);
        }
      });
      
      console.log('✅ Nummernkreise in SQLite gespeichert');
    } catch (error) {
      console.error('Error saving numbering circles to SQLite:', error);
      
      // 🔄 Fallback zu localStorage
      try {
        localStorage.setItem('rawalite-numbering', JSON.stringify(numberingCircles));
        console.warn('⚠️ Fallback: Nummernkreise in localStorage gespeichert');
      } catch (localStorageError) {
        console.error('LocalStorage fallback failed:', localStorageError);
        throw error;
      }
    }
  }

  async getNextNumber(circleId: string): Promise<string> {
    // ✅ Verwende robustes NummernkreisService (Phase 2) 
    const { NummernkreisService } = await import('../services/NummernkreisService');
    return await NummernkreisService.getNextNumber(circleId);
  }
}
