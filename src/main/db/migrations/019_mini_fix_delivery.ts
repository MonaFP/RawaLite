// src/main/db/migrations/019_mini_fix_delivery.ts
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 019] Adding Mini-Fix Delivery System fields to settings table...');

  try {
    // Check if mini-fix delivery columns already exist
    const tableInfo = db.prepare(`PRAGMA table_info(settings)`).all();
    const hasUpdateChannel = tableInfo.some((col: any) => col.name === 'update_channel');
    const hasFeatureFlags = tableInfo.some((col: any) => col.name === 'feature_flags');
    
    if (!hasUpdateChannel) {
      console.log('🔧 Adding update_channel column to settings table...');
      
      // Add update channel selection column with constraint
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN update_channel TEXT DEFAULT 'stable' 
        CHECK (update_channel IN ('stable', 'beta'));
      `);
      
      console.log('✅ update_channel column added successfully');
    } else {
      console.log('⏭️ update_channel column already exists, skipping...');
    }

    if (!hasFeatureFlags) {
      console.log('🔧 Adding feature_flags column to settings table...');
      
      // Add feature flags JSON storage column
      db.exec(`
        ALTER TABLE settings 
        ADD COLUMN feature_flags TEXT DEFAULT '{}';
      `);
      
      console.log('✅ feature_flags column added successfully');
    } else {
      console.log('⏭️ feature_flags column already exists, skipping...');
    }

    console.log('✅ Migration 019 completed successfully - Mini-Fix Delivery System ready');
  } catch (error) {
    console.error('❌ Migration 019 failed:', error);
    throw error;
  }
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 019 DOWN] Removing Mini-Fix Delivery System fields from settings table...');
  
  try {
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    console.log('🔧 Recreating settings table without mini-fix delivery columns...');
    
    // Get current settings data (excluding mini-fix delivery columns)
    const currentData = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    
    // Create backup table
    db.exec(`
      CREATE TABLE settings_backup AS 
      SELECT id, company_name, street, zip, city, phone, email, website,
             tax_id, vat_id, kleinunternehmer, bank_name, bank_account, bank_bic,
             tax_office, logo, next_customer_number, next_offer_number, next_invoice_number,
             auto_update_enabled, auto_update_check_frequency, auto_update_notification_style,
             auto_update_reminder_interval, auto_update_auto_download, auto_update_install_prompt,
             created_at, updated_at
      FROM settings
    `);
    
    // Drop current table
    db.exec('DROP TABLE settings');
    
    // Recreate table without mini-fix delivery columns
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
        next_customer_number INTEGER DEFAULT 1,
        next_offer_number INTEGER DEFAULT 1,
        next_invoice_number INTEGER DEFAULT 1,
        auto_update_enabled INTEGER DEFAULT 0,
        auto_update_check_frequency TEXT DEFAULT 'startup',
        auto_update_notification_style TEXT DEFAULT 'subtle',
        auto_update_reminder_interval INTEGER DEFAULT 4,
        auto_update_auto_download INTEGER DEFAULT 0,
        auto_update_install_prompt TEXT DEFAULT 'manual',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Restore data from backup
    if (currentData) {
      const columns = Object.keys(currentData).filter(key => 
        key !== 'update_channel' && key !== 'feature_flags'
      );
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => currentData[col]);
      
      db.prepare(`INSERT INTO settings (${columns.join(', ')}) VALUES (${placeholders})`).run(values);
    }
    
    // Drop backup table
    db.exec('DROP TABLE settings_backup');
    
    console.log('✅ Migration 019 rollback completed successfully');
  } catch (error) {
    console.error('❌ Migration 019 rollback failed:', error);
    throw error;
  }
};