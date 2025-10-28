#!/usr/bin/env node

/**
 * Quick Navigation Bug Status Check
 * Analyzes current database status for Navigation Header Heights bug
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function quickNavigationStatusCheck() {
  try {
    const SQL = await initSqlJs();
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
    
    console.log('📊 NAVIGATION BUG STATUS CHECK');
    console.log('Database:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database not found');
      return;
    }
    
    const db = new SQL.Database(fs.readFileSync(dbPath));
    
    // Check per-mode settings
    console.log('\n=== PER-MODE SETTINGS ===');
    const modeSettings = db.exec(`
      SELECT navigation_mode, header_height, user_id, updated_at 
      FROM user_navigation_mode_settings 
      WHERE user_id = 'default'
      ORDER BY navigation_mode
    `);
    
    if (modeSettings[0] && modeSettings[0].values.length > 0) {
      console.log('✓ Found per-mode settings:');
      modeSettings[0].values.forEach(row => {
        const [mode, height, userId, updated] = row;
        console.log(`  ${mode}: ${height}px (updated: ${updated})`);
      });
      
      // Check for expected values
      const fullSidebarRow = modeSettings[0].values.find(row => row[0] === 'full-sidebar');
      if (fullSidebarRow) {
        const height = fullSidebarRow[1];
        if (height === 36) {
          console.log('  ✅ Full-sidebar correctly set to 36px');
        } else {
          console.log(`  ❌ Full-sidebar is ${height}px, should be 36px`);
        }
      } else {
        console.log('  ❌ Full-sidebar setting missing');
      }
    } else {
      console.log('❌ NO per-mode settings found');
      console.log('   → This explains why all modes show same height!');
      console.log('   → DatabaseNavigationService.fixHeaderHeights() needs to run');
    }
    
    // Check global preferences
    console.log('\n=== GLOBAL PREFERENCES ===');
    const globalPrefs = db.exec(`
      SELECT navigation_mode, header_height, updated_at 
      FROM user_navigation_preferences 
      WHERE user_id = 'default' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (globalPrefs[0] && globalPrefs[0].values.length > 0) {
      const [mode, height, updated] = globalPrefs[0].values[0];
      console.log(`Current global: ${mode} mode, ${height}px header (${updated})`);
      
      if (height === 160) {
        console.log('  → All modes inherit this 160px when per-mode settings missing');
      }
    } else {
      console.log('❌ No global preferences found');
    }
    
    // Problem diagnosis
    console.log('\n=== PROBLEM DIAGNOSIS ===');
    if (!modeSettings[0] || modeSettings[0].values.length === 0) {
      console.log('🚨 ROOT CAUSE: Missing per-mode settings in user_navigation_mode_settings');
      console.log('📋 SOLUTION: Run DatabaseNavigationService.fixHeaderHeights()');
      console.log('   → This will create missing per-mode entries with correct heights');
    } else {
      const allCorrect = modeSettings[0].values.every(row => {
        const [mode, height] = row;
        if (mode === 'full-sidebar') return height === 36;
        return height === 160; // header-statistics and header-navigation
      });
      
      if (allCorrect) {
        console.log('✅ All per-mode heights correct - bug might be in frontend logic');
      } else {
        console.log('❌ Some per-mode heights incorrect - database fix needed');
      }
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickNavigationStatusCheck();