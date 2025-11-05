#!/usr/bin/env node
/**
 * INSPECT_NAVIGATION_PER_MODE_DATA.mjs
 * 
 * Quick inspection tool for per-mode navigation settings
 * Shows all user settings grouped by mode to verify independence
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

try {
  // Database path (production location)
  const dbPath = path.join(process.env.APPDATA || process.env.HOME, 'rawalite', 'database', 'rawalite.db');
  
  log('\n=== NAVIGATION PER-MODE DATA INSPECTION ===', 'cyan');
  log(`Database: ${dbPath}\n`, 'gray');
  
  // Open database
  const db = new Database(dbPath, { readonly: true });
  
  // Query per-mode settings
  const settings = db.prepare(`
    SELECT 
      user_id,
      navigation_mode,
      header_height,
      sidebar_width,
      auto_collapse_mobile,
      auto_collapse_tablet,
      remember_dimensions,
      created_at,
      updated_at
    FROM user_navigation_mode_settings
    ORDER BY user_id, navigation_mode
  `).all();
  
  if (settings.length === 0) {
    log('⚠️ No data found in user_navigation_mode_settings', 'yellow');
    process.exit(0);
  }
  
  // Group by user
  const userGroups = {};
  settings.forEach(row => {
    if (!userGroups[row.user_id]) {
      userGroups[row.user_id] = [];
    }
    userGroups[row.user_id].push(row);
  });
  
  // Display results
  log('📊 Per-Mode Settings by User:\n', 'green');
  
  Object.keys(userGroups).forEach(userId => {
    log(`User: ${userId}`, 'cyan');
    log('─'.repeat(80), 'gray');
    
    userGroups[userId].forEach(setting => {
      log(`  Mode: ${setting.navigation_mode}`, 'yellow');
      log(`    Header Height: ${setting.header_height}px`, 'gray');
      log(`    Sidebar Width: ${setting.sidebar_width}px`, 'gray');
      log(`    Auto-collapse Mobile: ${setting.auto_collapse_mobile}`, 'gray');
      log(`    Auto-collapse Tablet: ${setting.auto_collapse_tablet}`, 'gray');
      log(`    Remember Dimensions: ${setting.remember_dimensions}`, 'gray');
      log(`    Updated: ${setting.updated_at}`, 'gray');
      console.log();
    });
    
    log('', 'reset');
  });
  
  // Verification checks
  log('✓ VERIFICATION CHECKS:', 'green');
  
  // Check 1: Multiple rows per user
  Object.keys(userGroups).forEach(userId => {
    const count = userGroups[userId].length;
    if (count === 3) {
      log(`  ✓ User ${userId}: ${count} mode configurations (CORRECT)`, 'green');
    } else {
      log(`  ⚠️ User ${userId}: ${count} mode configurations (Expected 3!)`, 'yellow');
    }
  });
  
  // Check 2: Unique values per mode (settings are independent)
  Object.keys(userGroups).forEach(userId => {
    const heights = userGroups[userId].map(s => s.header_height);
    const uniqueHeights = new Set(heights);
    
    if (uniqueHeights.size > 1) {
      log(`  ✓ User ${userId}: Different heights per mode (Per-mode working!)`, 'green');
    } else {
      log(`  ⚠️ User ${userId}: Same height for all modes (Might be default values)`, 'yellow');
    }
  });
  
  log('\n=== INSPECTION COMPLETE ===', 'cyan');
  
  db.close();
  process.exit(0);
  
} catch (error) {
  log(`\n❌ ERROR: ${error.message}`, 'red');
  log(`Stack: ${error.stack}`, 'gray');
  process.exit(1);
}
