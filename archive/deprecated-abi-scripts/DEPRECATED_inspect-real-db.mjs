import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Correct database path for Electron
const dbPath = join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('🔍 Real Database Inspector');
console.log(`📂 Database path: ${dbPath}`);

if (!existsSync(dbPath)) {
  console.log('❌ Database not found!');
  process.exit(1);
}

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('✅ Database connected successfully');
  
  // Check schema version
  const versionResult = db.prepare('PRAGMA user_version').get();
  console.log(`📊 Schema version: ${versionResult.user_version}`);
  
  // List all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n📋 Tables in database:');
  tables.forEach(table => console.log(`   - ${table.name}`));
  
  // Check user_navigation_preferences table
  console.log('\n🎯 user_navigation_preferences table schema:');
  const navSchema = db.prepare("PRAGMA table_info(user_navigation_preferences)").all();
  navSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Check current navigation preferences
  console.log('\n📊 Current navigation preferences:');
  const navPrefs = db.prepare("SELECT * FROM user_navigation_preferences").all();
  navPrefs.forEach(pref => {
    console.log(`   User: ${pref.user_id}`);
    console.log(`   Mode: ${pref.navigation_mode}`);
    console.log(`   Header Height: ${pref.header_height}px`);
    console.log(`   Sidebar Width: ${pref.sidebar_width}px`);
    console.log(`   Auto Collapse: ${pref.auto_collapse}`);
    console.log(`   ---`);
  });
  
  // Check if user_navigation_mode_settings table exists
  try {
    console.log('\n🎯 user_navigation_mode_settings table schema:');
    const modeSchema = db.prepare("PRAGMA table_info(user_navigation_mode_settings)").all();
    if (modeSchema.length > 0) {
      modeSchema.forEach(col => {
        console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      
      // Check mode-specific settings
      console.log('\n📊 Per-mode navigation settings:');
      const modeSettings = db.prepare("SELECT * FROM user_navigation_mode_settings").all();
      modeSettings.forEach(setting => {
        console.log(`   User: ${setting.user_id}, Mode: ${setting.navigation_mode}`);
        console.log(`   Header Height: ${setting.header_height}px`);
        console.log(`   Sidebar Width: ${setting.sidebar_width}px`);
        console.log(`   ---`);
      });
    }
  } catch (e) {
    console.log('\n⚠️ user_navigation_mode_settings table not found (normal if migrations 034+ not applied)');
  }
  
  db.close();
  console.log('\n✅ Database inspection complete');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}