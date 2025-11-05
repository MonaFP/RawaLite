import fs from 'fs';
import initSqlJs from 'sql.js';

console.log('🔍 Real Database Schema Inspector');

try {
  const SQL = await initSqlJs();
  const dbPath = './db/after-migration-040-fresh.db';
  
  console.log('📚 Loading database:', dbPath);
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);
  
  console.log('✅ Database loaded successfully\n');
  
  // Check user_navigation_preferences schema
  console.log('=== user_navigation_preferences TABLE SCHEMA ===');
  const schemaResult = db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='user_navigation_preferences'`);
  
  if (schemaResult[0] && schemaResult[0].values.length > 0) {
    console.log(schemaResult[0].values[0][0]);
  } else {
    console.log('❌ Table user_navigation_preferences not found');
  }
  
  console.log('\n=== CURRENT NAVIGATION PREFERENCES ===');
  try {
    const prefResult = db.exec(`SELECT * FROM user_navigation_preferences WHERE user_id = 'default'`);
    if (prefResult[0]) {
      console.log('Columns:', prefResult[0].columns.join(', '));
      if (prefResult[0].values.length > 0) {
        const row = prefResult[0].values[0];
        prefResult[0].columns.forEach((col, idx) => {
          console.log(`${col}: ${row[idx]}`);
        });
      }
    }
  } catch (e) {
    console.log('Error reading preferences:', e.message);
  }
  
  console.log('\n=== SCHEMA VERSION ===');
  try {
    const versionResult = db.exec('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
    if (versionResult[0]) {
      console.log('Current version:', versionResult[0].values[0][0]);
    }
  } catch (e) {
    console.log('Error reading version:', e.message);
  }
  
  console.log('\n=== MIGRATION HISTORY ===');
  try {
    const migrationResult = db.exec('SELECT * FROM migration_history ORDER BY migration_id DESC LIMIT 5');
    if (migrationResult[0]) {
      console.log('Recent migrations:');
      migrationResult[0].values.forEach(row => {
        console.log(`  Migration ${row[1]}: ${row[2]} at ${row[3]}`);
      });
    }
  } catch (e) {
    console.log('Error reading migration history:', e.message);
  }
  
  db.close();
  console.log('\n✅ Schema inspection complete');
  
} catch (error) {
  console.error('❌ Inspection failed:', error.message);
}