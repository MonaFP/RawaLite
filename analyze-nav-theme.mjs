#!/usr/bin/env node

// Analyze Navigation Modes vs Themes separately
import { readFileSync } from 'fs';
import { join } from 'path';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
const data = readFileSync(dbPath);
const db = new SQL.Database(data);

console.log('🎯 NAVIGATION MODES vs THEMES Analysis:');
console.log('='.repeat(60));

console.log('\n📊 1. Navigation Mode Settings (user_navigation_mode_settings):');
try {
  const navSettings = db.exec('SELECT * FROM user_navigation_mode_settings');
  if (navSettings.length > 0) {
    console.log('Columns:', navSettings[0].columns);
    navSettings[0].values.forEach((row, i) => {
      const obj = navSettings[0].columns.reduce((acc, col, idx) => {
        acc[col] = row[idx];
        return acc;
      }, {});
      console.log(`Row ${i + 1}:`, obj);
    });
  } else {
    console.log('❌ Table empty or no results');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

console.log('\n📊 2. Navigation Preferences (user_navigation_preferences):');
try {
  const navPrefs = db.exec('SELECT * FROM user_navigation_preferences');
  if (navPrefs.length > 0) {
    console.log('Columns:', navPrefs[0].columns);
    navPrefs[0].values.forEach((row, i) => {
      const obj = navPrefs[0].columns.reduce((acc, col, idx) => {
        acc[col] = row[idx];
        return acc;
      }, {});
      console.log(`Row ${i + 1}:`, obj);
    });
  } else {
    console.log('❌ Table empty or no results');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

console.log('\n🎨 3. Theme Preferences (user_theme_preferences):');
try {
  const themePrefs = db.exec('SELECT * FROM user_theme_preferences');
  if (themePrefs.length > 0) {
    console.log('Columns:', themePrefs[0].columns);
    themePrefs[0].values.forEach((row, i) => {
      const obj = themePrefs[0].columns.reduce((acc, col, idx) => {
        acc[col] = row[idx];
        return acc;
      }, {});
      console.log(`Row ${i + 1}:`, obj);
    });
  } else {
    console.log('❌ Table empty or no results');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

console.log('\n🎨 4. Available Themes:');
try {
  const themes = db.exec('SELECT id, name, theme_key, display_name, is_active FROM themes ORDER BY id');
  if (themes.length > 0) {
    console.log('All themes:');
    themes[0].values.forEach((row) => {
      const [id, name, theme_key, display_name, is_active] = row;
      console.log(`  ${id}: ${theme_key} (${display_name}) - Active: ${is_active}`);
    });
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

// Look for CSS Grid related settings
console.log('\n🔧 5. CSS Grid Settings Check:');
try {
  const gridCheck = db.exec(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND (
      name LIKE '%grid%' OR 
      name LIKE '%layout%' OR 
      name LIKE '%navigation%'
    )
  `);
  if (gridCheck.length > 0) {
    console.log('Grid/Layout related tables:');
    gridCheck[0].values.forEach(([name]) => {
      console.log(`  - ${name}`);
    });
  } else {
    console.log('❌ No grid/layout specific tables found');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

db.close();
console.log('\n✅ Analysis complete!');