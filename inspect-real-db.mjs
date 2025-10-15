import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Correct database path for Electron
const dbPath = join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('🔍 Real Database Inspector');
console.log(`📂 Database path: ${dbPath}`);

if (!existsSync(dbPath)) {
  console.log('❌ Database not found!');
  process.exit(1);
}

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('✅ Database connected successfully');
  
  // Check schema version
  const versionResult = db.prepare('PRAGMA user_version').get();
  console.log(`📊 Schema version: ${versionResult.user_version}`);
  
  // List all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n📋 Tables in database:');
  tables.forEach(table => console.log(`   - ${table.name}`));
  
  // Check package_line_items schema specifically
  console.log('\n🎯 package_line_items table schema:');
  const packageSchema = db.prepare("PRAGMA table_info(package_line_items)").all();
  packageSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check offer_line_items schema for comparison
  console.log('\n🎯 offer_line_items table schema:');
  const offerSchema = db.prepare("PRAGMA table_info(offer_line_items)").all();
  offerSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check invoice_line_items schema for comparison
  console.log('\n🎯 invoice_line_items table schema:');
  const invoiceSchema = db.prepare("PRAGMA table_info(invoice_line_items)").all();
  invoiceSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check if there's any data in package_line_items
  const packageCount = db.prepare("SELECT COUNT(*) as count FROM package_line_items").get();
  console.log(`\n📊 Package line items count: ${packageCount.count}`);
  
  // Sample some data
  if (packageCount.count > 0) {
    console.log('\n📄 Sample package_line_items data:');
    const sampleData = db.prepare("SELECT id, title, quantity, unit_price, parent_item_id FROM package_line_items LIMIT 5").all();
    sampleData.forEach(row => {
      console.log(`   ID ${row.id}: ${row.title} - Qty: ${row.quantity}, Price: ${row.unit_price}, Parent: ${row.parent_item_id || 'none'}`);
    });
  }
  
  db.close();
  console.log('\n✅ Database inspection complete');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}