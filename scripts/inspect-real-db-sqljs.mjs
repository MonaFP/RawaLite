#!/usr/bin/env node
/**
 * @file inspect-real-db-sqljs.mjs
 * @description Node.js-compatible database inspector using SQL.js (WASM-based, no ABI issues)
 * 
 * Why SQL.js instead of better-sqlite3?
 * - better-sqlite3: Native addon compiled for Electron (ABI 125)
 * - Node.js v22: Requires ABI 127
 * - sql.js: Pure JavaScript/WASM (ABI-independent)
 * 
 * Usage: node scripts/inspect-real-db-sqljs.mjs
 */

import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

// Database path (production location)
const dbPath = join(
  os.homedir(), 
  'AppData', 
  'Roaming', 
  'Electron', 
  'database', 
  'rawalite.db'
);

console.log('🔍 RawaLite Database Inspector (SQL.js)');
console.log('=' .repeat(60));
console.log(`📂 Database path: ${dbPath}`);

// Check if database exists
if (!existsSync(dbPath)) {
  console.log('\n❌ Database not found!');
  console.log('💡 Make sure RawaLite has been run at least once.');
  console.log('💡 Expected location: %APPDATA%\\Electron\\database\\rawalite.db');
  process.exit(1);
}

try {
  // Initialize SQL.js
  const SQL = await initSqlJs();
  
  // Load database file
  const buffer = readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  
  console.log('✅ Database loaded successfully\n');
  
  // ========================================
  // SCHEMA VERSION
  // ========================================
  const versionResult = db.exec('PRAGMA user_version');
  const schemaVersion = versionResult[0]?.values[0]?.[0] || 0;
  console.log(`📊 Schema Version: ${schemaVersion}`);
  
  // ========================================
  // LIST ALL TABLES
  // ========================================
  const tablesResult = db.exec(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `);
  
  console.log('\n📋 Tables:');
  const tables = tablesResult[0]?.values || [];
  tables.forEach(row => {
    console.log(`   - ${row[0]}`);
  });
  
  // ========================================
  // PACKAGE_LINE_ITEMS DETAILS
  // ========================================
  console.log('\n🎯 package_line_items Schema:');
  console.log('-'.repeat(60));
  
  const schemaResult = db.exec('PRAGMA table_info(package_line_items)');
  if (schemaResult[0]) {
    schemaResult[0].values.forEach(col => {
      const [cid, name, type, notNull, dfltValue, pk] = col;
      const flags = [];
      if (notNull) flags.push('NOT NULL');
      if (pk) flags.push('PRIMARY KEY');
      if (dfltValue !== null) flags.push(`DEFAULT ${dfltValue}`);
      
      console.log(`   ${name.padEnd(25)} ${type.padEnd(15)} ${flags.join(' ')}`);
    });
  }
  
  // ========================================
  // FOREIGN KEYS
  // ========================================
  console.log('\n🔗 Foreign Keys:');
  const fkResult = db.exec('PRAGMA foreign_key_list(package_line_items)');
  if (fkResult[0] && fkResult[0].values.length > 0) {
    fkResult[0].values.forEach(fk => {
      const [id, seq, table, from, to, onUpdate, onDelete, match] = fk;
      console.log(`   ${from} → ${table}(${to}) ON DELETE ${onDelete}`);
    });
  } else {
    console.log('   (none)');
  }
  
  // ========================================
  // RECORD COUNT
  // ========================================
  console.log('\n📊 Record Counts:');
  const countTables = [
    'customers',
    'packages',
    'package_line_items',
    'offers',
    'offer_line_items',
    'invoices',
    'invoice_line_items',
    'settings'
  ];
  
  countTables.forEach(table => {
    try {
      const countResult = db.exec(`SELECT COUNT(*) FROM ${table}`);
      const count = countResult[0]?.values[0]?.[0] || 0;
      console.log(`   ${table.padEnd(25)} ${count}`);
    } catch (err) {
      console.log(`   ${table.padEnd(25)} (table not found)`);
    }
  });
  
  // ========================================
  // SAMPLE PACKAGE_LINE_ITEMS DATA
  // ========================================
  const itemCountResult = db.exec('SELECT COUNT(*) FROM package_line_items');
  const itemCount = itemCountResult[0]?.values[0]?.[0] || 0;
  
  if (itemCount > 0) {
    console.log('\n📄 Sample package_line_items (first 5):');
    console.log('-'.repeat(60));
    
    const samplesResult = db.exec(`
      SELECT 
        id, 
        title, 
        quantity, 
        unit_price, 
        parent_item_id,
        hierarchy_level
      FROM package_line_items 
      ORDER BY id
      LIMIT 5
    `);
    
    if (samplesResult[0]) {
      samplesResult[0].values.forEach(row => {
        const [id, title, qty, price, parentId, level] = row;
        const indent = '  '.repeat(level || 0);
        console.log(`   ${indent}ID ${id}: ${title}`);
        console.log(`   ${indent}  └─ Qty: ${qty}, Price: €${price}, Parent: ${parentId || 'none'}, Level: ${level || 0}`);
      });
    }
    
    // ========================================
    // HIERARCHY CHECK
    // ========================================
    console.log('\n🌳 Hierarchy Analysis:');
    
    const parentsResult = db.exec(`
      SELECT COUNT(*) 
      FROM package_line_items 
      WHERE parent_item_id IS NULL
    `);
    const parentCount = parentsResult[0]?.values[0]?.[0] || 0;
    
    const subItemsResult = db.exec(`
      SELECT COUNT(*) 
      FROM package_line_items 
      WHERE parent_item_id IS NOT NULL
    `);
    const subItemCount = subItemsResult[0]?.values[0]?.[0] || 0;
    
    console.log(`   Parents (parent_item_id IS NULL): ${parentCount}`);
    console.log(`   SubItems (parent_item_id IS NOT NULL): ${subItemCount}`);
    
    // Check for orphaned sub-items
    const orphansResult = db.exec(`
      SELECT COUNT(*) 
      FROM package_line_items AS child
      WHERE child.parent_item_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 
          FROM package_line_items AS parent 
          WHERE parent.id = child.parent_item_id
        )
    `);
    const orphanCount = orphansResult[0]?.values[0]?.[0] || 0;
    
    if (orphanCount > 0) {
      console.log(`   ⚠️  Orphaned SubItems: ${orphanCount}`);
    } else {
      console.log(`   ✅ No orphaned SubItems`);
    }
  } else {
    console.log('\n📄 No package_line_items data yet.');
  }
  
  // ========================================
  // MIGRATIONS CHECK
  // ========================================
  console.log('\n🔄 Applied Migrations:');
  try {
    const migrationsResult = db.exec(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `);
    
    if (migrationsResult[0]?.values.length > 0) {
      const appliedResult = db.exec(`
        SELECT id, name, applied_at 
        FROM migrations 
        ORDER BY id
      `);
      
      if (appliedResult[0]) {
        console.log(`   Total: ${appliedResult[0].values.length}`);
        console.log('   Last 3:');
        const lastThree = appliedResult[0].values.slice(-3);
        lastThree.forEach(row => {
          const [id, name, appliedAt] = row;
          console.log(`     ${id}: ${name} (${appliedAt})`);
        });
      }
    } else {
      console.log('   (migrations table not found)');
    }
  } catch (err) {
    console.log('   (error reading migrations)');
  }
  
  // ========================================
  // CLEANUP
  // ========================================
  db.close();
  console.log('\n✅ Inspection complete!');
  console.log('=' .repeat(60));
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('   - Ensure sql.js is installed: pnpm install');
  console.error('   - Check database file permissions');
  console.error('   - Make sure RawaLite is not currently running');
  process.exit(1);
}
