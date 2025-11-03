#!/usr/bin/env node

import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// SQL.js database analysis for compact focus mode
const dbPath = join(homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
console.log('🔍 Database path:', dbPath);

try {
  const SQL = await initSqlJs();
  const filebuffer = readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  console.log('\n=== COMPACT FOCUS MODE ANALYSIS ===');

  // Check user_navigation_mode_settings for mode-compact-focus
  console.log('\n📋 Mode-Specific Settings for mode-compact-focus:');
  let stmt = db.prepare(`
    SELECT id, user_id, navigation_mode, grid_template_areas, grid_template_rows, 
           grid_template_columns, header_height, sidebar_width, updated_at
    FROM user_navigation_mode_settings
    WHERE navigation_mode = 'mode-compact-focus'
  `);
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`  ID: ${row.id} - User: ${row.user_id}`);
    console.log(`  Grid Areas: ${row.grid_template_areas}`);
    console.log(`  Grid Rows: ${row.grid_template_rows}`);
    console.log(`  Grid Columns: ${row.grid_template_columns}`);
    console.log(`  Header Height: ${row.header_height}px`);
    console.log(`  Sidebar Width: ${row.sidebar_width}px`);
    console.log(`  Last Updated: ${row.updated_at}`);
    console.log('');
  }
  
  // Check global navigation preferences
  console.log('\n📋 Global Navigation Preferences:');
  stmt = db.prepare(`
    SELECT user_id, navigation_mode, header_height, sidebar_width, updated_at
    FROM user_navigation_preferences
    WHERE user_id = 'default'
  `);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`  Current Mode: ${row.navigation_mode}`);
    console.log(`  Header Height: ${row.header_height}px`);
    console.log(`  Sidebar Width: ${row.sidebar_width}px`);
    console.log(`  Last Updated: ${row.updated_at}`);
  } else {
    console.log('  ❌ No global navigation preferences found');
  }

  // Check theme system
  console.log('\n🎨 Theme Preferences:');
  stmt = db.prepare(`
    SELECT user_id, theme_id, updated_at
    FROM user_theme_preferences
    WHERE user_id = 'default'
  `);
  
  if (stmt.step()) {
    const themeRow = stmt.getAsObject();
    console.log(`  Theme ID: ${themeRow.theme_id}`);
    console.log(`  Last Updated: ${themeRow.updated_at}`);
    
    // Get theme details
    const themeStmt = db.prepare(`
      SELECT id, name, display_name, is_system
      FROM themes
      WHERE id = ?
    `);
    themeStmt.bind([themeRow.theme_id]);
    
    if (themeStmt.step()) {
      const theme = themeStmt.getAsObject();
      console.log(`  Theme Name: ${theme.name} (${theme.display_name})`);
      console.log(`  System Theme: ${theme.is_system ? 'Yes' : 'No'}`);
    }
  } else {
    console.log('  ❌ No theme preferences found');
  }

  // Check all navigation modes available
  console.log('\n📋 All Available Navigation Mode Settings:');
  stmt = db.prepare(`
    SELECT DISTINCT navigation_mode, COUNT(*) as settings_count
    FROM user_navigation_mode_settings
    GROUP BY navigation_mode
    ORDER BY navigation_mode
  `);
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`  ${row.navigation_mode}: ${row.settings_count} settings`);
  }

  // Check fallback comparison
  console.log('\n🔍 FALLBACK ANALYSIS:');
  console.log('\nComparison across all navigation modes:');
  
  stmt = db.prepare(`
    SELECT navigation_mode, header_height, sidebar_width, grid_template_areas
    FROM user_navigation_mode_settings
    WHERE navigation_mode IN ('mode-compact-focus', 'mode-dashboard-view', 'mode-data-panel')
    ORDER BY navigation_mode
  `);
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`${row.navigation_mode}:`);
    console.log(`  Header: ${row.header_height}px, Sidebar: ${row.sidebar_width}px`);
    console.log(`  Grid: ${row.grid_template_areas}`);
  }

  // Check for theme colors and fallbacks
  console.log('\n🎨 THEME SYSTEM ANALYSIS:');
  stmt = db.prepare(`SELECT COUNT(*) as theme_count FROM themes`);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    console.log(`Total themes available: ${row.theme_count}`);
  }

  stmt = db.prepare(`
    SELECT name, display_name, is_system
    FROM themes
    ORDER BY is_system DESC, name
  `);
  
  console.log('\nAvailable themes:');
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const systemFlag = row.is_system ? ' (System)' : '';
    console.log(`  ${row.name} - ${row.display_name}${systemFlag}`);
  }

  db.close();
  console.log('\n✅ Analysis complete!');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
}