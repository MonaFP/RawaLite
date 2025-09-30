import { getDB, all, run, withTx } from '../db'; // Use legacy wrapper
import type { Settings, CompanyData, NumberingCircle } from '../lib/settings';
import { defaultSettings } from '../lib/settings';
import { mapFromSQL, mapToSQL } from '../lib/field-mapper';
import PATHS from '../lib/paths';

export class SettingsAdapter {
  async getSettings(): Promise<Settings> {
    await getDB();
    
    // Get company data from SQLite
    const settingsRows = all<any>("SELECT * FROM settings WHERE id = 1");
    const settingsRow = settingsRows[0];
    
    let companyData: CompanyData;
    if (settingsRow) {
      // Use central field mapper for camelCase conversion
      const mappedRow = mapFromSQL(settingsRow);
      companyData = {
        name: mappedRow.companyName || '',
        street: mappedRow.street || '',
        postalCode: mappedRow.zip || '', // zip -> postalCode mapping
        city: mappedRow.city || '',
        phone: mappedRow.phone || '',
        email: mappedRow.email || '',
        website: mappedRow.website || '',
        taxNumber: mappedRow.taxId || '', // taxId -> taxNumber mapping
        vatId: mappedRow.vatId || '',
        kleinunternehmer: Boolean(mappedRow.kleinunternehmer), // INTEGER -> boolean
        bankName: mappedRow.bankName || '',
        bankAccount: mappedRow.bankAccount || '',
        bankBic: mappedRow.bankBic || '',
        logo: mappedRow.logo || ''
      };
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
      // Use central field mapper for snake_case conversion
      const sqliteData = mapToSQL({
        companyName: companyData.name,
        street: companyData.street,
        zip: companyData.postalCode, // postalCode -> zip mapping
        city: companyData.city,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
        taxId: companyData.taxNumber, // taxNumber -> taxId mapping
        vatId: companyData.vatId,
        kleinunternehmer: companyData.kleinunternehmer ? 1 : 0, // boolean -> INTEGER
        bankName: companyData.bankName,
        bankAccount: companyData.bankAccount,
        bankBic: companyData.bankBic,
        logo: companyData.logo
      });
      const timestamp = new Date().toISOString();

      // Update or insert company data
      run(`
        INSERT OR REPLACE INTO settings (
          id, company_name, street, zip, city, phone, email, website, 
          tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic, 
          logo, updated_at
        ) VALUES (
          1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        sqliteData.company_name,
        sqliteData.street,
        sqliteData.zip,
        sqliteData.city,
        sqliteData.phone,
        sqliteData.email,
        sqliteData.website,
        sqliteData.tax_id,
        sqliteData.vat_id,
        sqliteData.kleinunternehmer,
        sqliteData.bank_name,
        sqliteData.bank_account,
        sqliteData.bank_bic,
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
