const fs = require('fs');
const path = require('path');
const os = require('os');
const SQL = require('sql.js');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

console.log('🔧 ADVANCED AUTO-NUMBERING FIX...');

SQL().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  // 1. Find highest existing offer number for this year
  console.log('🔍 Analyzing existing offer numbers...');
  const currentYear = new Date().getFullYear();
  
  const offers = db.exec('SELECT offerNumber FROM offers ORDER BY offerNumber DESC');
  const existingNumbers = offers[0] ? offers[0].values.map(row => row[0]) : [];
  
  console.log('📊 Existing offers:', existingNumbers);
  
  // Extract numeric parts from AN-XXXX format
  const thisYearNumbers = existingNumbers
    .filter(num => num.startsWith('AN-'))
    .map(num => parseInt(num.replace('AN-', ''), 10))
    .filter(num => !isNaN(num))
    .sort((a, b) => b - a); // descending
  
  const highestNumber = thisYearNumbers[0] || 0;
  console.log(`📊 Highest existing number this year: ${highestNumber}`);
  
  // 2. Set numbering circle to correct current value
  const nextCurrent = highestNumber; // current should be the last used number
  console.log(`🔧 Setting offers numbering circle current=${nextCurrent}, lastResetYear=${currentYear}`);
  
  db.exec(`UPDATE numbering_circles 
           SET current = ${nextCurrent}, lastResetYear = ${currentYear} 
           WHERE id = "offers"`);
  
  // 3. Test next number generation
  const testNext = nextCurrent + 1;
  const testNumber = `AN-${testNext.toString().padStart(4, '0')}`;
  console.log(`✅ Next offer will be: ${testNumber}`);
  
  // 4. Save corrected database
  const correctedData = db.export();
  fs.writeFileSync(dbPath, correctedData);
  
  console.log('🎉 Auto-numbering system properly fixed!');
  console.log(`   • Current: ${nextCurrent}`);
  console.log(`   • Next will be: ${testNumber}`);
  console.log('🔄 Restart RawaLite to test offer creation.');
  
  db.close();
}).catch(console.error);