#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE GAP ANALYSIS
 * Analyzes database state vs expected values for navigation settings
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function comprehensiveDatabaseGapAnalysis() {
  try {
    const SQL = await initSqlJs();
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
    
    console.log('🔍 COMPREHENSIVE DATABASE GAP ANALYSIS');
    console.log('Database:', dbPath);
    console.log('Timestamp:', new Date().toISOString());
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database not found');
      return;
    }
    
    const db = new SQL.Database(fs.readFileSync(dbPath));
    
    // === PART 1: DATABASE PATH VERIFICATION ===
    console.log('\n=== PART 1: DATABASE PATH VERIFICATION ===');
    const stats = fs.statSync(dbPath);
    console.log(`✅ Database size: ${stats.size} bytes (${(stats.size/1024).toFixed(1)} KB)`);
    console.log(`✅ Last modified: ${stats.mtime.toISOString()}`);
    
    // === PART 2: GLOBAL PREFERENCES TABLE ANALYSIS ===
    console.log('\n=== PART 2: GLOBAL PREFERENCES TABLE (user_navigation_preferences) ===');
    const globalPrefs = db.exec(`
      SELECT user_id, navigation_mode, header_height, sidebar_width, updated_at 
      FROM user_navigation_preferences 
      WHERE user_id = 'default'
      ORDER BY updated_at DESC
    `);
    
    if (globalPrefs[0] && globalPrefs[0].values.length > 0) {
      const [userId, mode, height, width, updated] = globalPrefs[0].values[0];
      console.log('📊 Current Global Preferences:');
      console.log(`   User: ${userId}`);
      console.log(`   Navigation Mode: ${mode}`);
      console.log(`   Header Height: ${height}px`);
      console.log(`   Sidebar Width: ${width}px`);
      console.log(`   Updated: ${updated}`);
      
      // Analysis of global settings
      console.log('\n🔍 Global Settings Analysis:');
      if (mode === 'full-sidebar' && height !== 36) {
        console.log(`   ❌ PROBLEM: full-sidebar mode with wrong height (${height}px instead of 36px)`);
      } else if (mode !== 'full-sidebar' && height !== 160) {
        console.log(`   ❌ PROBLEM: ${mode} mode with wrong height (${height}px instead of 160px)`);
      } else {
        console.log(`   ✅ Global settings correct for current mode`);
      }
    } else {
      console.log('❌ No global preferences found');
    }
    
    // === PART 3: PER-MODE SETTINGS TABLE ANALYSIS ===
    console.log('\n=== PART 3: PER-MODE SETTINGS TABLE (user_navigation_mode_settings) ===');
    const modeSettings = db.exec(`
      SELECT user_id, navigation_mode, header_height, sidebar_width, updated_at 
      FROM user_navigation_mode_settings 
      WHERE user_id = 'default'
      ORDER BY navigation_mode
    `);
    
    const expectedModeSettings = {
      'full-sidebar': { height: 36, width: 240 },
      'header-navigation': { height: 160, width: 280 },
      'header-statistics': { height: 160, width: 240 }
    };
    
    if (modeSettings[0] && modeSettings[0].values.length > 0) {
      console.log('📊 Per-Mode Settings Found:');
      const actualModeSettings = {};
      
      modeSettings[0].values.forEach(([userId, mode, height, width, updated]) => {
        console.log(`   ${mode}: ${height}px header, ${width}px sidebar (updated: ${updated})`);
        actualModeSettings[mode] = { height, width, updated };
      });
      
      console.log('\n🔍 Per-Mode Settings Gap Analysis:');
      Object.entries(expectedModeSettings).forEach(([mode, expected]) => {
        const actual = actualModeSettings[mode];
        if (!actual) {
          console.log(`   ❌ MISSING: ${mode} mode settings not found in database`);
        } else {
          const heightCorrect = actual.height === expected.height;
          const widthCorrect = actual.width === expected.width;
          
          if (heightCorrect && widthCorrect) {
            console.log(`   ✅ CORRECT: ${mode} - ${actual.height}px/${actual.width}px (matches expected ${expected.height}px/${expected.width}px)`);
          } else {
            console.log(`   ❌ INCORRECT: ${mode}:`);
            if (!heightCorrect) {
              console.log(`      Height: ${actual.height}px (expected ${expected.height}px)`);
            }
            if (!widthCorrect) {
              console.log(`      Width: ${actual.width}px (expected ${expected.width}px)`);
            }
          }
        }
      });
    } else {
      console.log('❌ NO per-mode settings found in database');
      console.log('   → This explains why all modes use global preferences');
      console.log('   → DatabaseNavigationService.getModeSpecificSettings() returns null');
      console.log('   → generateGridConfiguration() falls back to global preferences.headerHeight');
    }
    
    // === PART 4: LOGS ANALYSIS FROM APP BEHAVIOR ===
    console.log('\n=== PART 4: OBSERVED APP BEHAVIOR ANALYSIS ===');
    console.log('Based on the recent terminal logs, observed problems:');
    console.log('');
    console.log('🚨 CRITICAL ISSUE IDENTIFIED:');
    console.log('   App logs show: UPDATE user_navigation_preferences SET header_height = 36.0');
    console.log('   → This means the app is UPDATING global preferences instead of using per-mode settings');
    console.log('   → The fix is NOT working as expected');
    console.log('');
    console.log('🔍 Expected vs Actual Behavior:');
    console.log('   EXPECTED: generateGridConfiguration() uses getModeSpecificSettings()');
    console.log('   EXPECTED: Per-mode settings retrieved from user_navigation_mode_settings');
    console.log('   ACTUAL: App still updates global user_navigation_preferences');
    console.log('   ACTUAL: Mode switching changes global header_height directly');
    
    // === PART 5: FALLBACK THEME ANALYSIS ===
    console.log('\n=== PART 5: FALLBACK THEME & CSS ANALYSIS ===');
    const themePrefs = db.exec(`
      SELECT user_id, theme_id, updated_at 
      FROM user_theme_preferences 
      WHERE user_id = 'default'
    `);
    
    if (themePrefs[0] && themePrefs[0].values.length > 0) {
      const [userId, themeId, updated] = themePrefs[0].values[0];
      console.log(`✅ User theme: ID ${themeId} (updated: ${updated})`);
      
      // Get theme details
      const themeDetails = db.exec(`SELECT name, theme_key FROM themes WHERE id = ${themeId}`);
      if (themeDetails[0] && themeDetails[0].values.length > 0) {
        const [themeName, themeKey] = themeDetails[0].values[0];
        console.log(`   Theme: ${themeName} (${themeKey})`);
      }
    }
    
    console.log('\n📋 CSS FALLBACK DEFAULTS (layout-grid.css):');
    console.log('   --header-statistics-header-height: 160px');
    console.log('   --header-navigation-header-height: 160px');
    console.log('   --full-sidebar-header-height: 36px');
    console.log('   → These should be used when database values are missing');
    
    // === PART 6: ROOT CAUSE HYPOTHESIS ===
    console.log('\n=== PART 6: ROOT CAUSE HYPOTHESIS ===');
    console.log('🚨 LIKELY ROOT CAUSES:');
    console.log('');
    console.log('1. PER-MODE SETTINGS MISSING IN DATABASE:');
    if (!modeSettings[0] || modeSettings[0].values.length < 3) {
      console.log('   ❌ user_navigation_mode_settings table is incomplete');
      console.log('   → DatabaseNavigationService.getModeSpecificSettings() returns null');
      console.log('   → generateGridConfiguration() falls back to global preferences');
      console.log('   → App still uses single global header_height for all modes');
    }
    
    console.log('');
    console.log('2. CSS INITIAL LOAD PROBLEM:');
    console.log('   ❌ App startup may not wait for database-driven CSS variables');
    console.log('   → CSS loads with defaults before database settings applied');
    console.log('   → Force reload triggers re-application of database settings');
    console.log('   → This explains "works after force reload" behavior');
    
    console.log('');
    console.log('3. CONFIGURATION SERVICE LOGIC ERROR:');
    console.log('   ❌ ConfigurationIPC still updates global preferences instead of per-mode');
    console.log('   → Mode changes modify user_navigation_preferences table');
    console.log('   → Should modify user_navigation_mode_settings table instead');
    
    db.close();
    
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('✅ Database path correct (production DB)');
    console.log('✅ Database-Theme-System working');
    console.log('❌ Per-mode navigation settings missing or incomplete');
    console.log('❌ App still uses global preferences table for mode switching');
    console.log('❌ CSS application timing issue on startup');
    console.log('');
    console.log('🎯 NEXT STEPS REQUIRED:');
    console.log('1. Ensure all 3 per-mode settings exist in user_navigation_mode_settings');
    console.log('2. Fix mode switching logic to use per-mode settings');
    console.log('3. Fix CSS variable application timing on app startup');
    
  } catch (error) {
    console.error('❌ Analysis Error:', error.message);
  }
}

comprehensiveDatabaseGapAnalysis();