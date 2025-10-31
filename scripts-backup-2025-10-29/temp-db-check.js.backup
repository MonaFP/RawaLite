import initSqlJs from 'sql.js';
import fs from 'fs';

(async () => {
  try {
    const SQL = await initSqlJs();
    const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    console.log('🔍 NAVIGATION MODE SETTINGS ANALYSIS');
    console.log('=====================================');
    
    // Check navigation tables
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%navigation%'");
    console.log('Navigation tables found:');
    if (tables.length > 0) {
      tables[0].values.forEach(row => console.log('  -', row[0]));
    }
    
    // Check user_navigation_mode_settings
    try {
      const userResult = db.exec('SELECT * FROM user_navigation_mode_settings');
      if (userResult.length > 0 && userResult[0].values.length > 0) {
        console.log('\n📋 Current user_navigation_mode_settings:');
        console.log('Columns:', userResult[0].columns);
        userResult[0].values.forEach(row => {
          console.log('Data:', row);
        });
      } else {
        console.log('❌ user_navigation_mode_settings table is empty');
      }
    } catch (e) {
      console.log('❌ user_navigation_mode_settings error:', e.message);
    }
    
    // Look for any navigation mode data
    try {
      const navPrefs = db.exec('SELECT * FROM user_navigation_preferences');
      if (navPrefs.length > 0) {
        console.log('\n📋 Current user_navigation_preferences:');
        console.log('Columns:', navPrefs[0].columns);
        navPrefs[0].values.forEach(row => {
          console.log('Data:', row);
        });
      }
    } catch (e) {
      console.log('❌ user_navigation_preferences error:', e.message);
    }
    
    db.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();