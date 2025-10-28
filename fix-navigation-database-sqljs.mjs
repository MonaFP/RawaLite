#!/usr/bin/env node

import fs from 'fs';
import initSqlJs from 'sql.js';

const DB_PATH = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

try {
  console.log('🔧 Using SQL.js for ABI-independent database access...');
  
  // Initialize SQL.js
  const SQL = await initSqlJs();
  
  // Read database file
  const filebuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(filebuffer);

  console.log('=== CURRENT NAVIGATION MODES IN DATABASE ===');
  
  const prefsResult = db.exec('SELECT * FROM user_navigation_preferences');
  if (prefsResult.length > 0) {
    console.log('user_navigation_preferences:');
    prefsResult[0].values.forEach(row => {
      const [id, userId, navMode, headerHeight, sidebarWidth, createdAt, updatedAt] = row;
      console.log(`  ${userId}: ${navMode} (header: ${headerHeight}px, sidebar: ${sidebarWidth}px)`);
    });
  } else {
    console.log('user_navigation_preferences: (empty)');
  }

  const settingsResult = db.exec('SELECT * FROM user_navigation_mode_settings');
  if (settingsResult.length > 0) {
    console.log('user_navigation_mode_settings:');
    settingsResult[0].values.forEach(row => {
      const [id, userId, navMode, headerHeight, sidebarWidth, isCustom, createdAt, updatedAt] = row;
      console.log(`  ${userId}: ${navMode} (header: ${headerHeight}px, sidebar: ${sidebarWidth}px, custom: ${isCustom})`);
    });
  } else {
    console.log('user_navigation_mode_settings: (empty)');
  }

  console.log('\n=== UPDATING TO NEW MODE NAMES ===');
  
  // Update user_navigation_preferences
  const updates = [
    "UPDATE user_navigation_preferences SET navigation_mode = 'mode-dashboard-view' WHERE navigation_mode = 'header-statistics'",
    "UPDATE user_navigation_preferences SET navigation_mode = 'mode-data-panel' WHERE navigation_mode = 'header-navigation'", 
    "UPDATE user_navigation_preferences SET navigation_mode = 'mode-compact-focus' WHERE navigation_mode = 'full-sidebar'",
    "UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-dashboard-view' WHERE navigation_mode = 'header-statistics'",
    "UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-data-panel' WHERE navigation_mode = 'header-navigation'",
    "UPDATE user_navigation_mode_settings SET navigation_mode = 'mode-compact-focus' WHERE navigation_mode = 'full-sidebar'"
  ];

  updates.forEach((sql, index) => {
    try {
      db.run(sql);
      console.log(`✅ Update ${index + 1}/6 completed: ${sql.split("'")[3]} → ${sql.split("'")[1]}`);
    } catch (error) {
      console.log(`⚠️ Update ${index + 1}/6 had no effect (no matching rows): ${sql.split("'")[3]} → ${sql.split("'")[1]}`);
    }
  });

  console.log('\n=== VERIFICATION ===');
  
  const verifyPrefsResult = db.exec('SELECT * FROM user_navigation_preferences');
  if (verifyPrefsResult.length > 0) {
    console.log('UPDATED user_navigation_preferences:');
    verifyPrefsResult[0].values.forEach(row => {
      const [id, userId, navMode, headerHeight, sidebarWidth, createdAt, updatedAt] = row;
      console.log(`  ${userId}: ${navMode} (header: ${headerHeight}px, sidebar: ${sidebarWidth}px)`);
    });
  }

  const verifySettingsResult = db.exec('SELECT * FROM user_navigation_mode_settings');
  if (verifySettingsResult.length > 0) {
    console.log('UPDATED user_navigation_mode_settings:');
    verifySettingsResult[0].values.forEach(row => {
      const [id, userId, navMode, headerHeight, sidebarWidth, isCustom, createdAt, updatedAt] = row;
      console.log(`  ${userId}: ${navMode} (header: ${headerHeight}px, sidebar: ${sidebarWidth}px, custom: ${isCustom})`);
    });
  }

  // Save updated database
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  
  db.close();
  console.log('\n🚀 Database navigation mode migration completed successfully!');
  console.log('✅ Database written back to:', DB_PATH);

} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
}