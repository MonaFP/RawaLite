/**
 * Migration 014: Add item origin tracking and sort order system
 * 
 * Phase 1 of Sub-Item Implementation Plan
 * This migration extends line item tables with:
 * - item_origin: Track how items were created (manual, package_import, template)
 * - source_package_item_id: Reference to original package item for imports
 * - sort_order: Explicit ordering for hierarchical display
 * - client_temp_id: Frontend helper for temporary IDs
 * 
 * Enables:
 * - Better item tracking and history
 * - Proper hierarchical sorting
 * - Package synchronization
 * - Phase 2 preparation for reference system
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Migration 014: Adding item origin tracking system...');

  // Add new fields to offer_line_items table
  db.exec(`
    ALTER TABLE offer_line_items 
    ADD COLUMN item_origin TEXT DEFAULT 'manual' 
    CHECK (item_origin IN ('manual', 'package_import', 'template'));
  `);
  
  db.exec(`
    ALTER TABLE offer_line_items 
    ADD COLUMN source_package_item_id INTEGER 
    REFERENCES package_line_items(id) ON DELETE SET NULL;
  `);
  
  db.exec(`
    ALTER TABLE offer_line_items 
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE offer_line_items 
    ADD COLUMN client_temp_id TEXT;
  `);

  // Add new fields to invoice_line_items table
  db.exec(`
    ALTER TABLE invoice_line_items 
    ADD COLUMN item_origin TEXT DEFAULT 'manual' 
    CHECK (item_origin IN ('manual', 'package_import', 'template'));
  `);
  
  db.exec(`
    ALTER TABLE invoice_line_items 
    ADD COLUMN source_package_item_id INTEGER 
    REFERENCES package_line_items(id) ON DELETE SET NULL;
  `);
  
  db.exec(`
    ALTER TABLE invoice_line_items 
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE invoice_line_items 
    ADD COLUMN client_temp_id TEXT;
  `);

  // Add new fields to package_line_items table
  db.exec(`
    ALTER TABLE package_line_items 
    ADD COLUMN item_origin TEXT DEFAULT 'manual' 
    CHECK (item_origin IN ('manual', 'package_import', 'template'));
  `);
  
  db.exec(`
    ALTER TABLE package_line_items 
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE package_line_items 
    ADD COLUMN client_temp_id TEXT;
  `);

  // Create indices for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_offer_line_items_sort_order 
    ON offer_line_items(offer_id, sort_order);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_offer_line_items_source_package 
    ON offer_line_items(source_package_item_id);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_line_items_sort_order 
    ON invoice_line_items(invoice_id, sort_order);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_line_items_source_package 
    ON invoice_line_items(source_package_item_id);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_package_line_items_sort_order 
    ON package_line_items(package_id, sort_order);
  `);

  // Migrate existing data
  console.log('📦 Migrating existing data...');
  
  // Set sort_order based on current ID order for backwards compatibility
  db.exec(`
    UPDATE offer_line_items 
    SET sort_order = (
      SELECT COUNT(*) 
      FROM offer_line_items oli2 
      WHERE oli2.offer_id = offer_line_items.offer_id 
      AND oli2.id <= offer_line_items.id
    ) * 10
    WHERE sort_order = 0;
  `);
  
  db.exec(`
    UPDATE invoice_line_items 
    SET sort_order = (
      SELECT COUNT(*) 
      FROM invoice_line_items ili2 
      WHERE ili2.invoice_id = invoice_line_items.invoice_id 
      AND ili2.id <= invoice_line_items.id
    ) * 10
    WHERE sort_order = 0;
  `);
  
  db.exec(`
    UPDATE package_line_items 
    SET sort_order = (
      SELECT COUNT(*) 
      FROM package_line_items pli2 
      WHERE pli2.package_id = package_line_items.package_id 
      AND pli2.id <= package_line_items.id
    ) * 10
    WHERE sort_order = 0;
  `);

  // Set item_origin based on source_package_id for existing items
  db.exec(`
    UPDATE offer_line_items 
    SET item_origin = 'package_import' 
    WHERE source_package_id IS NOT NULL;
  `);

  console.log('✅ Migration 014: Item origin tracking system added successfully');
  console.log('   - Added item_origin, source_package_item_id, sort_order, client_temp_id to offer_line_items');
  console.log('   - Added item_origin, source_package_item_id, sort_order, client_temp_id to invoice_line_items');
  console.log('   - Added item_origin, sort_order, client_temp_id to package_line_items');
  console.log('   - Created performance indices for sorting and package references');
  console.log('   - Migrated existing data with backwards-compatible sort_order');
}

export function down(db: Database): void {
  console.log('🔄 Migration 014: Removing item origin tracking system...');

  // Drop indices first
  db.exec(`DROP INDEX IF EXISTS idx_offer_line_items_sort_order;`);
  db.exec(`DROP INDEX IF EXISTS idx_offer_line_items_source_package;`);
  db.exec(`DROP INDEX IF EXISTS idx_invoice_line_items_sort_order;`);
  db.exec(`DROP INDEX IF EXISTS idx_invoice_line_items_source_package;`);
  db.exec(`DROP INDEX IF EXISTS idx_package_line_items_sort_order;`);

  // SQLite doesn't support DROP COLUMN, so we need to recreate tables
  
  // Recreate offer_line_items table without new columns
  db.exec(`
    CREATE TABLE offer_line_items_backup AS SELECT 
      id, offer_id, title, description, quantity, unit_price, total, 
      parent_item_id, item_type, source_package_id
    FROM offer_line_items;
  `);
  
  db.exec(`DROP TABLE offer_line_items;`);
  
  db.exec(`
    CREATE TABLE offer_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      parent_item_id INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE,
      item_type TEXT DEFAULT 'standalone',
      source_package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL
    );
  `);
  
  db.exec(`INSERT INTO offer_line_items SELECT * FROM offer_line_items_backup;`);
  db.exec(`DROP TABLE offer_line_items_backup;`);

  // Recreate invoice_line_items table without new columns
  db.exec(`
    CREATE TABLE invoice_line_items_backup AS SELECT 
      id, invoice_id, title, description, quantity, unit_price, total, parent_item_id
    FROM invoice_line_items;
  `);
  
  db.exec(`DROP TABLE invoice_line_items;`);
  
  db.exec(`
    CREATE TABLE invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      parent_item_id INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE
    );
  `);
  
  db.exec(`INSERT INTO invoice_line_items SELECT * FROM invoice_line_items_backup;`);
  db.exec(`DROP TABLE invoice_line_items_backup;`);

  // Recreate package_line_items table without new columns
  db.exec(`
    CREATE TABLE package_line_items_backup AS SELECT 
      id, package_id, title, description, quantity, amount, parent_item_id
    FROM package_line_items;
  `);
  
  db.exec(`DROP TABLE package_line_items;`);
  
  db.exec(`
    CREATE TABLE package_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount REAL NOT NULL DEFAULT 0,
      parent_item_id INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE
    );
  `);
  
  db.exec(`INSERT INTO package_line_items SELECT * FROM package_line_items_backup;`);
  db.exec(`DROP TABLE package_line_items_backup;`);

  console.log('✅ Migration 014: Item origin tracking system removed');
}