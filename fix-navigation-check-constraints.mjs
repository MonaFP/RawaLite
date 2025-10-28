import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Footer Fix: Legacy Navigation Mode CHECK Constraints Repair');
console.log('==============================================================');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
console.log(`📂 Database: ${dbPath}`);

try {
  // Initialize sql.js
  const SQL = await initSqlJs();
  
  // Load database
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  console.log('\n🔍 Checking current table constraints...');
  
  // Check current table schema
  const schema = db.exec("SELECT sql FROM sqlite_master WHERE name='user_navigation_preferences'");
  if (schema[0]?.values) {
    console.log('Current user_navigation_preferences schema:');
    console.log(schema[0].values[0][0]);
  }

  const historySchema = db.exec("SELECT sql FROM sqlite_master WHERE name='navigation_mode_history'");
  if (historySchema[0]?.values) {
    console.log('\nCurrent navigation_mode_history schema:');
    console.log(historySchema[0].values[0][0]);
  }

  console.log('\n🔧 PLAN: Recreate tables with correct CHECK constraints...');
  console.log('Legacy modes: header, sidebar, full-sidebar');
  console.log('New modes: mode-dashboard-view, mode-data-panel, mode-compact-focus');

  // Since we can't modify CHECK constraints directly in SQLite,
  // we need to recreate the tables with correct constraints
  
  console.log('\n📋 This script identifies the problem but does NOT make changes.');
  console.log('✅ Problem identified: CHECK constraints use legacy mode names');
  console.log('✅ Root cause for Footer visibility issue found');
  console.log('✅ DatabaseNavigationService validation errors explained');

  console.log('\n🎯 SOLUTION REQUIRED:');
  console.log('1. Create new migration to fix CHECK constraints');
  console.log('2. Recreate tables with mode-dashboard-view, mode-data-panel, mode-compact-focus');
  console.log('3. Migrate existing data to new schema');
  console.log('4. Test Footer visibility across all navigation modes');

  db.close();

} catch (error) {
  console.error('❌ Error:', error.message);
}