import type { Settings as OldSettings, CompanyData } from './settings';
import type { Settings as SQLiteSettings } from '../persistence/adapter';

/**
 * Mapping zwischen dem alten Settings-Interface und dem neuen SQLite-Schema
 */

// SQLite Settings -> Old Settings Interface
export function mapSQLiteToOldSettings(sqliteSettings: SQLiteSettings): OldSettings {
  return {
    companyData: {
      name: sqliteSettings.companyName || 'RawaLite',
      street: sqliteSettings.street || '',
      postalCode: sqliteSettings.zip || '',
      city: sqliteSettings.city || '',
      phone: '',
      email: '',
      website: '',
      taxNumber: sqliteSettings.taxId || '',
      vatId: '',
      kleinunternehmer: sqliteSettings.kleinunternehmer || false,
      bankName: '',
      bankAccount: '',
      bankBic: '',
      logo: '' // TODO: Logo-Handling
    },
    numberingCircles: [
      {
        id: 'customers',
        name: 'Kunden',
        prefix: 'K-',
        digits: 4,
        current: sqliteSettings.nextCustomerNumber || 1,
        resetMode: 'never'
      },
      {
        id: 'offers',
        name: 'Angebote',
        prefix: 'A-',
        digits: 4,
        current: sqliteSettings.nextOfferNumber || 1,
        resetMode: 'yearly'
      },
      {
        id: 'invoices',
        name: 'Rechnungen',
        prefix: 'R-',
        digits: 4,
        current: sqliteSettings.nextInvoiceNumber || 1,
        resetMode: 'yearly'
      },
      {
        id: 'timesheets',
        name: 'Leistungsnachweise',
        prefix: 'LN-',
        digits: 4,
        current: sqliteSettings.nextTimesheetNumber || 1,
        resetMode: 'yearly'
      }
    ],
    designSettings: {
      theme: 'salbeigrün', // Default theme - TODO: persist design settings
      navigationMode: 'sidebar',
      customColors: undefined,
      logoSettings: {}
    }
  };
}

// Old Settings CompanyData -> SQLite Settings patch
export function mapCompanyDataToSQLiteSettings(companyData: CompanyData): Partial<SQLiteSettings> {
  return {
    companyName: companyData.name,
    street: companyData.street,
    zip: companyData.postalCode,
    city: companyData.city,
    taxId: companyData.taxNumber,
    kleinunternehmer: companyData.kleinunternehmer
  };
}