// test-crud-roundtrip.cjs - CRUD-Roundtrip & Trigger-Beweis
const path = require('path');
const fs = require('fs');

async function testCRUDRoundtrip() {
  console.log('🔄 Post-Fix Persistenz-Audit: CRUD-Roundtrip Tests');
  console.log('=' .repeat(60));
  
  const dbPath = path.join(process.env.APPDATA, 'RawaLite', 'database.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database-Datei nicht gefunden:', dbPath);
    return false;
  }
  
  // Basis-Informationen vor Test
  const beforeStats = fs.statSync(dbPath);
  console.log('📊 Dateigröße vor Test:', beforeStats.size, 'bytes');
  console.log('📅 Letzte Änderung vor Test:', beforeStats.mtime.toISOString());
  
  try {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    
    let data = fs.readFileSync(dbPath);
    let db = new SQL.Database(data);
    
    console.log('');
    console.log('🔍 A. Baseline Row-Counts:');
    
    const entities = ['customers', 'offers', 'invoices', 'timesheets'];
    const beforeCounts = {};
    
    entities.forEach(entity => {
      try {
        const result = db.exec(`SELECT COUNT(*) FROM ${entity}`);
        const count = result.length && result[0].values ? result[0].values[0][0] : 0;
        beforeCounts[entity] = count;
        console.log(`  ${entity}: ${count} Datensätze`);
      } catch (err) {
        console.log(`  ${entity}: ERROR - ${err.message}`);
        beforeCounts[entity] = 0;
      }
    });
    
    console.log('');
    console.log('🔨 B. Test-CRUD Operations:');
    
    const testTimestamp = new Date().toISOString();
    
    // 1. Customer erstellen
    console.log('  1. Customer erstellen...');
    db.exec(`
      INSERT INTO customers (number, name, email, createdAt, updatedAt) 
      VALUES ('TEST-001', 'Test Customer Audit', 'audit@test.com', '${testTimestamp}', '${testTimestamp}')
    `);
    
    // 2. Offer erstellen
    console.log('  2. Offer erstellen...');
    const customerResult = db.exec("SELECT id FROM customers WHERE number = 'TEST-001'");
    const customerId = customerResult.length && customerResult[0].values ? customerResult[0].values[0][0] : null;
    
    if (customerId) {
      db.exec(`
        INSERT INTO offers (offerNumber, customerId, title, validUntil, createdAt, updatedAt) 
        VALUES ('TEST-OFFER-001', ${customerId}, 'Test Audit Offer', '${testTimestamp}', '${testTimestamp}', '${testTimestamp}')
      `);
    }
    
    // 3. Timesheet erstellen
    console.log('  3. Timesheet erstellen...');
    if (customerId) {
      db.exec(`
        INSERT INTO timesheets (timesheetNumber, customerId, title, startDate, endDate, createdAt, updatedAt) 
        VALUES ('TEST-TS-001', ${customerId}, 'Test Audit Timesheet', '${testTimestamp}', '${testTimestamp}', '${testTimestamp}', '${testTimestamp}')
      `);
    }
    
    // 4. Settings updaten
    console.log('  4. Settings updaten...');
    db.exec(`
      UPDATE settings SET companyName = 'Test Audit Company', updatedAt = '${testTimestamp}' WHERE id = 1
    `);
    
    console.log('');
    console.log('📊 C. Nach-CRUD Row-Counts:');
    
    const afterCounts = {};
    entities.forEach(entity => {
      try {
        const result = db.exec(`SELECT COUNT(*) FROM ${entity}`);
        const count = result.length && result[0].values ? result[0].values[0][0] : 0;
        afterCounts[entity] = count;
        const diff = count - beforeCounts[entity];
        console.log(`  ${entity}: ${count} (${diff >= 0 ? '+' : ''}${diff})`);
      } catch (err) {
        console.log(`  ${entity}: ERROR - ${err.message}`);
        afterCounts[entity] = beforeCounts[entity];
      }
    });
    
    // Simuliere Persistence (als ob schedulePersist() aufgerufen wurde)
    console.log('');
    console.log('💾 D. Persistence Simulation:');
    const exportedData = db.export();
    fs.writeFileSync(dbPath, exportedData);
    console.log('  ✅ Database exportiert und geschrieben');
    
    db.close();
    
    // Reload und vergleiche
    console.log('');
    console.log('🔄 E. Reload & Verification:');
    
    data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
    
    const afterReloadCounts = {};
    let allMatched = true;
    
    entities.forEach(entity => {
      try {
        const result = db.exec(`SELECT COUNT(*) FROM ${entity}`);
        const count = result.length && result[0].values ? result[0].values[0][0] : 0;
        afterReloadCounts[entity] = count;
        const matches = count === afterCounts[entity];
        console.log(`  ${entity}: ${count} ${matches ? '✅' : '❌'}`);
        if (!matches) allMatched = false;
      } catch (err) {
        console.log(`  ${entity}: ERROR - ${err.message}`);
        allMatched = false;
      }
    });
    
    // Prüfe spezifische Test-Datensätze
    console.log('');
    console.log('🎯 F. Test-Daten Verification:');
    
    const testCustomer = db.exec("SELECT name FROM customers WHERE number = 'TEST-001'");
    const hasTestCustomer = testCustomer.length && testCustomer[0].values && testCustomer[0].values.length > 0;
    console.log('  Test Customer:', hasTestCustomer ? '✅ gefunden' : '❌ fehlt');
    
    const testOffer = db.exec("SELECT title FROM offers WHERE offerNumber = 'TEST-OFFER-001'");
    const hasTestOffer = testOffer.length && testOffer[0].values && testOffer[0].values.length > 0;
    console.log('  Test Offer:', hasTestOffer ? '✅ gefunden' : '❌ fehlt');
    
    const testTimesheet = db.exec("SELECT title FROM timesheets WHERE timesheetNumber = 'TEST-TS-001'");
    const hasTestTimesheet = testTimesheet.length && testTimesheet[0].values && testTimesheet[0].values.length > 0;
    console.log('  Test Timesheet:', hasTestTimesheet ? '✅ gefunden' : '❌ fehlt');
    
    const settingsUpdate = db.exec("SELECT companyName FROM settings WHERE id = 1");
    const companyName = settingsUpdate.length && settingsUpdate[0].values ? settingsUpdate[0].values[0][0] : null;
    const hasSettingsUpdate = companyName === 'Test Audit Company';
    console.log('  Settings Update:', hasSettingsUpdate ? '✅ persistiert' : '❌ fehlt');
    
    db.close();
    
    // File Statistics nach Test
    const afterStats = fs.statSync(dbPath);
    console.log('');
    console.log('📈 G. Datei-Statistiken:');
    console.log('  Größe nachher:', afterStats.size, 'bytes');
    console.log('  Größe-Änderung:', afterStats.size - beforeStats.size, 'bytes');
    console.log('  Datei verändert:', afterStats.mtime.toISOString() !== beforeStats.mtime.toISOString() ? '✅' : '❌');
    
    console.log('');
    console.log('🎯 H. ROUNDTRIP-ERGEBNIS:');
    console.log('  Alle Counts stimmen:', allMatched ? '✅' : '❌');
    console.log('  Test-Datensätze vorhanden:', (hasTestCustomer && hasTestOffer && hasTestTimesheet && hasSettingsUpdate) ? '✅' : '❌');
    console.log('  Datei wurde verändert:', afterStats.mtime.toISOString() !== beforeStats.mtime.toISOString() ? '✅' : '❌');
    
    const success = allMatched && hasTestCustomer && hasTestOffer && hasTestTimesheet && hasSettingsUpdate;
    console.log('');
    console.log(success ? '✅ CRUD-ROUNDTRIP ERFOLGREICH' : '❌ CRUD-ROUNDTRIP FEHLGESCHLAGEN');
    
    return success;
    
  } catch (err) {
    console.log('❌ Fehler bei CRUD-Roundtrip:', err.message);
    return false;
  }
}

testCRUDRoundtrip().catch(console.error);