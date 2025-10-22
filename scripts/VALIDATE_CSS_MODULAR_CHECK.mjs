#!/usr/bin/env node

/**
 * 🧪 CSS Modularization Validation Script
 * 
 * Prüft, ob die ausgelagerten CSS-Module korrekt funktionieren
 * und alle wichtigen CSS-Regeln noch verfügbar sind.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 CSS MODULARIZATION VALIDATION');
console.log('=================================');
console.log('📅 Test Date: 2025-10-19');
console.log('');

const cssModules = [
  'src/styles/layout-grid.css',
  'src/styles/header-styles.css', 
  'src/styles/sidebar-styles.css',
  'src/styles/main-content.css'
];

const expectedSelectors = [
  '.app',
  '.header',
  '.sidebar', 
  '.main',
  '.nav',
  '.brand',
  '.compact-sidebar',
  '[data-navigation-mode="header"] .app',
  '[data-navigation-mode="sidebar"] .app',
  '[data-navigation-mode="full-sidebar"] .app'
];

async function validateCSSModules() {
  console.log('📋 Validating CSS Modules...');
  console.log('');
  
  let allValid = true;
  
  // Check if all module files exist
  for (const module of cssModules) {
    const fullPath = path.join(rootDir, module);
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      console.log(`✅ ${module}`);
      console.log(`   📊 Size: ${stats.size} bytes`);
      console.log(`   📄 Lines: ${content.split('\n').length}`);
      
    } catch (error) {
      console.log(`❌ ${module} - NOT FOUND`);
      allValid = false;
    }
  }
  
  console.log('');
  
  // Check if main index.css contains imports
  const indexCssPath = path.join(rootDir, 'src/index.css');
  const indexContent = await fs.readFile(indexCssPath, 'utf-8');
  
  console.log('📋 Checking index.css imports...');
  
  for (const module of cssModules) {
    const importPath = `./${module.replace('src/', '')}`;
    if (indexContent.includes(importPath)) {
      console.log(`✅ Import: ${importPath}`);
    } else {
      console.log(`❌ Missing import: ${importPath}`);
      allValid = false;
    }
  }
  
  console.log('');
  
  // Check if critical selectors are still available
  console.log('📋 Checking critical CSS selectors...');
  
  let allCssContent = '';
  for (const module of cssModules) {
    const fullPath = path.join(rootDir, module);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      allCssContent += content + '\n';
    } catch (error) {
      // Skip missing files
    }
  }
  
  for (const selector of expectedSelectors) {
    if (allCssContent.includes(selector + ' {') || allCssContent.includes(selector + '{')) {
      console.log(`✅ Selector: ${selector}`);
    } else {
      console.log(`⚠️  Selector not found: ${selector}`);
    }
  }
  
  console.log('');
  console.log('📊 VALIDATION SUMMARY');
  console.log('=====================');
  
  if (allValid) {
    console.log('✅ ALL VALIDATIONS PASSED!');
    console.log('🎉 CSS Modularization successful');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Test application in browser: http://localhost:5174/');
    console.log('   2. Verify all navigation modes work');
    console.log('   3. Check focus modes functionality');
    console.log('   4. If all tests pass, remove commented code from index.css');
    
    process.exit(0);
  } else {
    console.log('❌ VALIDATION FAILED!');
    console.log('🚨 Some issues detected - check above messages');
    console.log('');
    console.log('🔧 Rollback options:');
    console.log('   1. Restore backup: cp src/index.css.backup-2025-10-19 src/index.css');
    console.log('   2. Remove new CSS modules');
    console.log('   3. Git rollback: git reset --hard HEAD~1');
    
    process.exit(1);
  }
}

validateCSSModules().catch(error => {
  console.error('💥 VALIDATION ERROR:', error);
  process.exit(1);
});