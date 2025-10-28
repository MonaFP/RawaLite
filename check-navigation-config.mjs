// Quick Navigation Configuration Analysis (sql.js fallback)
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

console.log('🔍 Analyzing Navigation Configuration...\n');

try {
  const SQL = await initSqlJs();
  const data = readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('=== CURRENT NAVIGATION CONFIG ===');
  const nav = db.exec('SELECT navigation_mode, header_height FROM user_navigation_preferences WHERE user_id = "default"');
  if (nav[0]) {
    nav[0].values.forEach(row => {
      console.log(`Mode: ${row[0]} -> Height: ${row[1]}px`);
    });
  }
  
  console.log('\n=== MODE-SPECIFIC SETTINGS ===');
  const modeSettings = db.exec('SELECT navigation_mode, header_height FROM user_navigation_mode_settings WHERE user_id = "default"');
  if (modeSettings[0] && modeSettings[0].values.length > 0) {
    modeSettings[0].values.forEach(row => {
      console.log(`Mode: ${row[0]} -> Height: ${row[1]}px`);
    });
  } else {
    console.log('⚠️  No per-mode settings found!');
  }
  
  db.close();
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('- Check if global setting overrides mode-specific settings');
  console.log('- Layout problems: dashboard view & data panel need fixing');
  
} catch (error) {
  console.error('Database analysis failed:', error.message);
}