#!/usr/bin/env node
/**
 * Database Path Consistency Validation (Simplified)
 * Verifies key scripts use the correct production database path
 * 
 * Added: 22.10.2025 - Post Database-Chaos Resolution
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Database Path Consistency Validation');
console.log('=' .repeat(60));

// Key files to check
const keyFiles = [
  'scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs',
  'debug-package-schema.mjs',
  'tests/debug/debug-db-sqljs.mjs',
  'tests/debug/inspect-navigation-settings.mjs'
];

// Expected production database path patterns (CORRECT)
const CORRECT_PATTERNS = [
  /AppData.*Roaming.*Electron.*database.*rawalite\.db/,
  /os\.homedir\(\).*AppData.*Roaming.*Electron.*database.*rawalite\.db/
];

// Problematic patterns that should NOT be used
const PROBLEMATIC_PATTERNS = [
  /\/db\/rawalite\.db/,
  /AppData.*Roaming.*rawalite.*database/,  // Wrong folder structure
  /AppData.*Roaming.*RawaLite.*database/,  // Wrong case
];

let totalChecked = 0;
let correctFiles = 0;
let problematicFiles = 0;
const issues = [];

console.log('📋 Checking key database-related files...\n');

for (const file of keyFiles) {
  const filePath = join(projectRoot, file);
  
  if (!existsSync(filePath)) {
    console.log(`⚠️  ${file} - File not found (may be archived)`);
    continue;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Skip if no database path references
    if (!content.includes('database') && !content.includes('rawalite.db')) {
      console.log(`➖ ${file} - No database references`);
      continue;
    }
    
    totalChecked++;
    
    let hasCorrectPattern = CORRECT_PATTERNS.some(pattern => pattern.test(content));
    let hasProblematicPattern = PROBLEMATIC_PATTERNS.some(pattern => pattern.test(content));
    
    if (hasCorrectPattern && !hasProblematicPattern) {
      correctFiles++;
      console.log(`✅ ${file} - Uses correct database path`);
    } else if (hasProblematicPattern) {
      problematicFiles++;
      console.log(`❌ ${file} - Uses problematic database path`);
      issues.push({
        file,
        reason: 'Uses deprecated /db path or wrong AppData structure'
      });
    } else {
      console.log(`❓ ${file} - Database path pattern unclear`);
    }
    
  } catch (error) {
    console.warn(`⚠️  Could not read ${file}: ${error.message}`);
  }
}

// Check the main production script specifically
console.log('\n🎯 MAIN PRODUCTION SCRIPT VERIFICATION:');
const mainScript = 'scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs';
const mainScriptPath = join(projectRoot, mainScript);

if (existsSync(mainScriptPath)) {
  const content = readFileSync(mainScriptPath, 'utf-8');
  const hasCorrectPattern = CORRECT_PATTERNS.some(pattern => pattern.test(content));
  
  if (hasCorrectPattern) {
    console.log(`✅ ${mainScript} - VERIFIED: Uses correct production database path`);
  } else {
    console.log(`❌ ${mainScript} - CRITICAL: Does not use correct production database path!`);
  }
} else {
  console.log(`❌ ${mainScript} - CRITICAL: Main analysis script not found!`);
}

console.log('\n📊 VALIDATION SUMMARY');
console.log('=' .repeat(40));
console.log(`Total files checked: ${totalChecked}`);
console.log(`✅ Correct database paths: ${correctFiles}`);
console.log(`❌ Problematic database paths: ${problematicFiles}`);
console.log(`📊 Success rate: ${totalChecked > 0 ? Math.round((correctFiles / totalChecked) * 100) : 0}%`);

if (issues.length > 0) {
  console.log('\n🚨 ISSUES FOUND:');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.file}`);
    console.log(`   Reason: ${issue.reason}`);
  });
  
  console.log('\n💡 RECOMMENDED ACTIONS:');
  console.log('1. Update problematic scripts to use: AppData/Roaming/Electron/database/rawalite.db');
  console.log('2. Archive or remove deprecated scripts in tests/debug/');
  console.log('3. Use scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs as reference');
} else {
  console.log('\n✅ All checked database paths are consistent!');
}

console.log('\n🎯 REFERENCE:');
console.log('✅ Correct production DB: C:\\Users\\ramon\\AppData\\Roaming\\Electron\\database\\rawalite.db');
console.log('📚 Documentation: docs/06-lessons/sessions/LESSON_FIX-DATABASE-MULTIPLE-INSTANCES-CHAOS_2025-10-22.md');
console.log('🗄️ DB-Chaos resolved: 22.10.2025');

process.exit(problematicFiles > 0 ? 1 : 0);