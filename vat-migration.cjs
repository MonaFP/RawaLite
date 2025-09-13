/**
 * 🚨 VAT Migration Script für RawaLite
 * Korrigiert bestehende VAT-Werte für Kleinunternehmer-Compliance
 * 
 * Führe aus mit: pnpm migration:vat
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Database path
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

console.log('🔍 VAT Migration Script gestartet...');
console.log('📁 Database Path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found:', dbPath);
  console.log('💡 Tipps:');
  console.log('   • Stellen Sie sicher, dass RawaLite mindestens einmal gestartet wurde');
  console.log('   • Prüfen Sie den Pfad: %APPDATA%\\RawaLite\\database.sqlite');
  process.exit(1);
}

// SQL.js für Browser-kompatible SQLite-Operationen
const initSqlJs = require('sql.js');

async function fixVATMigration() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `./node_modules/sql.js/dist/${file}`
    });
    
    // Read database file
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    
    console.log('✅ Database loaded successfully');
    
    // 1. Check Kleinunternehmer status
    const settingsResult = db.exec(`SELECT kleinunternehmer FROM settings WHERE id = 1`);
    
    if (settingsResult.length === 0) {
      console.log('⚠️ No settings found - creating default Kleinunternehmer=1');
      db.exec(`UPDATE settings SET kleinunternehmer = 1 WHERE id = 1`);
    }
    
    const isKleinunternehmer = settingsResult[0]?.values[0]?.[0] === 1;
    console.log('🏢 Kleinunternehmer Status:', isKleinunternehmer);
    
    if (!isKleinunternehmer) {
      console.log('✅ Kein Kleinunternehmer - keine VAT-Migration erforderlich');
      return;
    }
    
    // 2. Find offers with incorrect VAT
    const offersResult = db.exec(`
      SELECT id, offerNumber, vatAmount, total, subtotal 
      FROM offers 
      WHERE vatAmount > 0
    `);
    
    const offers = offersResult[0]?.values || [];
    console.log(`🔍 Gefunden: ${offers.length} Angebote mit inkorrekter MwSt`);
    
    // 3. Fix offers
    let fixedOffers = 0;
    for (const offer of offers) {
      const [id, offerNumber, vatAmount, total, subtotal] = offer;
      const newTotal = subtotal; // Total = Subtotal (ohne MwSt)
      
      db.exec(`UPDATE offers SET vatAmount = 0, total = ${newTotal} WHERE id = ${id}`);
      console.log(`✅ Korrigiert: ${offerNumber} - VAT: ${vatAmount.toFixed(2)}€ → 0.00€, Total: ${total.toFixed(2)}€ → ${newTotal.toFixed(2)}€`);
      fixedOffers++;
    }
    
    // 4. Find invoices with incorrect VAT
    const invoicesResult = db.exec(`
      SELECT id, invoiceNumber, vatAmount, total, subtotal 
      FROM invoices 
      WHERE vatAmount > 0
    `);
    
    const invoices = invoicesResult[0]?.values || [];
    console.log(`🔍 Gefunden: ${invoices.length} Rechnungen mit inkorrekter MwSt`);
    
    // 5. Fix invoices
    let fixedInvoices = 0;
    for (const invoice of invoices) {
      const [id, invoiceNumber, vatAmount, total, subtotal] = invoice;
      const newTotal = subtotal;
      
      db.exec(`UPDATE invoices SET vatAmount = 0, total = ${newTotal} WHERE id = ${id}`);
      console.log(`✅ Korrigiert: ${invoiceNumber} - VAT: ${vatAmount.toFixed(2)}€ → 0.00€`);
      fixedInvoices++;
    }
    
    // 6. Save corrected database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    
    console.log(`\n🎉 VAT-Migration erfolgreich abgeschlossen!`);
    console.log(`   • ${fixedOffers} Angebote korrigiert`);
    console.log(`   • ${fixedInvoices} Rechnungen korrigiert`);
    console.log(`🔄 Bitte starten Sie RawaLite neu, um die Änderungen zu sehen.\n`);
    
    db.close();
    
  } catch (error) {
    console.error('❌ VAT-Migration fehlgeschlagen:', error);
    process.exit(1);
  }
}

// Starte Migration
fixVATMigration();