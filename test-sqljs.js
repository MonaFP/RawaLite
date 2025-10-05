// Test sql.js functionality (ABI-safe alternative to test-sqlite3.js)
// Uses sql.js instead of better-sqlite3 for Node-context compatibility

import fs from 'fs';

async function testSqlJs() {
  try {
    // Load sql.js
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();
    console.log('✅ sql.js module loaded successfully');
    
    // Test basic functionality
    const db = new SQL.Database();
    console.log('✅ In-memory database created');
    
    db.exec('CREATE TABLE test (id INTEGER, name TEXT)');
    db.exec("INSERT INTO test VALUES (1, 'test')");
    const result = db.exec('SELECT * FROM test');
    console.log('✅ Database operations work:', result[0].values[0]);
    
    db.close();
    console.log('✅ sql.js is fully functional for Node.js context');
    
    // Test actual database file
    if (fs.existsSync('./rawalite.db')) {
      console.log('📁 Found rawalite.db, testing...');
      const filebuffer = fs.readFileSync('./rawalite.db');
      const realDb = new SQL.Database(filebuffer);
      const tables = realDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.length > 0 ? tables[0].values.map(row => row[0]) : [];
      console.log('📋 Tables found:', tableNames);
      realDb.close();
      console.log('✅ Real database access works');
    } else {
      console.log('ℹ️ No rawalite.db found (app not started yet)');
    }
    
  } catch (error) {
    console.error('❌ sql.js error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n💡 Make sure sql.js is installed: pnpm add sql.js');
    process.exit(1);
  }
}

testSqlJs();