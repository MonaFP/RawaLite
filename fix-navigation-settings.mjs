#!/usr/bin/env node
/**
 * @file fix-navigation-settings.mjs
 * @description Fix Navigation Header Heights Bug - Database Correction
 * 
 * PROBLEM: full-sidebar mode shows 72px instead of expected 36px
 * SOLUTION: Update user_navigation_mode_settings table with correct SYSTEM_DEFAULTS
 * 
 * Uses sql.js for ABI-safe database access in Electron production DB
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

// SYSTEM_DEFAULTS from DatabaseNavigationService.ts
const SYSTEM_DEFAULTS = {
  HEADER_HEIGHTS: {
    'header-statistics': 160,
    'header-navigation': 160,
    'full-sidebar': 36
  },
  SIDEBAR_WIDTHS: {
    'header-statistics': 240,
    'header-navigation': 280,
    'full-sidebar': 240
  }
};

async function fixNavigationSettings() {
  console.log('🔧 Navigation Settings Fix - Database Correction');
  console.log('=' .repeat(60));
  
  try {
    // Initialize sql.js
    const SQL = await initSqlJs();
    
    // Database path (production location)
    const dbPath = join(
      os.homedir(), 
      'AppData', 
      'Roaming', 
      'Electron', 
      'database', 
      'rawalite.db'
    );
    
    console.log('📍 Database path:', dbPath);
    
    if (!existsSync(dbPath)) {
      console.log('❌ Database not found at expected location');
      console.log('💡 Make sure RawaLite has been run at least once');
      process.exit(1);
    }

    // Create backup
    const backupPath = dbPath + '.backup-' + new Date().toISOString().slice(0,19).replace(/:/g, '-');
    console.log('💾 Creating backup:', backupPath);
    
    const originalBuffer = readFileSync(dbPath);
    writeFileSync(backupPath, originalBuffer);
    console.log('✅ Backup created successfully');

    // Load database
    console.log('📚 Loading database with sql.js...');
    const db = new SQL.Database(originalBuffer);
    console.log('✅ Database loaded successfully\n');

    // === CURRENT STATE ANALYSIS ===
    console.log('=== CURRENT NAVIGATION MODE SETTINGS ===');
    const currentSettings = db.exec('SELECT * FROM user_navigation_mode_settings ORDER BY navigation_mode');
    
    if (currentSettings[0] && currentSettings[0].values.length > 0) {
      const columns = currentSettings[0].columns;
      console.log('Current settings:');
      
      currentSettings[0].values.forEach(row => {
        const setting = {};
        columns.forEach((col, idx) => {
          setting[col] = row[idx];
        });
        
        console.log(`  ${setting.navigation_mode}:`);
        console.log(`    Header Height: ${setting.header_height}px`);
        console.log(`    Sidebar Width: ${setting.sidebar_width}px`);
        console.log('');
      });
    }

    // === APPLY FIXES ===
    console.log('=== APPLYING CORRECTIONS ===');
    
    let updateCount = 0;
    
    // Fix each navigation mode with correct SYSTEM_DEFAULTS
    Object.entries(SYSTEM_DEFAULTS.HEADER_HEIGHTS).forEach(([mode, expectedHeight]) => {
      const expectedWidth = SYSTEM_DEFAULTS.SIDEBAR_WIDTHS[mode];
      
      console.log(`Updating ${mode}: ${expectedHeight}px header, ${expectedWidth}px sidebar`);
      
      // Update or insert mode-specific settings
      const updateResult = db.exec(`
        UPDATE user_navigation_mode_settings 
        SET 
          header_height = ${expectedHeight},
          sidebar_width = ${expectedWidth},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = 'default' AND navigation_mode = '${mode}'
      `);
      
      // Check if update affected any rows (might need insert if not exists)
      const checkResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM user_navigation_mode_settings 
        WHERE user_id = 'default' AND navigation_mode = '${mode}'
      `);
      
      const exists = checkResult[0]?.values[0]?.[0] > 0;
      
      if (!exists) {
        console.log(`  → Inserting new record for ${mode}`);
        db.exec(`
          INSERT INTO user_navigation_mode_settings (
            user_id, navigation_mode, header_height, sidebar_width,
            auto_collapse_mobile, auto_collapse_tablet, remember_dimensions,
            mobile_breakpoint, tablet_breakpoint,
            created_at, updated_at
          ) VALUES (
            'default', '${mode}', ${expectedHeight}, ${expectedWidth},
            0, 0, 1, 768, 1024,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `);
      } else {
        console.log(`  → Updated existing record for ${mode}`);
      }
      
      updateCount++;
    });

    // === VERIFICATION ===
    console.log('\n=== VERIFICATION ===');
    const verificationSettings = db.exec('SELECT * FROM user_navigation_mode_settings ORDER BY navigation_mode');
    
    if (verificationSettings[0] && verificationSettings[0].values.length > 0) {
      const columns = verificationSettings[0].columns;
      console.log('After fix:');
      
      let allCorrect = true;
      
      verificationSettings[0].values.forEach(row => {
        const setting = {};
        columns.forEach((col, idx) => {
          setting[col] = row[idx];
        });
        
        const expectedHeight = SYSTEM_DEFAULTS.HEADER_HEIGHTS[setting.navigation_mode];
        const expectedWidth = SYSTEM_DEFAULTS.SIDEBAR_WIDTHS[setting.navigation_mode];
        
        const heightCorrect = setting.header_height === expectedHeight;
        const widthCorrect = setting.sidebar_width === expectedWidth;
        
        const status = (heightCorrect && widthCorrect) ? '✅' : '❌';
        
        console.log(`  ${status} ${setting.navigation_mode}:`);
        console.log(`    Header Height: ${setting.header_height}px (expected: ${expectedHeight}px)`);
        console.log(`    Sidebar Width: ${setting.sidebar_width}px (expected: ${expectedWidth}px)`);
        console.log('');
        
        if (!heightCorrect || !widthCorrect) {
          allCorrect = false;
        }
      });
      
      if (allCorrect) {
        console.log('✅ All navigation mode settings are now correct!');
      } else {
        console.log('❌ Some settings are still incorrect');
        process.exit(1);
      }
    }

    // Save corrected database
    console.log('💾 Saving corrected database...');
    const correctedData = db.export();
    writeFileSync(dbPath, correctedData);
    console.log('✅ Database updated successfully');

    // Close database
    db.close();
    
    console.log('\n🎉 NAVIGATION SETTINGS FIX COMPLETED');
    console.log('=' .repeat(60));
    console.log(`📊 Updated ${updateCount} navigation mode settings`);
    console.log(`💾 Backup created: ${backupPath}`);
    console.log('🚀 RawaLite should now show correct header heights for each mode');
    console.log('\n💡 Test by switching between navigation modes in RawaLite app');
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure sql.js is installed: pnpm install');
    console.error('   2. Close RawaLite app before running this script');
    console.error('   3. Check database file permissions');
    console.error('   4. Restore from backup if needed');
    process.exit(1);
  }
}

// Run the fix
fixNavigationSettings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});