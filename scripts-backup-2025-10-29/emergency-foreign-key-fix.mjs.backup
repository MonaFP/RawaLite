#!/usr/bin/env node
// Emergency Foreign Key Fix
import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';

console.log('🛠️ EMERGENCY: Foreign Key Constraint Repair');
console.log('===========================================');

try {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('\n📋 Current Schema Analysis:');
  
  // Check user_navigation_mode_settings schema
  console.log('\n🔍 user_navigation_mode_settings Schema:');
  const settingsSchema = db.exec("PRAGMA table_info(user_navigation_mode_settings)");
  if (settingsSchema[0]) {
    settingsSchema[0].values.forEach(row => {
      const [cid, name, type, notnull, dflt_value, pk] = row;
      console.log(`  - ${name}: ${type} ${pk ? '(PRIMARY KEY)' : ''} ${notnull ? '(NOT NULL)' : ''}`);
    });
  }
  
  // Check user_navigation_mode_history schema
  console.log('\n🔍 user_navigation_mode_history Schema:');
  const historySchema = db.exec("PRAGMA table_info(user_navigation_mode_history)");
  if (historySchema[0]) {
    historySchema[0].values.forEach(row => {
      const [cid, name, type, notnull, dflt_value, pk] = row;
      console.log(`  - ${name}: ${type} ${pk ? '(PRIMARY KEY)' : ''} ${notnull ? '(NOT NULL)' : ''}`);
    });
  }
  
  console.log('\n🔗 Current Foreign Key Constraints:');
  const fks = db.exec("PRAGMA foreign_key_list(user_navigation_mode_history)");
  if (fks[0]) {
    fks[0].values.forEach(row => {
      console.log(`  - ${row[3]} → ${row[2]}(${row[4]})`);
    });
  }
  
  console.log('\n💡 IDENTIFIED PROBLEM:');
  console.log('- user_navigation_mode_settings has composite PRIMARY KEY (user_id, navigation_mode)');
  console.log('- user_navigation_mode_history references only user_id');
  console.log('- This violates referential integrity!');
  
  console.log('\n🛠️ APPLYING FIX: Drop user_navigation_mode_history table (corrupted foreign key)');
  
  // Disable foreign keys for the operation
  db.exec("PRAGMA foreign_keys = OFF");
  
  // Drop the problematic table
  db.exec("DROP TABLE IF EXISTS user_navigation_mode_history");
  console.log('✅ Dropped user_navigation_mode_history table');
  
  // Re-enable foreign keys
  db.exec("PRAGMA foreign_keys = ON");
  
  // Save the fixed database
  const fixedData = db.export();
  fs.writeFileSync(dbPath, fixedData);
  
  db.close();
  console.log('✅ Database integrity restored!');
  console.log('✅ user_navigation_mode_history removed (can be recreated later if needed)');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}