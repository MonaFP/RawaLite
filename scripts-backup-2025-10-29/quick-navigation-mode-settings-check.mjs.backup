import sqlite3 from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectNavigationSettings() {
  const DB_PATH = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';
  
  try {
    // Load SQL.js
    console.log('🔍 Loading SQL.js...');
    const SQL = await sqlite3();
    
    // Load database
    console.log('📂 Loading database...');
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    // Check schema version
    const versionResult = db.exec('PRAGMA user_version');
    const schemaVersion = versionResult[0]?.values[0][0] || 'unknown';
    console.log(`📊 Schema Version: ${schemaVersion}`);
    
    // Check user_navigation_mode_settings table structure
    console.log('\n📋 user_navigation_mode_settings Schema:');
    const schemaResult = db.exec('PRAGMA table_info(user_navigation_mode_settings)');
    if (schemaResult.length > 0) {
      schemaResult[0].values.forEach(column => {
        console.log(`   ${column[1].padEnd(25)} ${column[2].padEnd(15)} ${column[3] ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('   ❌ Table not found');
      return;
    }
    
    // Check content
    console.log('\n📄 user_navigation_mode_settings Content:');
    const contentResult = db.exec('SELECT * FROM user_navigation_mode_settings');
    if (contentResult.length > 0 && contentResult[0].values.length > 0) {
      console.log('   Found rows:', contentResult[0].values.length);
      contentResult[0].values.forEach(row => {
        console.log(`   Row: ${JSON.stringify(row)}`);
      });
    } else {
      console.log('   ❌ No rows found - THAT\'S THE PROBLEM!');
    }
    
    // Check user_navigation_mode_history table
    console.log('\n📋 user_navigation_mode_history:');
    const historySchemaResult = db.exec('PRAGMA table_info(user_navigation_mode_history)');
    if (historySchemaResult.length > 0) {
      console.log('   ✅ Table exists');
      historySchemaResult[0].values.forEach(column => {
        console.log(`   ${column[1].padEnd(25)} ${column[2].padEnd(15)} ${column[3] ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('   ❌ Table not found');
    }
    
    db.close();
    console.log('\n✅ Inspection complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inspectNavigationSettings();