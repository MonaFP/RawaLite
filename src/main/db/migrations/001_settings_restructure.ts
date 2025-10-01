// src/main/db/migrations/001_settings_restructure.ts
import type Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  // Create new settings table with proper company data schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings_new (
      id INTEGER PRIMARY KEY DEFAULT 1,
      company_name TEXT DEFAULT '',
      street TEXT DEFAULT '',
      zip TEXT DEFAULT '',
      city TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      vat_id TEXT DEFAULT '',
      kleinunternehmer INTEGER DEFAULT 0,
      bank_name TEXT DEFAULT '',
      bank_account TEXT DEFAULT '',
      bank_bic TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing key-value data to new structured format
  const keyValueRows = db.prepare('SELECT key, value FROM settings').all() as Array<{key: string, value: string}>;
  
  // Create mapping from old key-value format to new columns
  const settingsMap: Record<string, any> = {};
  for (const row of keyValueRows) {
    try {
      // Try to parse JSON values
      settingsMap[row.key] = JSON.parse(row.value);
    } catch {
      // Fallback to string value
      settingsMap[row.key] = row.value;
    }
  }

  // Extract company data from old format and insert into new table
  const companyData = settingsMap['companyData'] || {};
  
  db.prepare(`
    INSERT OR REPLACE INTO settings_new (
      id, company_name, street, zip, city, phone, email, website,
      tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic, logo
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run([
    companyData.name || '',
    companyData.street || '',
    companyData.postalCode || '',
    companyData.city || '',
    companyData.phone || '',
    companyData.email || '',
    companyData.website || '',
    companyData.taxNumber || '',
    companyData.vatId || '',
    companyData.kleinunternehmer ? 1 : 0,
    companyData.bankName || '',
    companyData.bankAccount || '',
    companyData.bankBic || '',
    companyData.logo || ''
  ]);

  // Replace old table with new table
  db.exec('DROP TABLE settings;');
  db.exec('ALTER TABLE settings_new RENAME TO settings;');

  // Update numbering_circles table schema to match SettingsAdapter expectations
  db.exec(`
    CREATE TABLE IF NOT EXISTS numbering_circles_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefix TEXT DEFAULT '',
      digits INTEGER DEFAULT 3,
      current INTEGER DEFAULT 0,
      resetMode TEXT DEFAULT 'never' CHECK(resetMode IN ('never', 'yearly')),
      lastResetYear INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing numbering circles data
  const existingCircles = db.prepare('SELECT * FROM numbering_circles').all() as Array<any>;
  
  for (const circle of existingCircles) {
    // Generate ID if not exists and map old schema to new
    const circleId = `${circle.type}_${circle.year}`;
    db.prepare(`
      INSERT OR REPLACE INTO numbering_circles_new (
        id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([
      circleId,
      `${circle.type} ${circle.year}`,
      circle.prefix || '',
      3, // default digits
      circle.last_number || 0,
      'yearly',
      circle.year,
      circle.created_at,
      circle.updated_at
    ]);
  }

  // Replace old numbering_circles table
  db.exec('DROP TABLE numbering_circles;');
  db.exec('ALTER TABLE numbering_circles_new RENAME TO numbering_circles;');

  console.log('🗄️ [Migration 001] Settings restructured to company data schema and numbering circles updated');
};

export const down = (db: Database.Database): void => {
  // Reverse migration: Convert back to key-value format
  
  // Backup current structured data
  const companyData = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  
  // Recreate old key-value settings table
  db.exec(`
    CREATE TABLE settings_old (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Convert company data back to JSON format
  if (companyData) {
    const companyJson = JSON.stringify({
      name: companyData.company_name || '',
      street: companyData.street || '',
      postalCode: companyData.zip || '',
      city: companyData.city || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      website: companyData.website || '',
      taxNumber: companyData.tax_id || '',
      vatId: companyData.vat_id || '',
      kleinunternehmer: Boolean(companyData.kleinunternehmer),
      bankName: companyData.bank_name || '',
      bankAccount: companyData.bank_account || '',
      bankBic: companyData.bank_bic || '',
      logo: companyData.logo || ''
    });

    db.prepare('INSERT INTO settings_old (key, value) VALUES (?, ?)').run(['companyData', companyJson]);
  }

  // Replace tables
  db.exec('DROP TABLE settings;');
  db.exec('ALTER TABLE settings_old RENAME TO settings;');

  // Revert numbering_circles table
  db.exec(`
    CREATE TABLE numbering_circles_old (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      year INTEGER NOT NULL,
      last_number INTEGER DEFAULT 0,
      prefix TEXT DEFAULT '',
      suffix TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, year)
    );
  `);

  // Convert numbering circles back
  const newCircles = db.prepare('SELECT * FROM numbering_circles').all() as Array<any>;
  for (const circle of newCircles) {
    // Extract type and year from id like "invoice_2025"
    const [type, yearStr] = circle.id.split('_');
    const year = parseInt(yearStr) || new Date().getFullYear();
    
    db.prepare(`
      INSERT INTO numbering_circles_old (type, year, last_number, prefix, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([
      type,
      year,
      circle.current || 0,
      circle.prefix || '',
      circle.createdAt,
      circle.updatedAt
    ]);
  }

  db.exec('DROP TABLE numbering_circles;');
  db.exec('ALTER TABLE numbering_circles_old RENAME TO numbering_circles;');

  console.log('🗄️ [Migration 001] Reverted settings to key-value schema');
};