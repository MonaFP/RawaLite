#!/usr/bin/env node

import Database from 'better-sqlite3';

const DB_PATH = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

try {
  const db = new Database(DB_PATH);

  console.log('=== CURRENT NAVIGATION MODES IN DATABASE ===');
  const prefs = db.prepare('SELECT * FROM user_navigation_preferences').all();
  console.log('user_navigation_preferences:', prefs);

  const settings = db.prepare('SELECT * FROM user_navigation_mode_settings').all();  
  console.log('user_navigation_mode_settings:', settings);

  console.log('\n=== UPDATING TO NEW MODE NAMES ===');
  
  // Update user_navigation_preferences
  const updatePrefs1 = db.prepare("UPDATE user_navigation_preferences SET navigation_mode = 'mode-dashboard-view' WHERE navigation_mode = 'header-statistics'");
  const result1 = updatePrefs1.run();
  console.log('✅ Updated header-statistics → mode-dashboard-view:', result1.changes, 'rows');

  const updatePrefs2 = db.prepare("UPDATE user_navigation_preferences SET navigation_mode = 'mode-data-panel' WHERE navigation_mode = 'header-navigation'");
  const result2 = updatePrefs2.run();
  console.log('✅ Updated header-navigation → mode-data-panel:', result2.changes, 'rows');

  const updatePrefs3 = db.prepare("UPDATE user_navigation_preferences SET navigation_mode = 'mode-compact-focus' WHERE navigation_mode = 'full-sidebar'");
  const result3 = updatePrefs3.run();
  console.log('✅ Updated full-sidebar → mode-compact-focus:', result3.changes, 'rows');

  // Update user_navigation_mode_settings 
  const updateSettings1 = db.prepare("UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-dashboard-view' WHERE navigation_mode = 'header-statistics'");
  const result4 = updateSettings1.run();
  console.log('✅ Updated settings header-statistics → mode-dashboard-view:', result4.changes, 'rows');

  const updateSettings2 = db.prepare("UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-data-panel' WHERE navigation_mode = 'header-navigation'");
  const result5 = updateSettings2.run();
  console.log('✅ Updated settings header-navigation → mode-data-panel:', result5.changes, 'rows');

  const updateSettings3 = db.prepare("UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-compact-focus' WHERE navigation_mode = 'full-sidebar'");
  const result6 = updateSettings3.run();
  console.log('✅ Updated settings full-sidebar → mode-compact-focus:', result6.changes, 'rows');

  console.log('\n=== VERIFICATION ===');
  const updatedPrefs = db.prepare('SELECT * FROM user_navigation_preferences').all();
  console.log('UPDATED user_navigation_preferences:', updatedPrefs);

  const updatedSettings = db.prepare('SELECT * FROM user_navigation_mode_settings').all();
  console.log('UPDATED user_navigation_mode_settings:', updatedSettings);

  db.close();
  console.log('\n🚀 Database navigation mode migration completed successfully!');

} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
}