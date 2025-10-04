// src/main/db/migrations/012_add_tax_office_field.ts

export const up = (db: any) => {
  console.log('🗄️ [Migration 012] Adding tax_office field to settings table...');

  try {
    // Check if tax_office column already exists
    const tableInfo = db.prepare(`PRAGMA table_info(settings)`).all();
    const hasTaxOffice = tableInfo.some((col: any) => col.name === 'tax_office');
    
    if (!hasTaxOffice) {
      console.log('🔧 Adding tax_office column to settings table...');
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN tax_office TEXT DEFAULT ''
      `);
      console.log('✅ tax_office column added successfully');
    } else {
      console.log('⏭️ tax_office column already exists, skipping...');
    }
  } catch (error) {
    console.error('❌ Migration 012 failed:', error);
    throw error;
  }
};

export const down = (db: any) => {
  console.log('🗄️ [Migration 012 DOWN] Removing tax_office field from settings table...');
  
  try {
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    console.log('🔧 Recreating settings table without tax_office column...');
    
    // Get current settings data
    const currentData = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    
    // Create backup table
    db.exec(`
      CREATE TABLE settings_backup AS 
      SELECT id, company_name, street, zip, city, phone, email, website,
             tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic,
             logo, created_at, updated_at
      FROM settings
    `);
    
    // Drop current table
    db.exec('DROP TABLE settings');
    
    // Recreate table without tax_office
    db.exec(`
      CREATE TABLE settings (
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
      )
    `);
    
    // Restore data from backup
    db.exec(`
      INSERT INTO settings 
      SELECT * FROM settings_backup
    `);
    
    // Drop backup table
    db.exec('DROP TABLE settings_backup');
    
    console.log('✅ tax_office column removed successfully');
  } catch (error) {
    console.error('❌ Migration 012 DOWN failed:', error);
    throw error;
  }
};