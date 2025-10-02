const Database = require('better-sqlite3');

try {
  const db = new Database('./rawalite.db');

  console.log('=== Migration Status Check ===');
  const migrations = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").all();
  if (migrations.length > 0) {
    console.log('Migrations table exists');
    const applied = db.prepare('SELECT * FROM migrations ORDER BY id').all();
    console.log('Applied migrations:', applied.map(m => m.filename));
  } else {
    console.log('No migrations table found!');
  }

  console.log('\n=== Numbering Circles Check ===');
  const circles = db.prepare('SELECT * FROM numbering_circles').all();
  console.log('Found numbering circles:', circles.length);
  circles.forEach(c => console.log('  -', c.type, ':', c.last_number));

  console.log('\n=== Settings Check ===');
  const settings = db.prepare('SELECT * FROM settings').all();
  console.log('Found settings:', settings.length);

  db.close();
  console.log('\n✅ Database check completed');
} catch (error) {
  console.error('❌ Database error:', error.message);
}