// Schema-Validierung-Test - prüft ob alle Tabellen in migrierter DB existieren
const fs = require('fs');
const initSqlJs = require('sql.js');

async function validateDatabaseSchema() {
  console.log('🔍 [SCHEMA-TEST] Validierung der migrierten Datenbank...');
  
  const dbPath = "C:\\Users\\ramon\\AppData\\Roaming\\Electron\\data\\rawalite.db";
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ [SCHEMA-TEST] Datenbank-Datei nicht gefunden');
    return;
  }
  
  const data = fs.readFileSync(dbPath);
  console.log(`📄 [SCHEMA-TEST] Datenbank geladen: ${data.length} bytes`);
  
  // SQLite in-memory laden
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });
  
  const db = new SQL.Database(data);
  
  // Alle Tabellen auflisten
  console.log('📋 [SCHEMA-TEST] Vorhandene Tabellen:');
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  
  if (tables.length > 0) {
    tables[0].values.forEach(row => {
      console.log(`  - ${row[0]}`);
    });
  } else {
    console.log('❌ [SCHEMA-TEST] KEINE Tabellen gefunden!');
  }
  
  // Erwartete Tabellen prüfen
  const expectedTables = ['customers', 'offers', 'invoices', 'timesheets', 'packages', 'settings', 'activities', 'timesheet_activities'];
  
  console.log('\n🎯 [SCHEMA-TEST] Erwartete Tabellen prüfen:');
  
  for (const tableName of expectedTables) {
    try {
      const result = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
      const count = result[0]?.values[0]?.[0] || 0;
      console.log(`  ✅ ${tableName}: ${count} Einträge`);
    } catch (error) {
      console.log(`  ❌ ${tableName}: FEHLT (${error.message})`);
    }
  }
  
  db.close();
  console.log('\n🔍 [SCHEMA-TEST] Analyse abgeschlossen');
}

validateDatabaseSchema().catch(console.error);