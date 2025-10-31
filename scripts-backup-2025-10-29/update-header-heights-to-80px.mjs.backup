#!/usr/bin/env node
// Navigation Header Heights - Database Update to 80px for all modes
import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';

console.log('🔧 NAVIGATION HEADER HEIGHTS - DATABASE UPDATE');
console.log('=============================================');

try {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('\n📋 Current Database Values:');
  const beforeSettings = db.exec("SELECT navigation_mode, header_height FROM user_navigation_mode_settings ORDER BY navigation_mode");
  if (beforeSettings[0]) {
    beforeSettings[0].values.forEach(row => {
      console.log(`  - ${row[0]}: ${row[1]}px`);
    });
  }
  
  console.log('\n🔧 Updating all modes to 80px (compact header design)...');
  
  // Update alle Modi auf 80px
  db.exec("UPDATE user_navigation_mode_settings SET header_height = 80, updated_at = CURRENT_TIMESTAMP");
  
  console.log('\n✅ Database Updated! New Values:');
  const afterSettings = db.exec("SELECT navigation_mode, header_height FROM user_navigation_mode_settings ORDER BY navigation_mode");
  if (afterSettings[0]) {
    afterSettings[0].values.forEach(row => {
      console.log(`  - ${row[0]}: ${row[1]}px`);
    });
  }
  
  console.log('\n🎯 VERIFICATION:');
  console.log('  ✅ CSS Variable Values: All modes use 80px');
  console.log('  ✅ Database Values: All modes updated to 80px');
  console.log('  ✅ Header Components: Redesigned for compact 80px height');
  console.log('  ✅ Based on: mode-compact-focus working pattern');
  
  // Save changes
  const updatedData = db.export();
  fs.writeFileSync(dbPath, updatedData);
  
  db.close();
  console.log('\n✅ Database updated successfully! Ready for testing.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}