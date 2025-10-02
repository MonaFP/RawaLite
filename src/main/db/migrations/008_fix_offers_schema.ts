// Migration 008: Fix offers schema and add missing offer_line_items table
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 008] Fixing offers schema and adding offer_line_items table...');
  
  // 1. Fix offers table - modernize schema to match code expectations
  console.log('🔧 Fixing offers table schema...');
  
  const offersInfo = db.prepare(`PRAGMA table_info(offers)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasOfferNumber = offersInfo.some(col => col.name === 'offer_number');
  const hasSubtotal = offersInfo.some(col => col.name === 'subtotal');
  const hasVatRate = offersInfo.some(col => col.name === 'vat_rate');
  const hasVatAmount = offersInfo.some(col => col.name === 'vat_amount');
  const hasOfferTotal = offersInfo.some(col => col.name === 'total');
  const hasNotes = offersInfo.some(col => col.name === 'notes');
  
  if (!hasOfferNumber || !hasSubtotal) {
    console.log('🔧 Creating new offers table with modern schema...');
    
    // Create new offers table with correct schema
    db.exec(`
      CREATE TABLE offers_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        valid_until TEXT NOT NULL,
        subtotal REAL NOT NULL DEFAULT 0,
        vat_rate REAL NOT NULL DEFAULT 19,
        vat_amount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        notes TEXT,
        sent_at TEXT,
        accepted_at TEXT,
        rejected_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Migrate existing data
    db.exec(`
      INSERT INTO offers_new (
        id, offer_number, customer_id, title, status, 
        valid_until, subtotal, vat_rate, vat_amount, total, 
        created_at, updated_at
      )
      SELECT 
        id, 
        COALESCE(number, 'AN-' || printf('%04d', id)) as offer_number,
        customer_id,
        title,
        status,
        COALESCE(valid_until, date('now', '+30 days')) as valid_until,
        COALESCE(total_amount, 0) as subtotal,
        COALESCE(tax_rate, 19) as vat_rate,
        ROUND(COALESCE(total_amount, 0) * COALESCE(tax_rate, 19) / 100, 2) as vat_amount,
        ROUND(COALESCE(total_amount, 0) * (1 + COALESCE(tax_rate, 19) / 100), 2) as total,
        created_at,
        updated_at
      FROM offers;
    `);
    
    // Drop old table and rename new one
    db.exec(`DROP TABLE offers;`);
    db.exec(`ALTER TABLE offers_new RENAME TO offers;`);
    
    // Recreate indexes
    db.exec(`CREATE INDEX idx_offers_customer ON offers(customer_id);`);
    db.exec(`CREATE INDEX idx_offers_status ON offers(status);`);
    
    console.log('✅ Offers table schema fixed');
  }
  
  // 2. Create offer_line_items table if it doesn't exist
  const offerLineItemsExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='offer_line_items'
  `).get();
  
  if (!offerLineItemsExists) {
    console.log('🔧 Creating offer_line_items table...');
    
    db.exec(`
      CREATE TABLE offer_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Offer line items table created');
  }

  console.log('🗄️ [Migration 008] Offers schema and line items table completed successfully');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 008] Reverting offers schema fixes...');
  
  // This is a complex migration that's difficult to reverse safely
  console.warn('⚠️ This migration contains irreversible schema changes');
  console.warn('⚠️ Backup your database before running the down migration');
  
  // Drop the line items table
  db.exec('DROP TABLE IF EXISTS offer_line_items;');
  
  console.log('🗄️ [Migration 008] Offers schema fixes reverted (partial)');
};