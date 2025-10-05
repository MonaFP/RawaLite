// Test better-sqlite3 functionality
import Database from 'better-sqlite3';
import fs from 'fs';

try {
  console.log('✅ better-sqlite3 module loaded successfully');
  
  // Test basic functionality
  const db = new Database(':memory:');
  console.log('✅ In-memory database created');
  
  db.exec('CREATE TABLE test (id INTEGER, name TEXT)');
  db.exec("INSERT INTO test VALUES (1, 'test')");
  const result = db.prepare('SELECT * FROM test').get();
  console.log('✅ Database operations work:', result);
  
  db.close();
  console.log('✅ better-sqlite3 is fully functional with Electron');
  
  // Test actual database file
  if (fs.existsSync('./rawalite.db')) {
    console.log('📁 Found rawalite.db, testing...');
    const realDb = new Database('./rawalite.db');
    const tables = realDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Tables found:', tables.map(t => t.name));
    realDb.close();
    console.log('✅ Real database access works');
  } else {
    console.log('ℹ️ No rawalite.db found (app not started yet)');
  }
  
} catch (error) {
  console.error('❌ better-sqlite3 error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}