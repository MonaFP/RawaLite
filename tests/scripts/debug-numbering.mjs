// ESM Version von debug-numbering.cjs
import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs from 'sql.js';

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

try {
  const SQL = await initSqlJs();
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
    console.log('❌ No numbering circles found');
  }
  
  console.log('\n=== SETTINGS ANALYSIS ===');
  const settings = db.exec('SELECT companyName, nextCustomerNumber, nextOfferNumber, nextInvoiceNumber, nextTimesheetNumber FROM settings WHERE id = 1');
  if (settings[0] && settings[0].values[0]) {
    const [companyName, nextCustomer, nextOffer, nextInvoice, nextTimesheet] = settings[0].values[0];
    console.log(`🏢 Company: ${companyName || '[Not Set]'}`);
    console.log(`🔢 Next Numbers: Customer(${nextCustomer}), Offer(${nextOffer}), Invoice(${nextInvoice}), Timesheet(${nextTimesheet})`);
  } else {
    console.log('❌ No settings found');
  }
  
  db.close();
  console.log('✅ Analysis completed successfully');
  
} catch (error) {
  console.error('❌ Error analyzing database:', error.message);
  if (error.code === 'ENOENT') {
    console.log('💡 Database file not found. Run the app first to create it.');
  }
}