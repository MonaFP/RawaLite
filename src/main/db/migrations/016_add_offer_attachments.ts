/**
 * Migration 016: Add Offer Attachments System
 * 
 * Creates the offer_attachments table for storing image files
 * and other attachments linked to offer line items.
 * 
 * Features:
 * - Image file storage with metadata
 * - Base64 storage for small images (optional)
 * - File path references for larger files
 * - Foreign key constraints to offers and line items
 * - Automatic cleanup on offer deletion
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  console.log('🔄 Running migration 016: Add offer attachments system...');

  // Create offer_attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS offer_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
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
      
      FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE,
      FOREIGN KEY (line_item_id) REFERENCES offer_line_items (id) ON DELETE CASCADE
    )
  `);

  // Create index for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_offer_attachments_offer_id 
    ON offer_attachments (offer_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_offer_attachments_line_item_id 
    ON offer_attachments (line_item_id);
  `);

  // Create trigger for updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trigger_offer_attachments_updated_at
    AFTER UPDATE ON offer_attachments
    BEGIN
      UPDATE offer_attachments 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = NEW.id;
    END;
  `);

  console.log('✅ Migration 016 completed: Offer attachments system created');
}

export function down(db: Database.Database): void {
  console.log('🔄 Rolling back migration 016: Remove offer attachments system...');
  
  // Drop trigger first
  db.exec('DROP TRIGGER IF EXISTS trigger_offer_attachments_updated_at');
  
  // Drop indexes
  db.exec('DROP INDEX IF EXISTS idx_offer_attachments_line_item_id');
  db.exec('DROP INDEX IF EXISTS idx_offer_attachments_offer_id');
  
  // Drop table
  db.exec('DROP TABLE IF EXISTS offer_attachments');
  
  console.log('✅ Migration 016 rollback completed');
}