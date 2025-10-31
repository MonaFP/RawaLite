import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

initSqlJs().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('=== BEFORE: Current Navigation State ===');
  const before = db.exec('SELECT navigation_mode, header_height FROM user_navigation_preferences WHERE user_id = "default"');
  console.log('Before:', before[0] ? before[0].values : 'No data');
  
  console.log('\n=== SWITCHING TO mode-compact-focus ===');
  db.exec('UPDATE user_navigation_preferences SET navigation_mode = "mode-compact-focus", updated_at = datetime("now") WHERE user_id = "default"');
  
  console.log('\n=== AFTER: New Navigation State ===');
  const after = db.exec('SELECT navigation_mode, header_height FROM user_navigation_preferences WHERE user_id = "default"');
  console.log('After:', after[0] ? after[0].values : 'No data');
  
  console.log('\n=== EXPECTED RESULT ===');
  console.log('mode-compact-focus should have 36px header height according to SYSTEM_DEFAULTS');
  console.log('If the app shows 36px header now, the backend is working correctly!');
  
  db.close();
});