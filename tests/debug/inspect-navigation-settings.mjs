// 🔍 Navigation Settings Specific Inspector
// Extended debug script to inspect navigation-specific tables

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'node:module';
const requireModule = createRequire(import.meta.url);

async function inspectNavigationSettings() {
  console.log('🧭 Navigation Settings Inspector');
  console.log('📦 Using sql.js (ABI-independent)\n');

  try {
    const initSqlJs = requireModule('sql.js');
    const SQL = await initSqlJs();
    
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'rawalite', 'database', 'rawalite.db');
    console.log('📍 Database path:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database not found');
      return;
    }

    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    console.log('✅ Database loaded successfully\n');

    // === USER NAVIGATION PREFERENCES ===
    console.log('=== USER NAVIGATION PREFERENCES ===');
    try {
      const prefsResult = db.exec('SELECT * FROM user_navigation_preferences');
      
      if (prefsResult.length > 0 && prefsResult[0].values.length > 0) {
        const prefs = prefsResult[0].values.map(row => {
          const columns = prefsResult[0].columns;
          const pref = {};
          columns.forEach((col, idx) => pref[col] = row[idx]);
          return pref;
        });
        
        console.log('Found navigation preferences:', prefs.length);
        prefs.forEach(pref => {
          console.log(`User ${pref.user_id}:`);
          console.log(`  Navigation Mode: ${pref.navigation_mode}`);
          console.log(`  Header Height: ${pref.header_height}px`);
          console.log(`  Sidebar Width: ${pref.sidebar_width}px`);
          console.log(`  Auto Collapse: ${pref.auto_collapse}`);
          console.log(`  Remember Focus: ${pref.remember_focus_mode}`);
          console.log(`  Created: ${pref.created_at}`);
          console.log(`  Updated: ${pref.updated_at}\n`);
        });
      } else {
        console.log('❌ No navigation preferences found');
      }
    } catch (error) {
      console.log('❌ Navigation preferences check failed:', error.message);
    }

    // === USER NAVIGATION MODE SETTINGS (Per-Mode) ===
    console.log('=== USER NAVIGATION MODE SETTINGS (Per-Mode) ===');
    try {
      const modeSettingsResult = db.exec('SELECT * FROM user_navigation_mode_settings ORDER BY navigation_mode');
      
      if (modeSettingsResult.length > 0 && modeSettingsResult[0].values.length > 0) {
        const modeSettings = modeSettingsResult[0].values.map(row => {
          const columns = modeSettingsResult[0].columns;
          const setting = {};
          columns.forEach((col, idx) => setting[col] = row[idx]);
          return setting;
        });
        
        console.log('Found per-mode settings:', modeSettings.length);
        modeSettings.forEach(setting => {
          console.log(`Mode: ${setting.navigation_mode}`);
          console.log(`  User ID: ${setting.user_id}`);
          console.log(`  Header Height: ${setting.header_height}px`);
          console.log(`  Sidebar Width: ${setting.sidebar_width}px`);
          console.log(`  Auto Collapse Mobile: ${setting.auto_collapse_mobile}`);
          console.log(`  Auto Collapse Tablet: ${setting.auto_collapse_tablet}`);
          console.log(`  Grid Template Columns: ${setting.grid_template_columns || 'null'}`);
          console.log(`  Grid Template Rows: ${setting.grid_template_rows || 'null'}`);
          console.log(`  Grid Template Areas: ${setting.grid_template_areas || 'null'}`);
          console.log(`  Created: ${setting.created_at}`);
          console.log(`  Updated: ${setting.updated_at}\n`);
        });
      } else {
        console.log('❌ No per-mode settings found');
      }
    } catch (error) {
      console.log('❌ Mode settings check failed:', error.message);
    }

    // === NAVIGATION MODE HISTORY ===
    console.log('=== NAVIGATION MODE HISTORY (Recent 5) ===');
    try {
      const historyResult = db.exec(`
        SELECT * FROM navigation_mode_history 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (historyResult.length > 0 && historyResult[0].values.length > 0) {
        const history = historyResult[0].values.map(row => {
          const columns = historyResult[0].columns;
          const entry = {};
          columns.forEach((col, idx) => entry[col] = row[idx]);
          return entry;
        });
        
        console.log('Recent navigation mode changes:');
        history.forEach(entry => {
          console.log(`${entry.created_at}: ${entry.previous_mode || 'initial'} → ${entry.new_mode} (User: ${entry.user_id})`);
        });
      } else {
        console.log('❌ No navigation history found');
      }
    } catch (error) {
      console.log('❌ History check failed:', error.message);
    }

    // === TABLE SCHEMAS ===
    console.log('\n=== TABLE SCHEMAS ===');
    const tables = ['user_navigation_preferences', 'user_navigation_mode_settings'];
    
    for (const tableName of tables) {
      try {
        console.log(`\n--- Schema for ${tableName} ---`);
        const schemaResult = db.exec(`PRAGMA table_info(${tableName})`);
        
        if (schemaResult.length > 0 && schemaResult[0].values.length > 0) {
          schemaResult[0].values.forEach(([cid, name, type, notnull, dflt_value, pk]) => {
            console.log(`  ${name}: ${type}${notnull ? ' NOT NULL' : ''}${dflt_value ? ` DEFAULT ${dflt_value}` : ''}${pk ? ' PRIMARY KEY' : ''}`);
          });
        }
      } catch (error) {
        console.log(`❌ Schema check for ${tableName} failed:`, error.message);
      }
    }

    db.close();
    console.log('\n✅ Navigation settings inspection completed');

  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

inspectNavigationSettings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});