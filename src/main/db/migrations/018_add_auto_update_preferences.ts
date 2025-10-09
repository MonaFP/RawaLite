// src/main/db/migrations/018_add_auto_update_preferences.ts

export const up = (db: any) => {
  console.log('🗄️ [Migration 018] Adding auto_update preferences to settings table...');

  try {
    // Check if auto_update columns already exist
    const tableInfo = db.prepare(`PRAGMA table_info(settings)`).all();
    const hasAutoUpdateEnabled = tableInfo.some((col: any) => col.name === 'auto_update_enabled');
    
    if (!hasAutoUpdateEnabled) {
      console.log('🔧 Adding auto_update preference columns to settings table...');
      
      // Add auto-update preference columns with field-mapper compliant names
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_enabled INTEGER DEFAULT 0;
      `);
      
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_check_frequency TEXT DEFAULT 'startup';
      `);
      
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_notification_style TEXT DEFAULT 'subtle';
      `);
      
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_reminder_interval INTEGER DEFAULT 4;
      `);
      
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_auto_download INTEGER DEFAULT 0;
      `);
      
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN auto_update_install_prompt TEXT DEFAULT 'manual';
      `);
      
      console.log('✅ Auto-update preference columns added successfully');
    } else {
      console.log('⏭️ Auto-update preference columns already exist, skipping...');
    }
  } catch (error) {
    console.error('❌ Migration 018 failed:', error);
    throw error;
  }
};

export const down = (db: any) => {
  console.log('🗄️ [Migration 018 DOWN] Removing auto_update preferences from settings table...');
  
  try {
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    console.log('🔧 Recreating settings table without auto_update columns...');
    
    // Get current settings data (excluding auto_update columns)
    const currentData = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    
    // Create backup table
    db.exec(`
      CREATE TABLE settings_backup AS 
      SELECT id, company_name, street, zip, city, phone, email, website,
             tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic,
             tax_office, logo, created_at, updated_at
      FROM settings
    `);
    
    // Drop current table
    db.exec('DROP TABLE settings');
    
    // Recreate table without auto_update columns
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
        tax_office TEXT DEFAULT '',
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
    
    console.log('✅ Auto-update preference columns removed successfully');
  } catch (error) {
    console.error('❌ Migration 018 rollback failed:', error);
    throw error;
  }
};