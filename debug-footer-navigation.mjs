import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find correct database path
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('🔍 Footer Debug: Navigation Mode Analysis');
console.log('=====================================================');
console.log(`📂 Database: ${dbPath}`);

try {
  const db = new Database(dbPath, { readonly: true });

  console.log('\n📊 Navigation Mode History:');
  console.log('-----------------------------');
  const history = db.prepare(`
    SELECT id, user_id, mode_name, started_at, ended_at, session_duration_seconds 
    FROM navigation_mode_history 
    ORDER BY started_at DESC LIMIT 20
  `).all();
  
  history.forEach(entry => {
    const status = entry.ended_at ? '✅' : '🔄';
    console.log(`${status} ID ${entry.id}: ${entry.mode_name} (${entry.started_at || 'unknown'})`);
    if (!['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'].includes(entry.mode_name)) {
      console.log(`   ⚠️  INVALID MODE: ${entry.mode_name}`);
    }
  });

  console.log('\n📊 User Navigation Mode Settings:');
  console.log('----------------------------------');
  const settings = db.prepare(`
    SELECT id, mode_name, grid_template_areas, grid_template_columns, grid_template_rows 
    FROM user_navigation_mode_settings 
    ORDER BY id
  `).all();
  
  settings.forEach(setting => {
    console.log(`🎛️  ID ${setting.id}: ${setting.mode_name}`);
    console.log(`   Grid Areas: ${setting.grid_template_areas}`);
    console.log(`   Has Footer: ${setting.grid_template_areas.includes('footer') ? '✅' : '❌'}`);
  });

  console.log('\n📊 User Footer Content Preferences:');
  console.log('------------------------------------');
  const footerPrefs = db.prepare(`
    SELECT navigation_mode, show_version_info, show_statistics, show_quick_actions 
    FROM user_footer_content_preferences 
    ORDER BY navigation_mode
  `).all();
  
  footerPrefs.forEach(pref => {
    console.log(`👣 ${pref.navigation_mode}: version=${pref.show_version_info}, stats=${pref.show_statistics}, actions=${pref.show_quick_actions}`);
  });

  console.log('\n🔍 LEGACY MODE DETECTION:');
  console.log('-------------------------');
  const legacyModes = history.filter(h => 
    !['mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'].includes(h.mode_name)
  );
  
  if (legacyModes.length > 0) {
    console.log(`⚠️  Found ${legacyModes.length} legacy navigation mode entries:`);
    legacyModes.forEach(mode => {
      console.log(`   - ID ${mode.id}: "${mode.mode_name}" (${mode.started_at})`);
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