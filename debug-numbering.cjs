const fs = require('fs');
const path = require('path');
const os = require('os');
const SQL = require('sql.js');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

SQL().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('=== NUMBERING CIRCLES ANALYSIS ===');
  
  const circles = db.exec('SELECT * FROM numbering_circles ORDER BY id');
  if (circles[0]) {
    console.log('📊 Numbering Circles:', circles[0].values.length);
    circles[0].values.forEach(row => {
      const [id, name, prefix, digits, current, resetMode, lastResetYear] = row;
      console.log(`  ${id}: ${name} - ${prefix}[${current.toString().padStart(digits, '0')}] (mode: ${resetMode})`);
    });
  } else {
    console.log('❌ No numbering circles found!');
  }
  
  console.log('');
  console.log('=== EXISTING OFFERS ===');
  const offers = db.exec('SELECT offerNumber FROM offers ORDER BY offerNumber');
  if (offers[0]) {
    console.log('📊 Existing Offer Numbers:');
    offers[0].values.forEach(row => {
      console.log(`  ${row[0]}`);
    });
  } else {
    console.log('📊 No offers found.');
  }
  
  console.log('');
  console.log('=== SETTINGS AUTO-NUMBERING ===');
  const settings = db.exec('SELECT nextOfferNumber FROM settings WHERE id = 1');
  if (settings[0] && settings[0].values[0]) {
    console.log('📊 Next Offer Number from settings:', settings[0].values[0][0]);
  } else {
    console.log('❌ No settings found!');
  }
  
  db.close();
}).catch(console.error);