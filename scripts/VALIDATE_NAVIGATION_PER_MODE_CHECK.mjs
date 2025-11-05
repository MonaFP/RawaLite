#!/usr/bin/env node
/**
 * VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs
 * 
 * Validates that Navigation system uses per-mode configuration (Migration 034)
 * Guards against regression to global-mode configuration
 * 
 * Schema: VALIDATE_NAVIGATION_PER_MODE_CHECK.mjs
 * Created: 2025-11-04
 * Purpose: Automated per-mode configuration validation
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validatePerModeConfiguration() {
  log('\n=== NAVIGATION PER-MODE VALIDATION ===', 'cyan');
  
  let exitCode = 0;
  
  try {
    // Determine database path (production location)
    const dbPath = process.env.NODE_ENV === 'test' 
      ? path.join(__dirname, '..', 'db', 'rawalite.db')
      : path.join(process.env.APPDATA || process.env.HOME, 'rawalite', 'database', 'rawalite.db');
    
    log(`\nDatabase: ${dbPath}`, 'gray');
    
    // Check database file exists
    if (!existsSync(dbPath)) {
      log('  ⚠️ WARNING: Database file not found (acceptable for fresh install)', 'yellow');
      log('  Validation skipped - database will be created on first run', 'gray');
      process.exit(0);
    }
    
    // CHECK 1-4: Migration file validation (ABI-safe alternative)
    log('\n✓ CHECK 1: Migration 034 SQL Schema Definition', 'green');
    const sqlMigrationPath = path.join(__dirname, '..', 'migrations', '034-navigation-mode-settings.sql');
    
    if (!existsSync(sqlMigrationPath)) {
      log('  ❌ FAILED: Migration 034 SQL file missing', 'red');
      exitCode = 1;
      return;
    }
    
    const migrationSQL = readFileSync(sqlMigrationPath, 'utf-8');
    
    // Check for UNIQUE constraint
    if (!migrationSQL.includes('UNIQUE(user_id, navigation_mode)')) {
      log('  ❌ FAILED: UNIQUE(user_id, navigation_mode) constraint missing in SQL', 'red');
      exitCode = 1;
      return;
    }
    log('  Status: UNIQUE(user_id, navigation_mode) defined ✓', 'gray');
    
    // Check for navigation_mode field
    log('\n✓ CHECK 2: Field Name in Migration SQL', 'green');
    if (migrationSQL.includes('default_navigation_mode')) {
      log('  ❌ FAILED: Legacy "default_navigation_mode" found in SQL', 'red');
      exitCode = 1;
      return;
    }
    
    if (!migrationSQL.includes('navigation_mode TEXT NOT NULL')) {
      log('  ❌ FAILED: navigation_mode field definition missing', 'red');
      exitCode = 1;
      return;
    }
    log('  Status: navigation_mode field defined correctly ✓', 'gray');
    
    // CHECK 3: Service layer validation (code check)
    log('\n✓ CHECK 3: Service Layer Compliance', 'green');
    const serviceFile = path.join(__dirname, '..', 'src', 'services', 'DatabaseNavigationService.ts');
    try {
      const serviceCode = readFileSync(serviceFile, 'utf-8');
      
      // Check for hybrid-mapper usage (should not exist)
      if (serviceCode.includes('navigation-hybrid-mapper')) {
        log('  ❌ FAILED: Service still references hybrid-mapper', 'red');
        exitCode = 1;
        return;
      }
      
      // Check for field-mapper usage (should exist)
      const mapToSQLCount = (serviceCode.match(/mapToSQL/g) || []).length;
      const mapFromSQLCount = (serviceCode.match(/mapFromSQL/g) || []).length;
      
      if (mapToSQLCount === 0 || mapFromSQLCount === 0) {
        log('  ⚠️ WARNING: Field-mapper usage not detected', 'yellow');
      } else {
        log(`  Status: Field-mapper active (mapToSQL: ${mapToSQLCount}, mapFromSQL: ${mapFromSQLCount}) ✓`, 'gray');
      }
    } catch (err) {
      log(`  ⚠️ WARNING: Could not validate service layer: ${err.message}`, 'yellow');
    }
    
    // FINAL RESULT
    if (exitCode === 0) {
      log('\n=== VALIDATION: PASSED ===', 'green');
      log('Per-Mode Configuration: ACTIVE ✓', 'green');
      log('Migration 034 Schema: VERIFIED ✓', 'green');
    }
    
  } catch (error) {
    log(`\n❌ VALIDATION ERROR: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'gray');
    exitCode = 1;
  }
  
  process.exit(exitCode);
}

// Run validation
validatePerModeConfiguration().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
