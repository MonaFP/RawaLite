#!/usr/bin/env node

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

const dbPath = join(homedir(), 'AppData', 'Roaming', 'Electron', 'database', 'rawalite.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath, { readonly: true });

console.log('\n=== COMPACT FOCUS MODE ANALYSIS ===');

// Check user_navigation_mode_settings for mode-compact-focus
const modeSettings = db.prepare(`
  SELECT id, user_id, navigation_mode, grid_template_areas, grid_template_rows, 
         grid_template_columns, header_height, sidebar_width, updated_at
  FROM user_navigation_mode_settings
  WHERE navigation_mode = 'mode-compact-focus'
`).all();

console.log('\n📋 Mode-Specific Settings for mode-compact-focus:');
if (modeSettings.length > 0) {
  modeSettings.forEach(setting => {
    console.log(`  ID: ${setting.id} - User: ${setting.user_id}`);
    console.log(`  Grid Areas: ${setting.grid_template_areas}`);
    console.log(`  Grid Rows: ${setting.grid_template_rows}`);
    console.log(`  Grid Columns: ${setting.grid_template_columns}`);
    console.log(`  Header Height: ${setting.header_height}px`);
    console.log(`  Sidebar Width: ${setting.sidebar_width}px`);
    console.log(`  Last Updated: ${setting.updated_at}`);
    console.log('');
  });
} else {
  console.log('  ❌ No mode-specific settings found for mode-compact-focus');
}

// Check global navigation preferences
const globalPrefs = db.prepare(`
  SELECT user_id, navigation_mode, header_height, sidebar_width, updated_at
  FROM user_navigation_preferences
  WHERE user_id = 'default'
`).get();

console.log('\n📋 Global Navigation Preferences:');
if (globalPrefs) {
  console.log(`  Current Mode: ${globalPrefs.navigation_mode}`);
  console.log(`  Header Height: ${globalPrefs.header_height}px`);
  console.log(`  Sidebar Width: ${globalPrefs.sidebar_width}px`);
  console.log(`  Last Updated: ${globalPrefs.updated_at}`);
} else {
  console.log('  ❌ No global navigation preferences found');
}

// Check theme system for compact focus mode
const themePrefs = db.prepare(`
  SELECT user_id, theme_id, updated_at
  FROM user_theme_preferences
  WHERE user_id = 'default'
`).get();

console.log('\n🎨 Theme Preferences:');
if (themePrefs) {
  console.log(`  Theme ID: ${themePrefs.theme_id}`);
  console.log(`  Last Updated: ${themePrefs.updated_at}`);
  
  // Get theme details
  const theme = db.prepare(`
    SELECT id, name, display_name, is_system
    FROM themes
    WHERE id = ?
  `).get(themePrefs.theme_id);
  
  if (theme) {
    console.log(`  Theme Name: ${theme.name} (${theme.display_name})`);
    console.log(`  System Theme: ${theme.is_system ? 'Yes' : 'No'}`);
  }
} else {
  console.log('  ❌ No theme preferences found');
}

// Check all navigation modes available
console.log('\n📋 All Available Navigation Mode Settings:');
const allModes = db.prepare(`
  SELECT DISTINCT navigation_mode, COUNT(*) as settings_count
  FROM user_navigation_mode_settings
  GROUP BY navigation_mode
  ORDER BY navigation_mode
`).all();

allModes.forEach(mode => {
  console.log(`  ${mode.navigation_mode}: ${mode.settings_count} settings`);
});

// Check if compact focus mode fallback issues
console.log('\n🔍 FALLBACK ANALYSIS:');

// Check for CSS variable fallbacks in database
const fallbackCheck = db.prepare(`
  SELECT navigation_mode, header_height, sidebar_width, grid_template_areas
  FROM user_navigation_mode_settings
  WHERE navigation_mode IN ('mode-compact-focus', 'mode-dashboard-view', 'mode-data-panel')
  ORDER BY navigation_mode
`).all();

console.log('\nComparison across all navigation modes:');
fallbackCheck.forEach(mode => {
  console.log(`${mode.navigation_mode}:`);
  console.log(`  Header: ${mode.header_height}px, Sidebar: ${mode.sidebar_width}px`);
  console.log(`  Grid: ${mode.grid_template_areas}`);
});

db.close();
console.log('\n✅ Analysis complete!');