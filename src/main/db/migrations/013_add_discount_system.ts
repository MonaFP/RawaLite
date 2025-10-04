/**
 * Migration 013: Add discount system for offers and invoices
 * 
 * This migration adds discount functionality that works with both
 * normal businesses and Kleinunternehmer (§19 UStG).
 * 
 * Features:
 * - Percentage or fixed amount discounts
 * - Proper calculation with/without VAT
 * - Backwards compatible with existing data
 * - 2 decimal precision for all amounts
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('🔄 Migration 013: Adding discount system...');

  // Add discount fields to offers table
  db.exec(`
    ALTER TABLE offers ADD COLUMN discount_type TEXT DEFAULT 'none' 
    CHECK (discount_type IN ('none', 'percentage', 'fixed'));
  `);
  
  db.exec(`
    ALTER TABLE offers ADD COLUMN discount_value REAL DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE offers ADD COLUMN discount_amount REAL DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE offers ADD COLUMN subtotal_before_discount REAL DEFAULT 0;
  `);

  // Add discount fields to invoices table
  db.exec(`
    ALTER TABLE invoices ADD COLUMN discount_type TEXT DEFAULT 'none' 
    CHECK (discount_type IN ('none', 'percentage', 'fixed'));
  `);
  
  db.exec(`
    ALTER TABLE invoices ADD COLUMN discount_value REAL DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE invoices ADD COLUMN discount_amount REAL DEFAULT 0;
  `);
  
  db.exec(`
    ALTER TABLE invoices ADD COLUMN subtotal_before_discount REAL DEFAULT 0;
  `);

  // Migrate existing data: set subtotal_before_discount to current total
  // This ensures backwards compatibility
  db.exec(`
    UPDATE offers SET 
      subtotal_before_discount = total,
      discount_type = 'none',
      discount_value = 0,
      discount_amount = 0
    WHERE subtotal_before_discount = 0;
  `);

  db.exec(`
    UPDATE invoices SET 
      subtotal_before_discount = total,
      discount_type = 'none',
      discount_value = 0,
      discount_amount = 0
    WHERE subtotal_before_discount = 0;
  `);

  console.log('✅ Migration 013: Discount system added successfully');
  console.log('   - Added 4 discount fields to offers table');
  console.log('   - Added 4 discount fields to invoices table');
  console.log('   - Migrated existing data for backwards compatibility');
}

export function down(db: Database): void {
  console.log('🔄 Migration 013: Removing discount system...');

  // Remove discount fields from offers table
  // SQLite doesn't support DROP COLUMN, so we need to recreate the table
  
  // For offers
  db.exec(`
    CREATE TABLE offers_backup AS SELECT 
      id, offer_number, customer_id, title, status, 
      valid_until, subtotal, vat_rate, vat_amount, total, notes, 
      sent_at, accepted_at, rejected_at, created_at, updated_at 
    FROM offers;
  `);
  
  db.exec(`DROP TABLE offers;`);
  
  db.exec(`
    CREATE TABLE offers (
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
  
  db.exec(`
    INSERT INTO offers SELECT * FROM offers_backup;
  `);
  
  db.exec(`DROP TABLE offers_backup;`);

  // For invoices
  db.exec(`
    CREATE TABLE invoices_backup AS SELECT 
      id, invoice_number, customer_id, offer_id, title, status, 
      due_date, subtotal, vat_rate, vat_amount, total, 
      notes, sent_at, paid_at, overdue_at, cancelled_at, created_at, updated_at 
    FROM invoices;
  `);
  
  db.exec(`DROP TABLE invoices;`);
  
  db.exec(`
    CREATE TABLE invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 19,
      vat_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      sent_at TEXT,
      paid_at TEXT,
      overdue_at TEXT,
      cancelled_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  
  db.exec(`
    INSERT INTO invoices SELECT * FROM invoices_backup;
  `);
  
  db.exec(`DROP TABLE invoices_backup;`);

  console.log('✅ Migration 013: Discount system removed');
}