import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db';

initSqlJs().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  // Liste alle Tabellen
  const allTables = db.exec('SELECT name FROM sqlite_master WHERE type="table"');
  const tables = allTables[0] ? allTables[0].values.flat() : [];
  
  console.log('=== ALL TABLES ===');
  tables.forEach(table => console.log(table));
  
  console.log('\n=== NAVIGATION RELATED TABLES ===');
  const navTables = tables.filter(name => name.includes('navigation'));
  navTables.forEach(table => console.log(table));
  
  console.log('\n=== USER NAVIGATION PREFERENCES ===');
  try {
    const preferences = db.exec('SELECT * FROM user_navigation_preferences');
    console.log('Preferences data:', preferences[0] ? preferences[0].values : 'No data');
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  db.close();
});