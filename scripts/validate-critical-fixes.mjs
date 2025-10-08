#!/usr/bin/env node

/**
 * Critical Fixes Validation Script
 * 
 * Validates that all critical fixes from CRITICAL-FIXES-REGISTRY.md 
 * are present in the codebase. Prevents regression of known fixes.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Define critical fixes that must be present
const CRITICAL_FIXES = {
  'writestream-race-condition': {
    file: 'src/main/services/GitHubApiService.ts',
    pattern: /await new Promise<void>\(\(resolve, reject\) => {\s*writeStream\.end\(\(error\?\: Error\) => {/,
    description: 'Promise-based WriteStream completion in GitHubApiService'
  },
  
  'file-system-flush-delay': {
    file: 'src/main/services/UpdateManagerService.ts',
    pattern: /await new Promise\(resolve => setTimeout\(resolve, 100\)\);[\s\S]*?const stats = await fs\.stat\(filePath\);/,
    description: '100ms file system flush delay in verifyDownload'
  },
  
  'installation-event-handler-race': {
    file: 'src/main/services/UpdateManagerService.ts',
    pattern: /process\.on\('close', \(code\) => {\s*clearTimeout\(timeout\);/,
    description: 'Single close event handler with timeout cleanup'
  },
  
  'port-consistency-vite': {
    file: 'vite.config.mts',
    pattern: /server:\s*{\s*port:\s*5174\s*}/,
    description: 'Port 5174 in vite config'
  },
  
  'port-consistency-main': {
    file: 'electron/main.ts',
    pattern: /win\.loadURL\('http:\/\/localhost:5174'\)/,
    description: 'Port 5174 in electron main'
  },
  
  'status-control-responsive-design': {
    file: 'src/index.css',
    pattern: /\.status-control-button\s*{[\s\S]*?min-width:\s*120px;[\s\S]*?}[\s\S]*?@media\s*\(max-width:\s*768px\)\s*{[\s\S]*?\.status-control-button\s*{[\s\S]*?min-height:\s*44px;/,
    description: 'StatusControl component with responsive design and touch optimization'
  },
  
  'responsive-card-layout': {
    file: 'src/index.css',
    pattern: /@media\s*\(max-width:\s*480px\)\s*{[\s\S]*?\.table-card-view\s*{[\s\S]*?display:\s*block;[\s\S]*?}[\s\S]*?@media\s*\(min-width:\s*481px\)\s*{[\s\S]*?\.table-card-view\s*{[\s\S]*?display:\s*none\s*!important;/,
    description: 'Responsive card layout with proper media query isolation'
  },
  
  'database-status-updates': {
    file: 'src/main/services/EntityStatusService.ts',
    pattern: /export function updateEntityStatus[\s\S]*?expectedVersion[\s\S]*?BEGIN IMMEDIATE[\s\S]*?StatusUpdateConflictError/,
    description: 'Database-driven status updates with optimistic locking'
  },
  
  'status-migration-versioning': {
    file: 'src/main/db/migrations/015_add_status_versioning.ts',
    pattern: /ALTER TABLE offers ADD COLUMN version INTEGER NOT NULL DEFAULT 0[\s\S]*?CREATE TABLE offer_status_history/,
    description: 'Migration 015: Status versioning and history tracking'
  },
  
  'status-ipc-handlers': {
    file: 'electron/main.ts',
    pattern: /ipcMain\.handle\('status:updateOfferStatus'[\s\S]*?updateEntityStatus[\s\S]*?ipcMain\.handle\('status:updateInvoiceStatus'/,
    description: 'IPC handlers for database-driven status updates'
  },
  
  'abi-management-system': {
    file: 'scripts/rebuild-native-electron.cjs',
    pattern: /console\.log\('🔄 \[Rebuild\] Attempt 1: Standard rebuild\.\.\.'\);[\s\S]*?const r1 = spawnSync\('pnpm', \['rebuild', 'better-sqlite3', '--verbose'\][\s\S]*?console\.log\('🔄 \[Rebuild\] Attempt 2: Remove and reinstall\.\.\.'\);/,
    description: 'ABI Management System with fallback recovery for better-sqlite3'
  },
  
  'vite-asset-import-pattern': {
    file: 'src/components/NavigationOnlySidebar.tsx',
    pattern: /import logoUrl from ['"][.\/]*assets\/rawalite-logo\.png['"];[\s\S]*?src={logoUrl}/,
    description: 'Vite asset import pattern for production logo loading'
  }
};

// Color output functions
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function validateCriticalFixes() {
  console.log(colors.blue(colors.bold('🔍 CRITICAL FIXES VALIDATION')));
  console.log('=' .repeat(50));
  
  let allValid = true;
  let checkedFixes = 0;
  let validFixes = 0;
  
  for (const [fixId, fix] of Object.entries(CRITICAL_FIXES)) {
    checkedFixes++;
    console.log(`\n${colors.blue(`[${checkedFixes}/${Object.keys(CRITICAL_FIXES).length}]`)} ${fix.description}`);
    console.log(`   File: ${fix.file}`);
    
    // Check if file exists
    if (!existsSync(fix.file)) {
      console.log(colors.red(`   ❌ ERROR: File does not exist!`));
      allValid = false;
      continue;
    }
    
    // Read file content
    try {
      const content = readFileSync(fix.file, 'utf8');
      
      // Test pattern
      if (fix.pattern.test(content)) {
        console.log(colors.green(`   ✅ VALID: Pattern found`));
        validFixes++;
      } else {
        console.log(colors.red(`   ❌ MISSING: Critical pattern not found!`));
        console.log(colors.yellow(`   📋 Expected pattern: ${fix.pattern.source}`));
        allValid = false;
      }
      
    } catch (error) {
      console.log(colors.red(`   ❌ ERROR: Could not read file - ${error.message}`));
      allValid = false;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(colors.bold('📊 VALIDATION SUMMARY'));
  console.log(`   Total fixes checked: ${checkedFixes}`);
  console.log(`   Valid fixes found: ${colors.green(validFixes)}`);
  console.log(`   Missing fixes: ${colors.red(checkedFixes - validFixes)}`);
  
  if (allValid) {
    console.log(colors.green(colors.bold('\n✅ ALL CRITICAL FIXES VALIDATED SUCCESSFULLY!')));
    console.log(colors.green('   Safe to proceed with build/release.'));
    process.exit(0);
  } else {
    console.log(colors.red(colors.bold('\n🚨 CRITICAL FIXES VALIDATION FAILED!')));
    console.log(colors.red('   DO NOT PROCEED WITH BUILD/RELEASE!'));
    console.log(colors.yellow('\n📋 ACTION REQUIRED:'));
    console.log(colors.yellow('   1. Check docs/00-meta/CRITICAL-FIXES-REGISTRY.md'));
    console.log(colors.yellow('   2. Re-implement missing patterns'));
    console.log(colors.yellow('   3. Run validation again'));
    process.exit(1);
  }
}

// Additional validation for common anti-patterns
function validateAntiPatterns() {
  console.log(colors.blue('\n🔍 CHECKING FOR DANGEROUS ANTI-PATTERNS'));
  
  const antiPatterns = {
    'dangerous-writestream-end': {
      file: 'src/main/services/GitHubApiService.ts',
      pattern: /writeStream\.end\(\);\s*$/m,
      description: 'Dangerous synchronous writeStream.end() without Promise'
    },
    'missing-file-flush-delay': {
      file: 'src/main/services/UpdateManagerService.ts', 
      pattern: /const stats = await fs\.stat\(filePath\);\s*$/m,
      description: 'fs.stat() without file system flush delay'
    },
    'dangerous-electron-rebuild': {
      file: 'package.json',
      pattern: /"rebuild:electron":\s*"electron-rebuild"/,
      description: 'Dangerous npx electron-rebuild (compiles for Node.js ABI instead of Electron)'
    },
    'absolute-logo-paths': {
      file: 'src/components/NavigationOnlySidebar.tsx',
      pattern: /src=['"][\/]rawalite-logo\.png['"]/,
      description: 'Absolute logo paths that fail in production Electron builds'
    }
  };
  
  let antiPatternsFound = false;
  
  for (const [patternId, pattern] of Object.entries(antiPatterns)) {
    if (existsSync(pattern.file)) {
      const content = readFileSync(pattern.file, 'utf8');
      if (pattern.pattern.test(content)) {
        console.log(colors.red(`   ⚠️  ANTI-PATTERN DETECTED: ${pattern.description}`));
        antiPatternsFound = true;
      }
    }
  }
  
  if (!antiPatternsFound) {
    console.log(colors.green('   ✅ No dangerous anti-patterns detected'));
  }
}

// Main execution
try {
  validateCriticalFixes();
  validateAntiPatterns();
} catch (error) {
  console.error(colors.red(`\n🚨 VALIDATION SCRIPT ERROR: ${error.message}`));
  process.exit(1);
}