import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database path
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('🔍 Footer Debug: Navigation Mode Analysis (SQL.js)');
console.log('==================================================');
console.log(`📂 Database: ${dbPath}`);

try {
  // Initialize sql.js
  const SQL = await initSqlJs();
  
  // Load database with sql.js
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Check table schemas first
  console.log('\n� Table Schemas:');
  console.log('------------------');
  
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%navigation%'");
  if (tables[0]?.values) {
    tables[0].values.forEach(row => {
      const tableName = row[0];
      console.log(`\n🔍 ${tableName} schema:`);
      const schema = db.exec(`PRAGMA table_info(${tableName})`);
      if (schema[0]?.values) {
        schema[0].values.forEach(col => {
          console.log(`   ${col[1]} (${col[2]})`);
        });
      }
    });
  }

  console.log('\n📊 Navigation Mode History:');
  console.log('-----------------------------');
  const historyResult = db.exec(`
    SELECT id, user_id, previous_mode, new_mode, changed_at, session_id
    FROM navigation_mode_history 
    ORDER BY changed_at DESC LIMIT 20
  `);
  
  if (historyResult[0]?.values) {
    historyResult[0].values.forEach(row => {
      const [id, user_id, prev_mode, new_mode, changed_at, session_id] = row;
      console.log(`🔄 ID ${id}: ${prev_mode} → ${new_mode} (${changed_at})`);
      
      // Check for invalid modes
      const allModes = [prev_mode, new_mode].filter(m => m);
      const validModes = ['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'];
      allModes.forEach(mode => {
        if (mode && !validModes.includes(mode)) {
          console.log(`   ⚠️  INVALID MODE: ${mode}`);
        }
      });
    });
  }

  console.log('\n📊 User Navigation Mode Settings:');
  console.log('----------------------------------');
  const settingsResult = db.exec(`
    SELECT id, navigation_mode, grid_template_areas, grid_template_columns, grid_template_rows 
    FROM user_navigation_mode_settings 
    ORDER BY id
  `);
  
  if (settingsResult[0]?.values) {
    settingsResult[0].values.forEach(row => {
      const [id, mode_name, grid_areas, grid_cols, grid_rows] = row;
      console.log(`🎛️  ID ${id}: ${mode_name}`);
      console.log(`   Grid Areas: ${grid_areas}`);
      console.log(`   Has Footer: ${grid_areas && grid_areas.includes('footer') ? '✅' : '❌'}`);
    });
  }

  console.log('\n📊 User Footer Content Preferences:');
  console.log('------------------------------------');
  const footerResult = db.exec(`
    SELECT navigation_mode, show_version_info, show_statistics, show_quick_actions 
    FROM user_footer_content_preferences 
    ORDER BY navigation_mode
  `);
  
  if (footerResult[0]?.values) {
    footerResult[0].values.forEach(row => {
      const [mode, version, stats, actions] = row;
      console.log(`👣 ${mode}: version=${version}, stats=${stats}, actions=${actions}`);
    });
  }

  console.log('\n🔍 LEGACY MODE DETECTION:');
  console.log('-------------------------');
  const validModes = ['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'];
  const legacyModes = [];
  
  if (historyResult[0]?.values) {
    historyResult[0].values.forEach(row => {
      const [id, user_id, prev_mode, new_mode] = row;
      if (prev_mode && !validModes.includes(prev_mode)) {
        legacyModes.push({id, mode_name: prev_mode, type: 'previous'});
      }
      if (new_mode && !validModes.includes(new_mode)) {
        legacyModes.push({id, mode_name: new_mode, type: 'new'});
      }
    });
  }
  
  if (legacyModes.length > 0) {
    console.log(`⚠️  Found ${legacyModes.length} legacy navigation mode entries:`);
    legacyModes.forEach(mode => {
      console.log(`   - ID ${mode.id}: "${mode.mode_name}" (${mode.type})`);
    });
  } else {
    console.log('✅ No legacy navigation modes found');
  }

  db.close();
  console.log('\n✅ Analysis complete!');

} catch (error) {
  console.error('❌ Error analyzing database:', error.message);
  process.exit(1);
}