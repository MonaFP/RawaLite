// Debug-Script für SQLite-Datenbank
import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';

async function debugDatabase() {
  console.log('🔍 Starting database debug...');
  
  // Lade SQL.js
  const SQL = await initSqlJs({
    locateFile: file => `./public/${file}`
  });
  
  // Lade Datenbank-Datei
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RaWaLite', 'database.sqlite');
  console.log('📁 Database path:', dbPath);
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database file does not exist!');
    return;
  }
  
  const dbBuffer = fs.readFileSync(dbPath);
  console.log('📦 Database loaded, size:', dbBuffer.length, 'bytes');
  
  // Öffne Datenbank
  const db = new SQL.Database(dbBuffer);
  
  // Prüfe Tables
  console.log('\n📋 Tables in database:');
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (tables.length > 0) {
    tables[0].values.forEach(row => console.log('  -', row[0]));
  }
  
  // Prüfe Settings
  console.log('\n⚙️ Settings data:');
  try {
    const settings = db.exec("SELECT * FROM settings;");
    if (settings.length > 0) {
      console.log('Settings found:', settings[0].values.length, 'rows');
      console.log('Settings data:', settings[0].values[0]);
    } else {
      console.log('❌ No settings found!');
    }
  } catch (err) {
    console.log('❌ Settings table error:', err.message);
  }
  
  // Prüfe Customers
  console.log('\n👥 Customers data:');
  try {
    const customers = db.exec("SELECT * FROM customers;");
    if (customers.length > 0) {
      console.log('Customers found:', customers[0].values.length, 'rows');
      customers[0].values.forEach((row, i) => {
        console.log(`  Customer ${i + 1}:`, row[1], row[2]); // number, name
      });
    } else {
      console.log('❌ No customers found!');
    }
  } catch (err) {
    console.log('❌ Customers table error:', err.message);
  }
  
  // Prüfe Packages
  console.log('\n📦 Packages data:');
  try {
    const packages = db.exec("SELECT * FROM packages;");
    if (packages.length > 0) {
      console.log('Packages found:', packages[0].values.length, 'rows');
      packages[0].values.forEach((row, i) => {
        console.log(`  Package ${i + 1}:`, row[1]); // internalTitle
      });
    } else {
      console.log('❌ No packages found!');
    }
  } catch (err) {
    console.log('❌ Packages table error:', err.message);
  }
  
  db.close();
  console.log('\n✅ Database debug completed');
}

debugDatabase().catch(console.error);