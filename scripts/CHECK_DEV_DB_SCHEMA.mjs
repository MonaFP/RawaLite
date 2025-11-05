#!/usr/bin/env node
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.env.APPDATA, 'Electron', 'database', 'rawalite-dev.db');
console.log('Checking:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  const version = db.prepare('PRAGMA user_version').get();
  console.log('Schema Version:', version.user_version);
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%navigation%'
  `).all();
  
  console.log('\nNavigation tables:', tables.map(t => t.name));
  
  // Check if user_navigation_mode_settings exists
  const modeTable = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user_navigation_mode_settings'
  `).get();
  
  if (modeTable) {
    console.log('\n✅ user_navigation_mode_settings EXISTS');
    
    const columns = db.pragma('table_info(user_navigation_mode_settings)');
    console.log('Columns:', columns.map(c => c.name));
  } else {
    console.log('\n❌ user_navigation_mode_settings MISSING!');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
