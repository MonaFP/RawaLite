// Migration 011: Extend offer_line_items for dual sub-item types
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 011] Extending offer_line_items for dual sub-item support...');
  
  // Check if columns already exist
  const offerLineItemsInfo = db.prepare(`PRAGMA table_info(offer_line_items)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasItemType = offerLineItemsInfo.some(col => col.name === 'item_type');
  const hasSourcePackageId = offerLineItemsInfo.some(col => col.name === 'source_package_id');
  
  if (!hasItemType) {
    console.log('🔧 Adding item_type column...');
    db.exec(`
      ALTER TABLE offer_line_items 
      ADD COLUMN item_type TEXT NOT NULL DEFAULT 'standalone'
    `);
    
    // Update existing data based on parent_item_id
    console.log('🔧 Updating existing item_type values...');
    db.exec(`
      UPDATE offer_line_items 
      SET item_type = CASE 
        WHEN parent_item_id IS NOT NULL THEN 'individual_sub'
        ELSE 'standalone'
      END
    `);
  }
  
  if (!hasSourcePackageId) {
    console.log('🔧 Adding source_package_id column...');
    db.exec(`
      ALTER TABLE offer_line_items 
      ADD COLUMN source_package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL
    `);
  }
  
  // Create indexes for better performance
  console.log('🔧 Creating indexes for new columns...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offer_line_items_type ON offer_line_items(item_type);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_offer_line_items_source_package ON offer_line_items(source_package_id);`);
  
  console.log('🗄️ [Migration 011] Offer line items extension completed successfully');
  
  // Log the new schema structure
  console.log('📋 New offer_line_items structure:');
  console.log('   - item_type: "standalone" | "individual_sub" | "package_import"');
  console.log('   - source_package_id: NULL for standalone/individual, package ID for imports');
  console.log('   - parent_item_id: NULL for top-level, parent ID for hierarchical items');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 011] Reverting offer_line_items extension...');
  
  // SQLite doesn't support DROP COLUMN in older versions
  // We'll create a new table without the extended columns
  console.log('🔧 Creating new table without extended columns...');
  
  db.exec(`
    CREATE TABLE offer_line_items_rollback (
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
  
  // Copy data back (excluding new columns)
  db.exec(`
    INSERT INTO offer_line_items_rollback (
      id, offer_id, title, description, quantity, unit_price, total, parent_item_id
    )
    SELECT 
      id, offer_id, title, description, quantity, unit_price, total, parent_item_id
    FROM offer_line_items;
  `);
  
  // Replace tables
  db.exec(`DROP TABLE offer_line_items;`);
  db.exec(`ALTER TABLE offer_line_items_rollback RENAME TO offer_line_items;`);
  
  console.log('🗄️ [Migration 011] Offer line items extension reverted');
};