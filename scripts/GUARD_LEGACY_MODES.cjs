#!/usr/bin/env node

/**
 * Legacy Guard Script - Prevent Legacy Mode Regression
 * 
 * ✅ STRATEGIE ENFORCER: Legacy darf NICHT "mitlaufen"
 * - Scannt Codebase nach Legacy mode references
 * - Verhindert künftige Legacy-Regressionen
 * - Teil des Pre-commit Workflows
 * 
 * @version 1.0.59
 * @date 2025-10-24
 * @author GitHub Copilot (KI-SESSION-BRIEFING compliant)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ✅ LEGACY PATTERNS die NICHT erlaubt sind (außer in Kompatibilitäts-Schicht)
const FORBIDDEN_LEGACY_PATTERNS = [
  // Legacy mode names in code
  {
    pattern: /['"`]header-statistics['"`]/g,
    description: 'Legacy mode: header-statistics',
    allowedFiles: [
      'src/types/navigation-safe.ts',
      'src/services/DatabaseNavigationService.ts',
      'src/types/footer-types.ts',
      // ✅ MIGRATION FILES: Diese SOLLEN Legacy enthalten für DB-Kompatibilität
      'src/main/db/migrations/028_add_navigation_system.ts',
      'src/main/db/migrations/030_fix_navigation_mode_values.ts',
      'src/main/db/migrations/031_increase_header_height_limit.ts',
      'src/main/db/migrations/032_increase_header_height_to_220px.ts',
      'src/main/db/migrations/033_normalize_header_navigation_height.ts',
      'src/main/db/migrations/037_centralized_configuration_architecture.ts',
      'src/main/db/migrations/038_correct_header_heights_final.ts',
      'src/main/db/migrations/039_fix_full_sidebar_header_height.ts',
      'src/main/db/migrations/040_fix_navigation_preferences_constraint.ts',
      'src/main/db/migrations/041_add_footer_content_preferences.ts',
      'src/main/db/migrations/042_convert_legacy_navigation_modes.ts'
    ]
  },
  {
    pattern: /['"`]header-navigation['"`]/g,
    description: 'Legacy mode: header-navigation',
    allowedFiles: [
      'src/types/navigation-safe.ts',
      'src/services/DatabaseNavigationService.ts',
      'src/types/footer-types.ts',
      // ✅ MIGRATION FILES: Diese SOLLEN Legacy enthalten für DB-Kompatibilität
      'src/main/db/migrations/028_add_navigation_system.ts',
      'src/main/db/migrations/030_fix_navigation_mode_values.ts',
      'src/main/db/migrations/031_increase_header_height_limit.ts',
      'src/main/db/migrations/032_increase_header_height_to_220px.ts',
      'src/main/db/migrations/033_normalize_header_navigation_height.ts',
      'src/main/db/migrations/037_centralized_configuration_architecture.ts',
      'src/main/db/migrations/038_correct_header_heights_final.ts',
      'src/main/db/migrations/039_fix_full_sidebar_header_height.ts',
      'src/main/db/migrations/040_fix_navigation_preferences_constraint.ts',
      'src/main/db/migrations/041_add_footer_content_preferences.ts',
      'src/main/db/migrations/042_convert_legacy_navigation_modes.ts'
    ]
  },
  {
    pattern: /['"`]full-sidebar['"`]/g,
    description: 'Legacy mode: full-sidebar',
    allowedFiles: [
      'src/types/navigation-safe.ts',
      'src/services/DatabaseNavigationService.ts',
      'src/types/footer-types.ts',
      // ✅ MIGRATION FILES: Diese SOLLEN Legacy enthalten für DB-Kompatibilität
      'src/main/db/migrations/028_add_navigation_system.ts',
      'src/main/db/migrations/030_fix_navigation_mode_values.ts',
      'src/main/db/migrations/031_increase_header_height_limit.ts',
      'src/main/db/migrations/032_increase_header_height_to_220px.ts',
      'src/main/db/migrations/033_normalize_header_navigation_height.ts',
      'src/main/db/migrations/037_centralized_configuration_architecture.ts',
      'src/main/db/migrations/038_correct_header_heights_final.ts',
      'src/main/db/migrations/039_fix_full_sidebar_header_height.ts',
      'src/main/db/migrations/040_fix_navigation_preferences_constraint.ts',
      'src/main/db/migrations/041_add_footer_content_preferences.ts',
      'src/main/db/migrations/042_convert_legacy_navigation_modes.ts'
    ]
  },  // Legacy type names
  {
    pattern: /LegacyNavigationMode(?!\s*=|\s*\|)/g,
    description: 'LegacyNavigationMode type usage (should be isolated)',
    allowedFiles: [
      'src/types/navigation-safe.ts',
      'src/services/DatabaseNavigationService.ts',
      'src/types/footer-types.ts'
    ]
  },
  
  // Anti-patterns
  {
    pattern: /NAVIGATION_MODES\s*=\s*\[[\s\S]*header-statistics[\s\S]*\]/g,
    description: 'NAVIGATION_MODES array containing legacy modes',
    allowedFiles: []
  },
  {
    pattern: /for\s*\(\s*const\s+\w+\s+of\s+.*NAVIGATION_MODES.*\)[\s\S]*header-statistics/g,
    description: 'Iteration over NAVIGATION_MODES with legacy mode handling',
    allowedFiles: []
  }
];

// ✅ FILES TO SCAN
const SCAN_DIRECTORIES = [
  'src/',
  'electron/',
  'tests/'
];

const EXCLUDE_PATTERNS = [
  '.test.',
  '.spec.',
  'node_modules/',
  'dist/',
  'build/',
  'docs/',
  'scripts/'
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    if (shouldExcludeFile(relativePath)) {
      return;
    }
    
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, allFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      allFiles.push(relativePath);
    }
  });
  
  return allFiles;
}

function scanFileForPatterns(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  FORBIDDEN_LEGACY_PATTERNS.forEach(({ pattern, description, allowedFiles }) => {
    const matches = content.match(pattern);
    
    if (matches) {
      // Check if file is in allowed list
      const normalizedFilePath = filePath.replace(/\\/g, '/');
      const isAllowed = allowedFiles.some(allowed => 
        normalizedFilePath.endsWith(allowed) || normalizedFilePath.includes(allowed)
      );
      
      if (!isAllowed) {
        violations.push({
          file: filePath,
          pattern: pattern.toString(),
          description,
          matches: matches.length,
          content: matches
        });
      }
    }
  });
  
  return violations;
}

function main() {
  console.log('🔍 Legacy Guard - Scanning for legacy mode violations...');
  console.log('');
  
  let allFiles = [];
  
  SCAN_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(getAllFiles(dir));
    }
  });
  
  console.log(`📁 Scanning ${allFiles.length} files...`);
  
  let totalViolations = 0;
  const violationsByFile = new Map();
  
  allFiles.forEach(filePath => {
    const violations = scanFileForPatterns(filePath);
    if (violations.length > 0) {
      violationsByFile.set(filePath, violations);
      totalViolations += violations.length;
    }
  });
  
  if (totalViolations === 0) {
    console.log('✅ No legacy mode violations found!');
    console.log('');
    console.log('🛡️ Legacy isolation strategy is working correctly.');
    console.log('   • Legacy modes exist only in compatibility layer');
    console.log('   • UI/Services use only KI-safe modes');
    console.log('   • Footer functions use NAVIGATION_MODES_SAFE');
    process.exit(0);
  }
  
  console.log(`❌ Found ${totalViolations} legacy mode violations:`);
  console.log('');
  
  violationsByFile.forEach((violations, filePath) => {
    console.log(`📄 ${filePath}:`);
    violations.forEach(violation => {
      console.log(`   ❌ ${violation.description}`);
      console.log(`      Pattern: ${violation.pattern}`);
      console.log(`      Matches: ${violation.matches}`);
      console.log('');
    });
  });
  
  console.log('🚨 LEGACY ISOLATION VIOLATION DETECTED!');
  console.log('');
  console.log('❌ Legacy modes should NOT "mitlaufen" in active code.');
  console.log('✅ Legacy should exist ONLY in compatibility/migration layer:');
  console.log('   • src/types/navigation-safe.ts (conversion functions)');
  console.log('   • src/services/DatabaseNavigationService.ts (DB compatibility)');
  console.log('   • src/types/footer-types.ts (mapping constants)');
  console.log('');
  console.log('🔧 Fix violations by:');
  console.log('   1. Replace legacy modes with KI-safe modes');
  console.log('   2. Use NAVIGATION_MODES_SAFE instead of mixed arrays');
  console.log('   3. Normalize legacy → KI-safe at DB-Read/IPC entrance');
  console.log('   4. Avoid direct legacy mode usage in UI/Services');
  console.log('');
  
  process.exit(1);
}

// ✅ EMERGENCY BYPASS (für Migration)
if (process.argv.includes('--bypass')) {
  console.log('⚠️  Legacy Guard bypassed (--bypass flag)');
  console.log('   Use only during active migration!');
  process.exit(0);
}

main();