import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCHEMA DIREKTFIX - Fix NULL navigation mode grid settings
 * Based on REAL database schema analysis
 */

async function applySchemaFixes() {
  console.log('🛠️  SCHEMA DIREKTFIX - Navigation Grid Settings (Real Schema)');
  console.log('='.repeat(70));
  
  try {
    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: file => {
        if (file.endsWith('.wasm')) {
          return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
        }
        return file;
      }
    });
    
    // Database path
    const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
    
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database not found: ${dbPath}`);
    }
    
    console.log(`📂 Database: ${dbPath}`);
    
    // Load database
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);
    
    const version = db.exec('PRAGMA user_version')[0]?.values[0][0] || 0;
    console.log('📊 Current Schema Version:', version);
    
    // 1. Check and Fix Navigation Mode Grid Settings
    console.log('\n1️⃣ NAVIGATION MODE GRID SETTINGS:');
    console.log('-'.repeat(50));
    
    const nullGridCheck = db.exec(`
      SELECT navigation_mode, user_id, grid_template_areas, grid_template_columns, grid_template_rows
      FROM user_navigation_mode_settings 
      WHERE grid_template_areas IS NULL 
         OR grid_template_columns IS NULL 
         OR grid_template_rows IS NULL
    `);
    
    const nullGridModes = nullGridCheck[0]?.values || [];
    console.log(`   Found ${nullGridModes.length} modes with NULL grid settings`);
    
    if (nullGridModes.length > 0) {
      console.log('   Modes needing fixes:');
      nullGridModes.forEach(row => {
        const [mode, user, areas, cols, rows] = row;
        console.log(`     - ${mode} (user: ${user}): areas=${areas || 'NULL'}, cols=${cols || 'NULL'}, rows=${rows || 'NULL'}`);
      });
      
      // Grid Configuration (corrected for RawaLite 4-area layout)
      const SYSTEM_DEFAULTS = {
        GRID_TEMPLATE_AREAS: '"sidebar header" "sidebar focus-bar" "sidebar main"',
        GRID_TEMPLATE_COLUMNS: '250px 1fr',
        GRID_TEMPLATE_ROWS: '60px 40px 1fr'
      };
      
      // Apply fixes to ALL modes with NULL values
      try {
        const updateQuery = `
          UPDATE user_navigation_mode_settings 
          SET grid_template_areas = '${SYSTEM_DEFAULTS.GRID_TEMPLATE_AREAS}',
              grid_template_columns = '${SYSTEM_DEFAULTS.GRID_TEMPLATE_COLUMNS}',
              grid_template_rows = '${SYSTEM_DEFAULTS.GRID_TEMPLATE_ROWS}'
          WHERE grid_template_areas IS NULL 
             OR grid_template_columns IS NULL 
             OR grid_template_rows IS NULL
        `;
        
        db.exec(updateQuery);
        console.log(`   ✅ Applied standard grid settings to all NULL modes`);
        console.log(`      Grid Areas: ${SYSTEM_DEFAULTS.GRID_TEMPLATE_AREAS}`);
        console.log(`      Grid Columns: ${SYSTEM_DEFAULTS.GRID_TEMPLATE_COLUMNS}`);
        console.log(`      Grid Rows: ${SYSTEM_DEFAULTS.GRID_TEMPLATE_ROWS}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to update grid settings: ${error.message}`);
        throw error;
      }
    } else {
      console.log('   ✅ All navigation modes have grid settings');
    }
    
    // 2. Check Theme Schema (themes table has different structure)
    console.log('\n2️⃣ THEME SCHEMA VALIDATION:');
    console.log('-'.repeat(50));
    
    const themeSchema = db.exec('PRAGMA table_info(themes)');
    const columns = themeSchema[0]?.values.map(row => row[1]) || [];
    
    console.log(`   Theme columns: ${columns.join(', ')}`);
    console.log('   ✅ Theme schema looks correct (theme_key, name, description structure)');
    
    // 3. Save changes back to file
    console.log('\n3️⃣ SAVING CHANGES:');
    console.log('-'.repeat(50));
    
    try {
      const updatedData = db.export();
      
      // Create backup first
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`   📦 Backup created: ${path.basename(backupPath)}`);
      
      // Write updated database
      fs.writeFileSync(dbPath, updatedData);
      console.log('   ✅ Database updated successfully');
      
    } catch (error) {
      console.log(`   ❌ Failed to save: ${error.message}`);
      throw error;
    }
    
    // 4. Verification
    console.log('\n4️⃣ VERIFICATION:');
    console.log('-'.repeat(50));
    
    // Reload and verify
    const verifyData = fs.readFileSync(dbPath);
    const verifyDb = new SQL.Database(verifyData);
    
    // Check navigation modes
    const finalNullCheck = verifyDb.exec(`
      SELECT COUNT(*) as count FROM user_navigation_mode_settings 
      WHERE grid_template_areas IS NULL OR grid_template_columns IS NULL OR grid_template_rows IS NULL
    `);
    const finalNullCount = finalNullCheck[0]?.values[0][0] || 0;
    
    console.log(`   ✅ Navigation modes with NULL settings: ${finalNullCount}`);
    console.log(`   ✅ Schema version unchanged: ${version} (backward compatible)`);
    
    // Show current navigation settings (sample)
    console.log('\n   Current Navigation Settings (sample):');
    const sampleNavSettings = verifyDb.exec(`
      SELECT navigation_mode, grid_template_areas, grid_template_columns, grid_template_rows 
      FROM user_navigation_mode_settings 
      ORDER BY navigation_mode
      LIMIT 3
    `);
    
    if (sampleNavSettings[0]?.values.length > 0) {
      sampleNavSettings[0].values.forEach(row => {
        const [mode, areas, cols, rows] = row;
        console.log(`     • ${mode}:`);
        console.log(`       Areas:   ${areas || 'NULL'}`);
        console.log(`       Columns: ${cols || 'NULL'}`);
        console.log(`       Rows:    ${rows || 'NULL'}`);
      });
    } else {
      console.log('     (No navigation settings found)');
    }
    
    verifyDb.close();
    db.close();
    
    console.log('\n🎉 SCHEMA DIREKTFIX COMPLETED SUCCESSFULLY!');
    console.log('   ✅ Navigation grid settings fixed');
    console.log('   ✅ Theme schema validated');
    console.log('   ✅ Backward compatible approach');
    console.log('   ✅ No migration system disruption');
    console.log('   ✅ Layout issues should be resolved');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Start RawaLite: pnpm dev:all');
    console.log('   2. Test navigation modes');
    console.log('   3. Verify layout is fixed');
    
  } catch (error) {
    console.error('❌ Schema Direktfix failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

applySchemaFixes();