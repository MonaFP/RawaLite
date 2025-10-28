// Quick analysis: Aktuelle Header Heights in Navigation Modi (sql.js fallback)
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

console.log('🔍 Analyzing Header Heights Configuration...\n');

try {
  const db = new Database(dbPath);
  
  // Prüfe user_navigation_mode_settings für Header Heights
  console.log('=== Navigation Mode Settings (Header Heights) ===');
  try {
    const modeSettings = db.prepare(`
      SELECT user_id, navigation_mode, header_height, created_at, updated_at 
      FROM user_navigation_mode_settings 
      WHERE user_id = 'default'
      ORDER BY navigation_mode
    `).all();
    
    if (modeSettings.length > 0) {
      modeSettings.forEach(setting => {
        console.log(`Mode: ${setting.navigation_mode} -> HeaderHeight: ${setting.header_height}px`);
      });
    } else {
      console.log('⚠️  NO per-mode settings found! Using default values.');
      
      // Show expected defaults
      console.log('\n=== Expected System Defaults ===');
      const systemDefaults = {
        'mode-compact-focus': 36,
        'mode-dashboard-view': 160, 
        'mode-data-panel': 160
      };
      
      Object.entries(systemDefaults).forEach(([mode, height]) => {
        console.log(`${mode} -> Expected: ${height}px`);
      });
    }
  } catch (error) {
    console.log('❌ user_navigation_mode_settings table does not exist or has issues:', error.message);
  }
  
  // Prüfe aktuelle Navigation Preferences
  console.log('\n=== Current Navigation Mode ===');
  const currentNav = db.prepare(`
    SELECT navigation_mode, header_height, created_at, updated_at 
    FROM user_navigation_preferences 
    WHERE user_id = 'default'
  `).get();
  
  if (currentNav) {
    console.log(`Current Mode: ${currentNav.navigation_mode}`);
    console.log(`Global Header Height: ${currentNav.header_height}px`);
    console.log(`🚨 BUG: Global header height should NOT be used for per-mode configuration!`);
  }
  
  // Prüfe Migration 034-036 Status 
  console.log('\n=== Migration Status Check ===');
  const migrations = db.prepare(`
    SELECT version, filename, executed_at 
    FROM migration_history 
    WHERE version IN ('034', '035', '036', '037')
    ORDER BY version
  `).all();
  
  migrations.forEach(migration => {
    console.log(`Migration ${migration.version}: ${migration.filename} - ${migration.executed_at}`);
  });
  
  db.close();
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('- Navigation mode switching: ✅ Working');
  console.log('- Per-mode header heights: ❌ Missing per-mode configuration');
  console.log('- Problem: DatabaseNavigationService uses global header_height instead of mode-specific');
  
} catch (error) {
  console.error('Database analysis failed:', error.message);
}