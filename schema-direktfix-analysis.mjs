#!/usr/bin/env node

import sql from 'sql.js';
import fs from 'fs';

// Load database
const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
const data = fs.readFileSync(dbPath);
const db = new sql.Database(data);

console.log('🔍 SCHEMA DIREKTFIX - PRE-ANALYSIS');
console.log('===================================');

// 1. Check Navigation Mode Settings
console.log('\n1️⃣ NAVIGATION MODE SETTINGS:');
try {
  const navSettings = db.exec('SELECT * FROM user_navigation_mode_settings ORDER BY mode_name');
  if (navSettings.length > 0) {
    console.log('Mode Settings found:');
    navSettings[0].values.forEach(row => {
      const [id, mode, userId, gridAreas, gridCols, gridRows, createdAt] = row;
      console.log(`   ${mode}: areas=${gridAreas ? 'SET' : 'NULL'}, cols=${gridCols ? 'SET' : 'NULL'}, rows=${gridRows ? 'SET' : 'NULL'}`);
    });
  } else {
    console.log('   No navigation mode settings found');
  }
} catch (e) {
  console.log('   ERROR:', e.message);
}

// 2. Check Theme Schema
console.log('\n2️⃣ THEME SCHEMA:');
try {
  const themeSchema = db.exec('PRAGMA table_info(themes)');
  if (themeSchema.length > 0) {
    console.log('Theme table columns:');
    themeSchema[0].values.forEach(row => {
      console.log(`   ${row[1]} (${row[2]})`);
    });
    
    // Check for display_name specifically
    const hasDisplayName = themeSchema[0].values.some(row => row[1] === 'display_name');
    console.log(`\n   display_name column: ${hasDisplayName ? '✅ EXISTS' : '❌ MISSING'}`);
  }
} catch (e) {
  console.log('   ERROR:', e.message);
}

// 3. Check Footer Content Preferences
console.log('\n3️⃣ FOOTER CONTENT PREFERENCES:');
try {
  const footerPrefs = db.exec('SELECT * FROM user_footer_content_preferences LIMIT 3');
  if (footerPrefs.length > 0) {
    console.log(`   Found ${footerPrefs[0].values.length} footer preferences`);
  } else {
    console.log('   No footer preferences found');
  }
} catch (e) {
  console.log('   ERROR:', e.message);
}

// 4. Current Schema Version
console.log('\n4️⃣ SCHEMA VERSION:');
try {
  const version = db.exec('PRAGMA user_version')[0]?.values[0][0] || 0;
  console.log(`   Current: ${version}`);
} catch (e) {
  console.log('   ERROR:', e.message);
}

// 5. Check tables existence
console.log('\n5️⃣ REQUIRED TABLES:');
const requiredTables = [
  'user_navigation_mode_settings',
  'user_footer_content_preferences', 
  'themes',
  'theme_colors',
  'user_theme_preferences'
];

requiredTables.forEach(table => {
  try {
    const check = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
    const exists = check.length > 0 && check[0].values.length > 0;
    console.log(`   ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  } catch (e) {
    console.log(`   ${table}: ❌ ERROR - ${e.message}`);
  }
});

db.close();
console.log('\n✅ Pre-analysis complete');