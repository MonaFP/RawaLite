import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import initSqlJs from 'sql.js';

async function updateNavigationGridValues() {
  try {
    const SQL = await initSqlJs();
    const dbPath = join(homedir(), 'AppData/Roaming/Electron/database/rawalite.db');
    console.log('🔍 Loading database:', dbPath);
    
    const filebuffer = readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    
    console.log('\n🔧 UPDATING NAVIGATION GRID VALUES:');
    
    // Update mode-data-panel
    const updateDataPanel = `
      UPDATE user_navigation_mode_settings 
      SET 
        grid_template_columns = '280px 849px',
        grid_template_rows = '80px 1fr',
        grid_template_areas = '"sidebar header" "sidebar main"',
        updated_at = datetime('now')
      WHERE navigation_mode = 'mode-data-panel'
    `;
    
    // Update mode-dashboard-view  
    const updateDashboard = `
      UPDATE user_navigation_mode_settings 
      SET 
        grid_template_columns = '240px 889px',
        grid_template_rows = '80px 1fr', 
        grid_template_areas = '"sidebar header" "sidebar main"',
        updated_at = datetime('now')
      WHERE navigation_mode = 'mode-dashboard-view'
    `;
    
    // Update mode-compact-focus
    const updateCompact = `
      UPDATE user_navigation_mode_settings 
      SET 
        grid_template_columns = '240px 889px',
        grid_template_rows = '80px 1fr',
        grid_template_areas = '"sidebar header" "sidebar main"',
        updated_at = datetime('now') 
      WHERE navigation_mode = 'mode-compact-focus'
    `;
    
    console.log('📝 Updating mode-data-panel...');
    db.run(updateDataPanel);
    
    console.log('📝 Updating mode-dashboard-view...');
    db.run(updateDashboard);
    
    console.log('📝 Updating mode-compact-focus...');
    db.run(updateCompact);
    
    // Verify updates
    console.log('\n✅ VERIFICATION - Updated values:');
    const result = db.exec(`
      SELECT navigation_mode, grid_template_columns, grid_template_rows, grid_template_areas, updated_at 
      FROM user_navigation_mode_settings 
      ORDER BY navigation_mode
    `);
    
    if (result.length > 0) {
      console.log('Columns:', result[0].columns);
      result[0].values.forEach(row => {
        console.log(`${row[0]}: columns="${row[1]}", rows="${row[2]}", areas="${row[3]}", updated="${row[4]}"`);
      });
    }
    
    // Save database
    console.log('\n💾 Saving database...');
    const data = db.export();
    writeFileSync(dbPath, data);
    
    db.close();
    console.log('\n🎉 DATABASE UPDATE COMPLETE!');
    console.log('✅ Grid template values have been set for all navigation modes');
    console.log('✅ CSS-Database integration should now work correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateNavigationGridValues();