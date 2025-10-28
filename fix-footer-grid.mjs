import fs from 'fs';
import initSqlJs from 'sql.js';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');

console.log('🔧 Aktualisiere CSS Grid Templates für Footer...');

try {
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  // Update mode-dashboard-view (ID 32) - add footer area
  const dashboardTemplate = '"sidebar header" "sidebar focus-bar" "sidebar main" "sidebar footer"';
  const dashboardRows = '60px 40px 1fr 40px';
  
  db.run(`UPDATE user_navigation_mode_settings 
          SET grid_template_areas = ?, grid_template_rows = ?, updated_at = datetime('now')
          WHERE id = 32 AND navigation_mode = 'mode-dashboard-view'`, 
          [dashboardTemplate, dashboardRows]);
  
  console.log('✅ mode-dashboard-view Grid Template aktualisiert');
  
  // Update mode-compact-focus (ID 31) - add footer area
  const compactTemplate = '"sidebar header" "sidebar focus-bar" "sidebar main" "sidebar footer"';
  const compactRows = '60px 40px 1fr 40px';
  
  db.run(`UPDATE user_navigation_mode_settings 
          SET grid_template_areas = ?, grid_template_rows = ?, updated_at = datetime('now')
          WHERE id = 31 AND navigation_mode = 'mode-compact-focus'`,
          [compactTemplate, compactRows]);
  
  console.log('✅ mode-compact-focus Grid Template aktualisiert');
  
  // Verify the changes
  console.log('\n=== VERIFIKATION ===');
  const stmt = db.prepare(`SELECT id, navigation_mode, grid_template_areas, grid_template_rows 
                           FROM user_navigation_mode_settings WHERE id IN (31, 32)`);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`ID ${row.id} (${row.navigation_mode}):`);
    console.log(`  Areas: ${row.grid_template_areas}`);
    console.log(`  Rows: ${row.grid_template_rows}`);
  }
  stmt.free();
  
  // Save the database
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  
  console.log('\n✅ Datenbank gespeichert - Footer sollte jetzt sichtbar sein!');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}