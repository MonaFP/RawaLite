#!/usr/bin/env node

// Fix NULL grid settings in database
import { readFileSync, writeFileSync } from 'fs';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
const data = readFileSync(dbPath);
const db = new SQL.Database(data);

console.log('🔧 Fixing NULL grid settings for mode-data-panel...');

try {
  // Update the current user settings with proper grid values
  const updateQuery = `
    UPDATE user_navigation_mode_settings 
    SET 
      grid_template_columns = '280px 1fr',
      grid_template_rows = '60px 160px 1fr 40px',
      grid_template_areas = '"logo header" "sidebar header" "sidebar main" ". footer"'
    WHERE user_id = 'default' AND navigation_mode = 'mode-data-panel'
  `;
  
  db.run(updateQuery);
  console.log('✅ Updated mode-data-panel grid settings');
  
  // Also update user_navigation_preferences to use correct mode
  const updatePrefQuery = `
    UPDATE user_navigation_preferences 
    SET navigation_mode = 'mode-data-panel'
    WHERE user_id = 'default' AND navigation_mode = 'header-navigation'
  `;
  
  db.run(updatePrefQuery);
  console.log('✅ Updated navigation preferences to use mode-data-panel');
  
  // Verify the changes
  const result = db.exec('SELECT * FROM user_navigation_mode_settings WHERE navigation_mode = "mode-data-panel"');
  if (result.length > 0) {
    console.log('\n📊 Updated settings:');
    const obj = result[0].columns.reduce((acc, col, idx) => {
      acc[col] = result[0].values[0][idx];
      return acc;
    }, {});
    console.log(obj);
  }
  
  // Write back to file
  const updatedData = db.export();
  writeFileSync(dbPath, updatedData);
  console.log('\n✅ Database updated successfully!');
  
} catch (e) {
  console.error('❌ Error updating database:', e.message);
}

db.close();