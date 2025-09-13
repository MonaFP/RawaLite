const fs = require('fs');
const path = require('path');
const os = require('os');
const SQL = require('sql.js');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database.sqlite');

console.log('🔧 FIXING AUTO-NUMBERING SYSTEM...');

SQL().then(SQL => {
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  // 1. Analyze current state
  console.log('📊 Current "offers" numbering circle:');
  const circle = db.exec('SELECT * FROM numbering_circles WHERE id = "offers"');
  if (circle[0] && circle[0].values[0]) {
    const [id, name, prefix, digits, current] = circle[0].values[0];
    console.log(`  ${id}: current=${current}, should be 1 (since AN-0001 exists)`);
  }
  
  // 2. Fix numbering circle to reflect existing data
  console.log('🔧 Updating offers numbering circle current=1...');
  db.exec('UPDATE numbering_circles SET current = 1 WHERE id = "offers"');
  
  // 3. Test next number generation
  console.log('🧪 Testing next number generation...');
  const currentYear = new Date().getFullYear();
  
  // Get circle data after update
  const updatedCircle = db.exec('SELECT * FROM numbering_circles WHERE id = "offers"');
  const [id, name, prefix, digits, current, resetMode, lastResetYear] = updatedCircle[0].values[0];
  
  let newCurrent = current + 1;
  
  // Check yearly reset
  if (resetMode === 'yearly' && lastResetYear !== currentYear) {
    console.log(`🗓️ Yearly reset triggered: ${lastResetYear} -> ${currentYear}`);
    newCurrent = 1;
    db.exec(`UPDATE numbering_circles SET lastResetYear = ${currentYear} WHERE id = "offers"`);
  }
  
  const nextNumber = `${prefix}${newCurrent.toString().padStart(digits, '0')}`;
  console.log(`✅ Next offer number will be: ${nextNumber}`);
  
  // 4. Save corrected database
  const correctedData = db.export();
  fs.writeFileSync(dbPath, correctedData);
  
  console.log('🎉 Auto-numbering system fixed!');
  console.log('🔄 Restart RawaLite to test offer creation.');
  
  db.close();
}).catch(console.error);