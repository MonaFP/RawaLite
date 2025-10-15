/**
 * Migration 025: Add price_display_mode to line items
 * 
 * Adds flexible price display options to offer and invoice line items.
 * Enables SubItems to be marked as "included", "hidden", or "optional"
 * instead of always displaying prices.
 * 
 * @since v1.0.42.6
 * @see docs/09-pdf/ISSUE-REPORT-PDF-UND-SUBITEM-PREISE-2025-10-14.md
 */

import type { Database } from 'better-sqlite3';

/**
 * Apply migration: Add price_display_mode column
 */
export const up = (db: Database): void => {
  console.log('🗄️ [Migration 025] Adding price_display_mode to line items...');
  
  // Check if column already exists in offer_line_items
  const offerLineItemsInfo = db.prepare(`PRAGMA table_info(offer_line_items)`).all() as Array<{
    name: string;
  }>;
  
  const hasOfferPriceDisplayMode = offerLineItemsInfo.some(col => col.name === 'price_display_mode');
  
  if (!hasOfferPriceDisplayMode) {
    console.log('🔧 [Migration 025] Adding price_display_mode to offer_line_items...');
    db.exec(`
      ALTER TABLE offer_line_items 
      ADD COLUMN price_display_mode TEXT DEFAULT 'default'
      CHECK (price_display_mode IN ('default', 'included', 'hidden', 'optional'))
    `);
    console.log('✅ [Migration 025] price_display_mode added to offer_line_items');
  } else {
    console.log('⏭️  [Migration 025] price_display_mode already exists in offer_line_items, skipping...');
  }
  
  // Check if column already exists in invoice_line_items
  const invoiceLineItemsInfo = db.prepare(`PRAGMA table_info(invoice_line_items)`).all() as Array<{
    name: string;
  }>;
  
  const hasInvoicePriceDisplayMode = invoiceLineItemsInfo.some(col => col.name === 'price_display_mode');
  
  if (!hasInvoicePriceDisplayMode) {
    console.log('🔧 [Migration 025] Adding price_display_mode to invoice_line_items...');
    db.exec(`
      ALTER TABLE invoice_line_items 
      ADD COLUMN price_display_mode TEXT DEFAULT 'default'
      CHECK (price_display_mode IN ('default', 'included', 'hidden', 'optional'))
    `);
    console.log('✅ [Migration 025] price_display_mode added to invoice_line_items');
  } else {
    console.log('⏭️  [Migration 025] price_display_mode already exists in invoice_line_items, skipping...');
  }
  
  console.log('✅ [Migration 025] Completed successfully');
};

/**
 * Revert migration: Remove price_display_mode column
 * 
 * Note: SQLite doesn't support DROP COLUMN directly in older versions.
 * For production safety, we leave the column in place (backwards compatible).
 * If rollback is critical, table recreation would be needed.
 */
export const down = (db: Database): void => {
  console.log('🗄️ [Migration 025] Reverting price_display_mode...');
  console.log('⚠️  [Migration 025] SQLite ALTER TABLE DROP COLUMN not fully supported');
  console.log('⚠️  [Migration 025] Column will remain (safe for backwards compatibility)');
  console.log('⚠️  [Migration 025] Data will default to "default" mode if not set');
  console.log('✅ [Migration 025] Down migration acknowledged (no-op for safety)');
};
