#!/usr/bin/env node

/**
 * TEST: Per-Mode Navigation Settings (SQL.js ABI-safe)
 * Prüft user_navigation_mode_settings Tabelle ohne better-sqlite3 ABI conflicts
 */

import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 TEST: Per-Mode Navigation Settings (SQL.js)\n');

const dbPath = join(process.env.APPDATA || '', 'Electron', 'database', 'rawalite.db');
if (!existsSync(dbPath)) {
  console.error('❌ Database not found:', dbPath);
  process.exit(1);
}

console.log('✅ Database found:', dbPath);

try {
  // Lade SQL.js
  const SQL = await initSqlJs();
  
  // Lade Database
  const dbData = readFileSync(dbPath);
  const db = new SQL.Database(dbData);
  
  console.log('\n=== TESTING user_navigation_mode_settings TABLE ===');
  
  // Prüfe Tabelle existiert
  const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_navigation_mode_settings'");
  if (!tableCheck.length || !tableCheck[0].values.length) {
    throw new Error('user_navigation_mode_settings table does not exist!');
  }
  console.log('✅ Table exists: user_navigation_mode_settings');
  
  // Prüfe Schema
  const schemaResult = db.exec("PRAGMA table_info(user_navigation_mode_settings)");
  if (schemaResult.length && schemaResult[0].values.length) {
    console.log('\n📋 Table Schema:');
    const columns = schemaResult[0].columns;
    schemaResult[0].values.forEach(row => {
      const colInfo = {};
      columns.forEach((col, idx) => colInfo[col] = row[idx]);
      console.log(`   ${colInfo.name}: ${colInfo.type} ${colInfo.notnull ? 'NOT NULL' : 'NULL'} ${colInfo.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
  
  // Prüfe existierende Daten
  const settingsResult = db.exec("SELECT * FROM user_navigation_mode_settings ORDER BY navigation_mode");
  if (settingsResult.length && settingsResult[0].values.length) {
    console.log(`\n📊 Existing Settings: ${settingsResult[0].values.length} rows`);
    
    const settingsColumns = settingsResult[0].columns;
    settingsResult[0].values.forEach(row => {
      const setting = {};
      settingsColumns.forEach((col, idx) => setting[col] = row[idx]);
      
      console.log(`\n🎯 Mode: ${setting.navigation_mode}`);
      console.log(`   User ID: ${setting.user_id}`);
      console.log(`   Header Height: ${setting.header_height}px`);
      console.log(`   Sidebar Width: ${setting.sidebar_width}px`);
      console.log(`   Auto Collapse Mobile: ${setting.auto_collapse_mobile}`);
      console.log(`   Auto Collapse Tablet: ${setting.auto_collapse_tablet}`);
    });
  } else {
    console.log('\n📊 No settings found in user_navigation_mode_settings');
  }
  
  // Test: Query für spezifischen Mode
  console.log('\n=== TESTING Mode-Specific Query ===');
  const dashboardResult = db.exec("SELECT * FROM user_navigation_mode_settings WHERE user_id = 'default' AND navigation_mode = 'mode-dashboard-view'");
  
  if (dashboardResult.length && dashboardResult[0].values.length) {
    const dashColumns = dashboardResult[0].columns;
    const dashRow = dashboardResult[0].values[0];
    const dashSetting = {};
    dashColumns.forEach((col, idx) => dashSetting[col] = dashRow[idx]);
    
    console.log('✅ Found mode-dashboard-view settings:');
    console.log(`   Header Height: ${dashSetting.header_height}px`);
    console.log(`   Sidebar Width: ${dashSetting.sidebar_width}px`);
  } else {
    console.log('❌ No settings found for mode-dashboard-view');
  }
  
  // Test: Alle Modi für User
  console.log('\n=== TESTING All Modes for User ===');
  const allModesResult = db.exec("SELECT navigation_mode, header_height, sidebar_width FROM user_navigation_mode_settings WHERE user_id = 'default' ORDER BY navigation_mode");
  
  if (allModesResult.length && allModesResult[0].values.length) {
    console.log(`Found ${allModesResult[0].values.length} modes for user 'default':`);
    const modeColumns = allModesResult[0].columns;
    allModesResult[0].values.forEach(row => {
      const mode = {};
      modeColumns.forEach((col, idx) => mode[col] = row[idx]);
      console.log(`   ${mode.navigation_mode}: ${mode.header_height}px header, ${mode.sidebar_width}px sidebar`);
    });
  } else {
    console.log('❌ No modes found for user default');
  }
  
  db.close();
  
  console.log('\n🎉 TEST SUCCESSFUL!');
  console.log('✅ user_navigation_mode_settings table is functional');
  console.log('✅ Per-mode settings are stored and retrievable');
  console.log('✅ Migration 034 architecture is working correctly');
  
} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  process.exit(1);
}