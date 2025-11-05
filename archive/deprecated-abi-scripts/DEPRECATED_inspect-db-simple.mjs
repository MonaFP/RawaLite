import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const dbPath = join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
console.log('🔍 Database path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('\n=== NAVIGATION MODE SETTINGS ===');
  const navSettings = db.prepare('SELECT * FROM user_navigation_mode_settings').all();
  navSettings.forEach(row => {
    console.log(JSON.stringify(row, null, 2));
  });

  console.log('\n=== NAVIGATION PREFERENCES ===');
  const navPrefs = db.prepare('SELECT * FROM user_navigation_preferences').all();
  navPrefs.forEach(row => {
    console.log(JSON.stringify(row, null, 2));
  });

  console.log('\n=== THEME OVERRIDES ===');
  try {
    const themeOverrides = db.prepare('SELECT * FROM theme_overrides').all();
    themeOverrides.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
  } catch (e) {
    console.log('No theme_overrides table or error:', e.message);
  }

  console.log('\n=== FOCUS MODE PREFERENCES ===');
  try {
    const focusPrefs = db.prepare('SELECT * FROM user_focus_mode_preferences').all();
    focusPrefs.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
  } catch (e) {
    console.log('No focus_mode_preferences table or error:', e.message);
  }

  db.close();
} catch (error) {
  console.error('❌ Database error:', error.message);
}