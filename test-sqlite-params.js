import Database from 'better-sqlite3';

// Create in-memory database
const db = new Database(':memory:');

// Create test table
db.exec('CREATE TABLE test (id INTEGER, name TEXT)');

console.log('Testing better-sqlite3 parameter handling...\n');

// Test 1: run() with array
try {
  const stmt = db.prepare('INSERT INTO test (id, name) VALUES (?, ?)');
  const result = stmt.run([1, 'Test1']);
  console.log('✅ run([1, "Test1"]):', result);
} catch (error) {
  console.log('❌ run([1, "Test1"]):', error.message);
}

// Test 2: run() with spread parameters  
try {
  const stmt = db.prepare('INSERT INTO test (id, name) VALUES (?, ?)');
  const result = stmt.run(2, 'Test2');
  console.log('✅ run(2, "Test2"):', result);
} catch (error) {
  console.log('❌ run(2, "Test2"):', error.message);
}

// Test 3: all() with array
try {
  const stmt = db.prepare('SELECT * FROM test WHERE id = ?');
  const result = stmt.all([1]);
  console.log('✅ all([1]):', result);
} catch (error) {
  console.log('❌ all([1]):', error.message);
}

// Test 4: all() with spread parameters
try {
  const stmt = db.prepare('SELECT * FROM test WHERE id = ?');
  const result = stmt.all(1);
  console.log('✅ all(1):', result);
} catch (error) {
  console.log('❌ all(1):', error.message);
}

db.close();