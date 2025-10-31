import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

initSqlJs().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('=== USER NAVIGATION MODE SETTINGS CONTENT ===');
  try {
    const modeSettings = db.exec('SELECT * FROM user_navigation_mode_settings');
    console.log('Mode settings data:', JSON.stringify(modeSettings[0] ? modeSettings[0].values : 'No data', null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n=== NAVIGATION MODE HISTORY ===');
  try {
    const history = db.exec('SELECT * FROM navigation_mode_history ORDER BY switched_at DESC LIMIT 5');
    console.log('Recent navigation mode switches:', JSON.stringify(history[0] ? history[0].values : 'No data', null, 2));
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  db.close();
});