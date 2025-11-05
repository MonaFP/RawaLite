import Database from 'better-sqlite3';

const db = new Database('./db/app.db');

try {
  const version = db.prepare('PRAGMA user_version').get();
  console.log('Current database schema version:', version.user_version);
  
  // Check if migration_history table exists  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migration_history'").get();
  if (tables) {
    const migrations = db.prepare('SELECT migration_id, status FROM migration_history ORDER BY migration_id DESC LIMIT 5').all();
    console.log('Recent migrations:');
    migrations.forEach(m => console.log(`  Migration ${m.migration_id}: ${m.status}`));
  }
  
  // Check current constraint
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_navigation_preferences'").get();
  console.log('\nCurrent user_navigation_preferences constraint:');
  if (schema?.sql) {
    // Extract just the header_height constraint 
    const constraintMatch = schema.sql.match(/header_height[^,)]+/);
    console.log('Header height constraint:', constraintMatch?.[0] || 'Not found');
  } else {
    console.log('Table not found');
  }
  
} catch (error) {
  console.error('Database error:', error.message);
} finally {
  db.close();
}