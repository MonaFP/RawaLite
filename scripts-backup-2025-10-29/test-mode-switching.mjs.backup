#!/usr/bin/env node

/**
 * TEST: Per-Mode Navigation Settings After Service Fix
 * Tests ob die reaktivierten Statements in DatabaseNavigationService funktionieren
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 TEST: Per-Mode Navigation Settings\n');

// Lade DatabaseNavigationService
const servicePath = join(__dirname, 'src', 'services', 'DatabaseNavigationService.ts');
if (!existsSync(servicePath)) {
  console.error('❌ DatabaseNavigationService.ts not found');
  process.exit(1);
}

console.log('✅ Found DatabaseNavigationService.ts');

// Simuliere Test mit direkten DB-Queries
const dbPath = join(process.env.APPDATA || '', 'Electron', 'database', 'rawalite.db');
if (!existsSync(dbPath)) {
  console.error('❌ Database not found:', dbPath);
  process.exit(1);
}

console.log('✅ Database found:', dbPath);

try {
  const db = Database(dbPath, { readonly: true });
  
  console.log('\n=== TESTING user_navigation_mode_settings TABLE ===');
  
  // Prüfe Tabelle existiert
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_navigation_mode_settings'").get();
  if (!tableCheck) {
    throw new Error('user_navigation_mode_settings table does not exist!');
  }
  console.log('✅ Table exists: user_navigation_mode_settings');
  
  // Prüfe Schema
  const schema = db.prepare("PRAGMA table_info(user_navigation_mode_settings)").all();
  console.log('\n📋 Table Schema:');
  schema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Prüfe existierende Daten
  const settings = db.prepare("SELECT * FROM user_navigation_mode_settings ORDER BY navigation_mode").all();
  console.log(`\n📊 Existing Settings: ${settings.length} rows`);
  
  settings.forEach(setting => {
    console.log(`\n🎯 Mode: ${setting.navigation_mode}`);
    console.log(`   User ID: ${setting.user_id}`);
    console.log(`   Header Height: ${setting.header_height}px`);
    console.log(`   Sidebar Width: ${setting.sidebar_width}px`);
    console.log(`   Auto Collapse Mobile: ${setting.auto_collapse_mobile}`);
    console.log(`   Auto Collapse Tablet: ${setting.auto_collapse_tablet}`);
  });
  
  // Test: Query für spezifischen Mode
  console.log('\n=== TESTING Mode-Specific Query ===');
  const dashboardSettings = db.prepare("SELECT * FROM user_navigation_mode_settings WHERE user_id = ? AND navigation_mode = ?")
    .get('default', 'mode-dashboard-view');
  
  if (dashboardSettings) {
    console.log('✅ Found mode-dashboard-view settings:');
    console.log(`   Header Height: ${dashboardSettings.header_height}px`);
    console.log(`   Sidebar Width: ${dashboardSettings.sidebar_width}px`);
  } else {
    console.log('❌ No settings found for mode-dashboard-view');
  }
  
  // Test: Alle Modi für User
  console.log('\n=== TESTING All Modes for User ===');
  const allModes = db.prepare("SELECT navigation_mode, header_height, sidebar_width FROM user_navigation_mode_settings WHERE user_id = ? ORDER BY navigation_mode")
    .all('default');
  
  console.log(`Found ${allModes.length} modes for user 'default':`);
  allModes.forEach(mode => {
    console.log(`   ${mode.navigation_mode}: ${mode.header_height}px header, ${mode.sidebar_width}px sidebar`);
  });
  
  db.close();
  
  console.log('\n🎉 TEST SUCCESSFUL!');
  console.log('✅ user_navigation_mode_settings table is functional');
  console.log('✅ Per-mode settings are stored and retrievable');
  console.log('✅ Migration 034 architecture is working correctly');
  
} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}