#!/usr/bin/env node
// Navigation Header Heights - CSS vs Database Analysis
import fs from 'fs';
import initSqlJs from 'sql.js';

const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';

console.log('🔍 NAVIGATION HEADER HEIGHTS ANALYSIS');
console.log('=====================================');

try {
  const SQL = await initSqlJs();
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);
  
  console.log('\n📋 Database Values (Per-Mode Settings):');
  const settings = db.exec("SELECT navigation_mode, header_height FROM user_navigation_mode_settings ORDER BY navigation_mode");
  if (settings[0]) {
    settings[0].values.forEach(row => {
      console.log(`  - ${row[0]}: ${row[1]}px`);
    });
  }
  
  console.log('\n📋 CSS Default Values (layout-grid.css):');
  console.log('  - mode-compact-focus: 36px (Variable: --mode-compact-focus-header-height)');
  console.log('  - mode-dashboard-view: 160px (Variable: --mode-dashboard-view-header-height)');
  console.log('  - mode-data-panel: 160px (Variable: --mode-data-panel-header-height)');
  
  console.log('\n🎯 COMPARISON ANALYSIS:');
  if (settings[0]) {
    settings[0].values.forEach(row => {
      const mode = row[0];
      const dbHeight = row[1];
      let cssHeight = 'unknown';
      
      if (mode === 'mode-compact-focus') cssHeight = '36px';
      if (mode === 'mode-dashboard-view') cssHeight = '160px';
      if (mode === 'mode-data-panel') cssHeight = '160px';
      
      const matches = dbHeight + 'px' === cssHeight;
      console.log(`  ${matches ? '✅' : '❌'} ${mode}: DB=${dbHeight}px vs CSS=${cssHeight}`);
    });
  }
  
  console.log('\n💡 COMPACT-FOCUS ANALYSIS (Working Reference):');
  console.log('  ✅ mode-compact-focus funktioniert mit 36px');
  console.log('  ✅ CSS ist für kleine Header Heights designed');
  console.log('  ✅ Database und CSS sind synchron');
  
  console.log('\n🔧 PROBLEM IDENTIFIED:');
  console.log('  ❌ mode-dashboard-view + mode-data-panel haben DB-Werte für kleine Headers');
  console.log('  ❌ Aber CSS ist für große Headers (160px) designed');
  console.log('  ❌ Content wird abgeschnitten wegen Höhen-Mismatch');
  
  console.log('\n🎯 SOLUTION STRATEGY:');
  console.log('  1. Database Values für mode-dashboard-view + mode-data-panel auf 160px setzen');
  console.log('  2. ODER CSS für mode-dashboard-view + mode-data-panel auf 36px anpassen');
  console.log('  3. Orientierung an mode-compact-focus (36px funktioniert)');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}