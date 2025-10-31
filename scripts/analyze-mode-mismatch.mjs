import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

initSqlJs().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('=== CURRENT USER NAVIGATION STATE ===');
  const preferences = db.exec('SELECT user_id, navigation_mode, header_height, sidebar_width FROM user_navigation_preferences');
  console.log('Current preferences:', preferences[0] ? preferences[0].values : 'No data');
  
  console.log('\n=== MODE MAPPING ===');
  console.log('Current mode: mode-data-panel (160px header) - User erwartet aber 36px für full-sidebar');
  console.log('SYSTEM_DEFAULTS:');
  console.log('- mode-dashboard-view: 160px header');
  console.log('- mode-data-panel: 160px header');  
  console.log('- mode-compact-focus: 36px header  <-- Das ist was User für full-sidebar will');
  
  console.log('\n=== PROBLEM ===');
  console.log('User ist in mode-data-panel aber erwartet full-sidebar behavior (36px header)');
  console.log('Der mode-data-panel hat korrekt 160px, aber das ist nicht was User will');
  
  db.close();
});