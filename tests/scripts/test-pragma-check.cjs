// test-pragma-check.cjs - PRAGMA & SQLite File Analysis
const path = require('path');
const fs = require('fs');

async function checkSQLiteFile() {
  console.log('🔍 Post-Fix Persistenz-Audit: PRAGMA & Dateiverhalten');
  console.log('=' .repeat(60));
  
  const dbPath = path.join(process.env.APPDATA, 'RawaLite', 'database.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database-Datei nicht gefunden:', dbPath);
    return false;
  }
  
  const stats = fs.statSync(dbPath);
  console.log('✅ Database gefunden:', dbPath);
  console.log('📊 Dateigröße:', stats.size, 'bytes');
  console.log('📅 Letzte Änderung:', stats.mtime.toISOString());
  
  // Prüfe WAL-Dateien
  const walPath = dbPath + '-wal';
  const shmPath = dbPath + '-shm';
  
  if (fs.existsSync(walPath)) {
    const walStats = fs.statSync(walPath);
    console.log('📝 WAL-Datei gefunden:', walStats.size, 'bytes');
  } else {
    console.log('📝 Keine WAL-Datei vorhanden');
  }
  
  if (fs.existsSync(shmPath)) {
    const shmStats = fs.statSync(shmPath);
    console.log('🔗 SHM-Datei gefunden:', shmStats.size, 'bytes');
  } else {
    console.log('🔗 Keine SHM-Datei vorhanden');
  }
  
  // Versuche SQL.js Import (falls vorhanden)
  try {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);
    
    console.log('');
    console.log('🔧 PRAGMA-Checks:');
    
    const pragmas = [
      'journal_mode',
      'synchronous', 
      'user_version',
      'cache_size',
      'temp_store'
    ];
    
    pragmas.forEach(pragma => {
      try {
        const result = db.exec(`PRAGMA ${pragma}`);
        const value = result.length && result[0].values && result[0].values[0] 
          ? result[0].values[0][0] 
          : 'undefined';
        console.log(`  ${pragma}: ${value}`);
      } catch (err) {
        console.log(`  ${pragma}: ERROR - ${err.message}`);
      }
    });
    
    // Prüfe kritische Tabellen
    console.log('');
    console.log('📋 Schema-Validierung:');
    
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.length && tables[0].values 
        ? tables[0].values.map(row => row[0]) 
        : [];
      console.log('  Tabellen:', tableNames.join(', '));
      
      // Prüfe Settings-Tabelle
      const settingsRows = db.exec("SELECT COUNT(*) FROM settings");
      const settingsCount = settingsRows.length && settingsRows[0].values 
        ? settingsRows[0].values[0][0] 
        : 0;
      console.log('  Settings-Datensätze:', settingsCount);
      
    } catch (err) {
      console.log('  Schema-Check ERROR:', err.message);
    }
    
    db.close();
    console.log('');
    console.log('✅ PRAGMA-Checks abgeschlossen');
    
  } catch (err) {
    console.log('⚠️  SQL.js nicht verfügbar für PRAGMA-Checks:', err.message);
  }
  
  return true;
}

checkSQLiteFile().catch(console.error);