/**
 * Migration 022: Add Invoice Attachments System
 * 
 * Creates the invoice_attachments table for storing image files
 * and other attachments linked to invoice line items.
 * 
 * Features:
 * - Image file storage with metadata
 * - Base64 storage for images (database-only approach)
 * - Foreign key constraints to invoices and line items
 * - Automatic cleanup on invoice deletion
 * - Mirror of offer_attachments system for consistency
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  console.log('🔄 Running migration 022: Add invoice attachments system...');

  // Create invoice_attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      line_item_id INTEGER,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT,
      base64_data TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (line_item_id) REFERENCES invoice_line_items (id) ON DELETE CASCADE
    )
  `);

  // Create index for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_attachments_invoice_id 
    ON invoice_attachments (invoice_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_attachments_line_item_id 
    ON invoice_attachments (line_item_id);
  `);

  // Create trigger for updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trigger_invoice_attachments_updated_at
    AFTER UPDATE ON invoice_attachments
    BEGIN
      UPDATE invoice_attachments 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = NEW.id;
    END;
  `);

  console.log('✅ Migration 020 completed: Invoice attachments system created');
}

export function down(db: Database.Database): void {
  console.log('🔄 Rolling back migration 020: Remove invoice attachments system...');
  
  // Drop trigger first
  db.exec('DROP TRIGGER IF EXISTS trigger_invoice_attachments_updated_at');
  
  // Drop indexes
  db.exec('DROP INDEX IF EXISTS idx_invoice_attachments_line_item_id');
  db.exec('DROP INDEX IF EXISTS idx_invoice_attachments_invoice_id');
  
  // Drop table
  db.exec('DROP TABLE IF EXISTS invoice_attachments');
  
  console.log('✅ Migration 020 rollback completed');
}