// Legacy-Schema Detailanalyse
const fs = require('fs');
const initSqlJs = require('sql.js');

async function analyzeLegacySchema() {
  console.log('🔍 [LEGACY-ANALYSIS] Detailanalyse Legacy-Datenbank...');
  
  const dbPath = "C:\\Users\\ramon\\AppData\\Roaming\\Electron\\data\\rawalite.db";
  const data = fs.readFileSync(dbPath);
  
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });
  
  const db = new SQL.Database(data);
  
  // 1. Alle Tabellen mit Details
  console.log('📋 [LEGACY] Tabellen-Details:');
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  
  if (tables.length > 0) {
    for (const row of tables[0].values) {
      const tableName = row[0];
      console.log(`\n🔸 Tabelle: ${tableName}`);
      
      // Schema anzeigen
      const schema = db.exec(`PRAGMA table_info(${tableName})`);
      if (schema.length > 0) {
        console.log('  Spalten:');
        schema[0].values.forEach(col => {
          console.log(`    - ${col[1]} (${col[2]})`);
        });
      }
      
      // Anzahl Einträge
      try {
        const count = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
        const num = count[0]?.values[0]?.[0] || 0;
        console.log(`  Einträge: ${num}`);
        
        // Erste paar Einträge als Sample (falls vorhanden)
        if (num > 0 && num <= 5) {
          const sample = db.exec(`SELECT * FROM ${tableName} LIMIT 3`);
          if (sample.length > 0) {
            console.log('  Sample-Daten:');
            sample[0].values.forEach((row, idx) => {
              console.log(`    [${idx}]: ${JSON.stringify(row)}`);
            });
          }
        }
      } catch (error) {
        console.log(`  Fehler beim Lesen: ${error.message}`);
      }
    }
  }
  
  // 2. Prüfen ob es versteckte/codierte Daten gibt
  console.log('\n🔍 [LEGACY] Suche nach versteckten Daten...');
  
  // Prüfe dictionaries Tabelle genauer
  try {
    const dictResult = db.exec("SELECT * FROM dictionaries LIMIT 5");
    if (dictResult.length > 0) {
      console.log('📚 dictionaries Inhalt:');
      dictResult[0].values.forEach((row, idx) => {
        console.log(`  [${idx}]: ${JSON.stringify(row)}`);
      });
    }
  } catch (error) {
    console.log('❌ Kann dictionaries nicht lesen:', error.message);
  }
  
  // Prüfe meta Tabelle
  try {
    const metaResult = db.exec("SELECT * FROM meta LIMIT 5");
    if (metaResult.length > 0) {
      console.log('📋 meta Inhalt:');
      metaResult[0].values.forEach((row, idx) => {
        console.log(`  [${idx}]: ${JSON.stringify(row)}`);
      });
    }
  } catch (error) {
    console.log('❌ Kann meta nicht lesen:', error.message);
  }
  
  db.close();
  console.log('\n✅ [LEGACY-ANALYSIS] Analyse abgeschlossen');
}

analyzeLegacySchema().catch(console.error);