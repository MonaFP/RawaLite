import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import initSqlJs from 'sql.js';

async function analyzeNavigationData() {
  try {
    const SQL = await initSqlJs();
    const dbPath = join(homedir(), 'AppData/Roaming/Electron/database/rawalite.db');
    console.log('🔍 Loading database with sql.js:', dbPath);
    
    const filebuffer = readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    
    console.log('\n📊 ALL NAVIGATION-RELATED TABLES:');
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%navigation%'");
    
    if (tablesRes.length > 0) {
      const tables = tablesRes[0].values.map(row => row[0]);
      
      for (const tableName of tables) {
        console.log(`\n🔍 Table: ${tableName}`);
        try {
          const result = db.exec(`SELECT * FROM ${tableName} LIMIT 10`);
          if (result.length > 0) {
            console.log('Columns:', result[0].columns);
            console.log('Data:', result[0].values);
          } else {
            console.log('No data found');
          }
        } catch (e) {
          console.log('Error reading table:', e.message);
        }
      }
    } else {
      console.log('No navigation tables found');
    }
    
    // Suche nach Settings-Tables
    console.log('\n📊 ALL SETTINGS TABLES:');
    const settingsRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%setting%'");
    if (settingsRes.length > 0) {
      const settingsTables = settingsRes[0].values.map(row => row[0]);
      console.log('Settings tables found:', settingsTables);
    }
    
    db.close();
    console.log('\n✅ Analysis complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeNavigationData();