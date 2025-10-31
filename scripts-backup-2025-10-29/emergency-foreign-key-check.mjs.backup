#!/usr/bin/env node
// Emergency Foreign Key Constraint Check
import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';

console.log('🔍 EMERGENCY: Foreign Key Constraint Analysis');
console.log('==============================================');

try {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  // Check all tables
  console.log('\n📋 All Tables:');
  const allTables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (allTables[0]) {
    allTables[0].values.forEach(row => console.log('  -', row[0]));
  }
  
  // Check specific tables
  console.log('\n🔍 Table Existence Check:');
  const historyCheck = db.exec("SELECT name FROM sqlite_master WHERE name='user_navigation_mode_history'");
  const settingsCheck = db.exec("SELECT name FROM sqlite_master WHERE name='user_navigation_mode_settings'");
  
  console.log('user_navigation_mode_history:', historyCheck.length > 0 ? '✅ EXISTS' : '❌ MISSING');
  console.log('user_navigation_mode_settings:', settingsCheck.length > 0 ? '✅ EXISTS' : '❌ MISSING');
  
  if (historyCheck.length > 0) {
    console.log('\n🔗 Foreign Key Constraints for user_navigation_mode_history:');
    const fks = db.exec("PRAGMA foreign_key_list(user_navigation_mode_history)");
    if (fks[0]) {
      fks[0].values.forEach(row => {
        console.log(`  - Column: ${row[3]} → References: ${row[2]}(${row[4]})`);
      });
    } else {
      console.log('  - No foreign keys found');
    }
  }
  
  db.close();
  console.log('\n✅ Analysis complete');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}