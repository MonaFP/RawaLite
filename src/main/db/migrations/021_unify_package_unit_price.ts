/**
 * Migration 021: Unify Package Unit Price Schema
 * 
 * Zweck: Vereinheitlichung der Preis-Felder zwischen allen Document-Types
 * 
 * Problem:
 * - package_line_items verwendet "amount" 
 * - offer_line_items und invoice_line_items verwenden "unit_price"
 * - Field-Mapping Inkonsistenzen verursachen Price Display Probleme
 * 
 * Lösung:
 * - Ändere package_line_items.amount → unit_price
 * - Einheitliche Schema für alle line_items Tabellen
 * - Verbessert Field-Mapping Konsistenz
 * 
 * @author KI Assistant
 * @date 2025-10-14
 * @version v1.0.42.6
 */

import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🔧 [Migration 021] Starting Package Unit Price Schema Unification...');
  
  try {
    // 1. Backup existing data for rollback safety
    console.log('📦 Creating backup table...');
    db.exec(`CREATE TABLE package_line_items_backup AS SELECT * FROM package_line_items;`);
    
    // 2. Get row count for validation
    const originalCount = db.prepare('SELECT COUNT(*) as count FROM package_line_items').get() as { count: number };
    console.log(`📊 Original package_line_items count: ${originalCount.count}`);
    
    // 3. Drop existing table
    console.log('🗑️ Dropping existing package_line_items table...');
    db.exec(`DROP TABLE package_line_items;`);
    
    // 4. Recreate table with unit_price instead of amount
    console.log('🏗️ Creating new package_line_items table with unit_price...');
    db.exec(`
      CREATE TABLE package_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE
      );
    `);
    
    // 5. Migrate data: amount → unit_price
    console.log('📥 Migrating data: amount → unit_price...');
    db.exec(`
      INSERT INTO package_line_items (id, package_id, title, description, quantity, unit_price, parent_item_id)
      SELECT id, package_id, title, description, quantity, amount as unit_price, parent_item_id 
      FROM package_line_items_backup;
    `);
    
    // 6. Validate migration
    const newCount = db.prepare('SELECT COUNT(*) as count FROM package_line_items').get() as { count: number };
    console.log(`📊 Migrated package_line_items count: ${newCount.count}`);
    
    if (originalCount.count !== newCount.count) {
      throw new Error(`Migration validation failed: ${originalCount.count} → ${newCount.count}`);
    }
    
    // 7. Sample validation - check some migrated data
    if (newCount.count > 0) {
      const sampleData = db.prepare('SELECT id, title, unit_price FROM package_line_items LIMIT 3').all();
      console.log('📋 Sample migrated data:');
      sampleData.forEach((item: any) => {
        console.log(`  ID ${item.id}: ${item.title} | unit_price: €${item.unit_price}`);
      });
    }
    
    // 8. Drop backup table (keep commented for extra safety)
    console.log('🧹 Cleaning up backup table...');
    db.exec(`DROP TABLE package_line_items_backup;`);
    
    console.log('✅ [Migration 021] Package Unit Price Schema Unification completed successfully');
    console.log('🎯 Result: All document types now use consistent unit_price field');
    
  } catch (error) {
    console.error('❌ [Migration 021] Error during migration:', error);
    
    // Rollback attempt
    try {
      console.log('🔄 Attempting rollback...');
      db.exec(`DROP TABLE IF EXISTS package_line_items;`);
      db.exec(`ALTER TABLE package_line_items_backup RENAME TO package_line_items;`);
      console.log('✅ Rollback completed successfully');
    } catch (rollbackError) {
      console.error('💥 CRITICAL: Rollback failed:', rollbackError);
      console.error('🆘 Manual intervention required - check backup table package_line_items_backup');
    }
    
    throw error;
  }
};

export const down = (db: Database): void => {
  console.log('🔄 [Migration 021] Rolling back Package Unit Price Schema Unification...');
  
  try {
    // Reverse migration: unit_price → amount
    console.log('📦 Creating rollback backup...');
    db.exec(`CREATE TABLE package_line_items_rollback AS SELECT * FROM package_line_items;`);
    
    console.log('🗑️ Dropping current table...');
    db.exec(`DROP TABLE package_line_items;`);
    
    console.log('🏗️ Recreating original table with amount field...');
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
    
    console.log('📥 Migrating data back: unit_price → amount...');
    db.exec(`
      INSERT INTO package_line_items (id, package_id, title, description, quantity, amount, parent_item_id)
      SELECT id, package_id, title, description, quantity, unit_price as amount, parent_item_id 
      FROM package_line_items_rollback;
    `);
    
    db.exec(`DROP TABLE package_line_items_rollback;`);
    
    console.log('✅ [Migration 021] Rollback completed successfully');
    
  } catch (error) {
    console.error('❌ [Migration 021] Rollback failed:', error);
    throw error;
  }
};