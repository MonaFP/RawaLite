#!/usr/bin/env node
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(process.env.APPDATA || '', 'Electron', 'database', 'rawalite.db');

try {
  console.log(`📂 Database path: ${dbPath}`);
  const db = new Database(dbPath);
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`\n✅ Database connected, ${tables.length} tables found:`);
  tables.forEach(t => console.log(`   - ${t.name}`));
  
  // Check navigation preferences
  const navPrefs = db.prepare('SELECT COUNT(*) as count FROM user_navigation_preferences').all();
  console.log(`\n📍 Navigation preferences: ${navPrefs[0].count} records`);
  
  // Check themes
  const themesCount = db.prepare('SELECT COUNT(*) as count FROM themes').all();
  console.log(`🎨 Themes table: ${themesCount[0].count} records`);
  
  // Check theme_colors
  const themeColorsCount = db.prepare('SELECT COUNT(*) as count FROM theme_colors').all();
  console.log(`🎨 Theme colors: ${themeColorsCount[0].count} records`);
  
  // Check settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').all();
  console.log(`⚙️ Settings: ${settingsCount[0].count} records`);
  
  // Check one navigation setting sample
  const sample = db.prepare('SELECT * FROM user_navigation_preferences LIMIT 1').all();
  if (sample.length > 0) {
    console.log('\n📋 Sample navigation preference:');
    console.log(`   Mode: ${sample[0].mode}`);
    console.log(`   Header Height: ${sample[0].header_height}px`);
  }
  
  db.close();
  console.log('\n✅ Database verification complete');
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}
