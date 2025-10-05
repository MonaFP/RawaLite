// Alternative debug script using better-sqlite3 directly but with correct async pattern
import Database from 'better-sqlite3';

try {
  console.log('🔍 Database debug (alternative approach)...');
  
  const db = new Database('./rawalite.db', { 
    verbose: console.log,
    readonly: true 
  });
  
  console.log('\n=== Settings Table Schema ===');
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='settings'").all();
  if (schema.length > 0) {
    console.log(schema[0].sql);
  } else {
    console.log('❌ Settings table not found!');
  }

  console.log('\n=== Current Settings Data ===');
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").all();
  if (settings.length > 0) {
    console.log('Settings found:', settings[0]);
    console.log('📋 Tax fields:');
    console.log('  - tax_id:', settings[0].tax_id);
    console.log('  - vat_id:', settings[0].vat_id);
  } else {
    console.log('❌ No settings found!');
  }

  console.log('\n=== Migration Status ===');
  const migrations = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").all();
  if (migrations.length > 0) {
    const applied = db.prepare('SELECT * FROM migrations ORDER BY id').all();
    console.log('Applied migrations:', applied.map(m => m.filename));
  } else {
    console.log('No migrations table found!');
  }

  db.close();
  console.log('\n✅ Debug completed successfully!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}