// Debug script für Package Schema Analyse
// Nutzt sql.js für ABI-sichere DB Inspektion

import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';

async function debugPackageSchema() {
  console.log('🔍 DEBUG: Package Schema Analyse');
  console.log('================================\n');

  try {
    // sql.js initialisieren
    const SQL = await initSqlJs();
    
    // DB Pfad bestimmen
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database', 'rawalite.db');
    console.log(`📁 Database: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database nicht gefunden');
      process.exit(1);
    }

    // DB laden
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    console.log('✅ Database geladen\n');

    // 1. Package Line Items Schema
    console.log('📋 PACKAGE_LINE_ITEMS SCHEMA:');
    console.log('==============================');
    
    const schemaResult = db.exec(`PRAGMA table_info(package_line_items)`);
    if (schemaResult.length > 0) {
      const columns = schemaResult[0];
      columns.values.forEach(col => {
        console.log(`   ${col[1]}: ${col[2]} ${col[3] ? 'NOT NULL' : ''} ${col[4] ? 'DEFAULT ' + col[4] : ''}`);
      });
    }
    console.log();

    // 2. Sample Daten prüfen
    console.log('📊 SAMPLE PACKAGE LINE ITEMS:');
    console.log('==============================');
    
    const sampleResult = db.exec(`
      SELECT id, title, quantity, unit_price
      FROM package_line_items 
      LIMIT 5
    `);
    
    if (sampleResult.length > 0) {
      const data = sampleResult[0];
      console.log('Columns:', data.columns);
      data.values.forEach(row => {
        console.log(`   ID ${row[0]}: "${row[1]}" - Q:${row[2]} - unit_price:${row[3]}`);
      });
    } else {
      console.log('   No data found');
    }
    console.log();

    // 3. Prüfe ob veraltete 'amount' Column existiert
    console.log('🔍 VERALTETE FIELDS PRÜFUNG:');
    console.log('=============================');
    
    try {
      const amountCheck = db.exec(`SELECT amount FROM package_line_items LIMIT 1`);
      console.log('❌ PROBLEM: "amount" Column existiert noch!');
    } catch(e) {
      if(e.message.includes('no such column: amount')) {
        console.log('✅ GOOD: "amount" Column existiert nicht mehr');
      } else {
        console.log('⚠️ Unerwarteter Fehler:', e.message);
      }
    }

    try {
      const unitPriceCheck = db.exec(`SELECT unit_price FROM package_line_items LIMIT 1`);
      console.log('✅ GOOD: "unit_price" Column existiert');
    } catch(e) {
      if(e.message.includes('no such column: unit_price')) {
        console.log('❌ PROBLEM: "unit_price" Column existiert nicht!');
      } else {
        console.log('⚠️ Unerwarteter Fehler:', e.message);
      }
    }
    console.log();

    // 4. Prüfe Currency Formatting Daten
    console.log('💰 CURRENCY VALUES ANALYSE:');
    console.log('============================');
    
    const currencyResult = db.exec(`
      SELECT pli.id,
             pli.title as item_title,
             pli.quantity,
             pli.unit_price,
             (pli.quantity * pli.unit_price) as calculated_total
      FROM package_line_items pli
      WHERE pli.unit_price > 0
      ORDER BY pli.id
      LIMIT 10
    `);
    
    if (currencyResult.length > 0) {
      const data = currencyResult[0];
      data.values.forEach(row => {
        console.log(`   ID ${row[0]}: ${row[1]} - ${row[2]}x ${row[3]}€ = ${row[4]}€`);
      });
    } else {
      console.log('   Keine Packages mit Preisen gefunden');
    }

    db.close();
    console.log('\n✅ Analyse abgeschlossen');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

debugPackageSchema();