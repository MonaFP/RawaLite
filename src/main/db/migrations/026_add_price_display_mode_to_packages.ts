/**
 * Migration 026: Add price_display_mode to package_line_items
 * 
 * Extends Migration 025 to include package line items.
 * Enables Package SubItems to use flexible price display options
 * (included, hidden, optional) which are preserved when importing
 * packages into offers.
 * 
 * @since v1.0.42.6
 * @see docs/04-ui/final/PDF-ISSUE-REPORT-PDF-UND-SUBITEM-PREISE-2025-10-14.md
 */

import type { Database } from 'better-sqlite3';

/**
 * Apply migration: Add price_display_mode column to package_line_items
 */
export const up = (db: Database): void => {
  console.log('🗄️ [Migration 026] Adding price_display_mode to package_line_items...');
  
  // Check if column already exists in package_line_items
  const packageLineItemsInfo = db.prepare(`PRAGMA table_info(package_line_items)`).all() as Array<{
    name: string;
  }>;
  
  const hasPackagePriceDisplayMode = packageLineItemsInfo.some(col => col.name === 'price_display_mode');
  
  if (!hasPackagePriceDisplayMode) {
    console.log('🔧 [Migration 026] Adding price_display_mode to package_line_items...');
    db.exec(`
      ALTER TABLE package_line_items 
      ADD COLUMN price_display_mode TEXT DEFAULT 'default'
      CHECK (price_display_mode IN ('default', 'included', 'hidden', 'optional'))
    `);
    console.log('✅ [Migration 026] price_display_mode added to package_line_items');
  } else {
    console.log('⏭️  [Migration 026] price_display_mode already exists in package_line_items, skipping...');
  }
  
  console.log('✅ [Migration 026] Completed successfully');
};

/**
 * Revert migration: Remove price_display_mode column
 * 
 * Note: SQLite doesn't support DROP COLUMN directly in older versions.
 * For production safety, we leave the column in place (backwards compatible).
 */
export const down = (db: Database): void => {
  console.log('🗄️ [Migration 026] Reverting price_display_mode from package_line_items...');
  console.log('⚠️  [Migration 026] SQLite ALTER TABLE DROP COLUMN not fully supported');
  console.log('⚠️  [Migration 026] Column will remain (safe for backwards compatibility)');
  console.log('⚠️  [Migration 026] Data will default to "default" mode if not set');
  console.log('✅ [Migration 026] Down migration acknowledged (no-op for safety)');
};
