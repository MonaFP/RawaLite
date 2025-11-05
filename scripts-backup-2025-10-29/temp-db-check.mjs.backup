import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

try {
  const dbPath = join(homedir(), 'AppData/Roaming/Electron/database/rawalite.db');
  console.log('🔍 Connecting to database:', dbPath);
  
  const db = new Database(dbPath, { readonly: true });
  
  console.log('\n📊 USER_NAVIGATION_MODE_SETTINGS:');
  try {
    const navSettings = db.prepare('SELECT * FROM user_navigation_mode_settings').all();
    console.log(JSON.stringify(navSettings, null, 2));
  } catch (e) {
    console.log('Table user_navigation_mode_settings not found:', e.message);
  }
  
  console.log('\n📊 USER_NAVIGATION_PREFERENCES:');  
  try {
    const navPrefs = db.prepare('SELECT * FROM user_navigation_preferences').all();
    console.log(JSON.stringify(navPrefs, null, 2));
  } catch (e) {
    console.log('Table user_navigation_preferences not found:', e.message);
  }
  
  // Prüfe alle Tables mit 'navigation' im Namen
  console.log('\n📊 ALL NAVIGATION-RELATED TABLES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%navigation%'").all();
  tables.forEach(table => {
    console.log(`\n🔍 Table: ${table.name}`);
    try {
      const data = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Error reading table:', e.message);
    }
  });
  
  db.close();
  console.log('\n✅ Database analysis complete');
} catch (error) {
  console.error('❌ Error:', error.message);
}