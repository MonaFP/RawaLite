import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
const db = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));

console.log('🎯 NAVIGATION ANALYSIS');
console.log('======================');

// User navigation preferences
console.log('\n📐 User Navigation Preferences:');
try {
  const prefs = db.exec('SELECT * FROM user_navigation_preferences WHERE user_id = "default"');
  if (prefs.length > 0 && prefs[0].values.length > 0) {
    console.log('  Found:', prefs[0].values);
  } else {
    console.log('  ❌ No navigation preferences found');
  }
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

// User navigation mode settings  
console.log('\n🎛️ User Navigation Mode Settings:');
try {
  const modeSettings = db.exec('SELECT * FROM user_navigation_mode_settings WHERE user_id = "default"');
  if (modeSettings.length > 0 && modeSettings[0].values.length > 0) {
    console.log('  Found settings for modes:');
    modeSettings[0].values.forEach(row => {
      console.log('    -', row[2], '(Mode)', 'HeaderHeight:', row[3], 'SidebarWidth:', row[4]);
    });
  } else {
    console.log('  ❌ No mode-specific settings found');
  }
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

// Footer preferences
console.log('\n👣 Footer Content Preferences:');
try {
  const footerPrefs = db.exec('SELECT * FROM user_footer_content_preferences WHERE user_id = "default"');
  if (footerPrefs.length > 0 && footerPrefs[0].values.length > 0) {
    console.log('  Found:', footerPrefs[0].values);
  } else {
    console.log('  ❌ No footer preferences found');
  }
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

// Current settings
console.log('\n⚙️ General Settings:');
try {
  const settings = db.exec('SELECT * FROM settings WHERE id = 1');
  if (settings.length > 0 && settings[0].values.length > 0) {
    console.log('  Settings:', settings[0].values[0]);
  }
} catch (e) {
  console.log('  ❌ Error:', e.message);
}

db.close();