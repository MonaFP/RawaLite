#!/usr/bin/env node

/**
 * RawaLite Scripts Registry Validation
 * Validates synchronization between filesystem and registry documentation
 * 
 * Usage: node scripts/VALIDATE_SCRIPTS_REGISTRY_SYNC.mjs
 */

import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');
const scriptsDir = join(projectRoot, 'scripts');
const registryFile = join(projectRoot, 'docs', 'ROOT_VALIDATED_REGISTRY-SCRIPTS-OVERVIEW_2025-10-17.md');
const packageJsonFile = join(projectRoot, 'package.json');

// Script categories and valid patterns
const VALID_CATEGORIES = ['BUILD', 'VALIDATE', 'DEV', 'MAINTAIN', 'ANALYZE', 'DOCS'];
const VALID_EXTENSIONS = ['.cjs', '.mjs', '.js', '.ts', '.ps1', '.cmd'];
const SCHEMA_PATTERN = /^(BUILD|VALIDATE|DEV|MAINTAIN|ANALYZE|DOCS)_[A-Z0-9_]+_[A-Z0-9_]+_[A-Z0-9_]+\.(cjs|mjs|js|ts|ps1|cmd)$/;

console.log('🔍 SCRIPTS REGISTRY VALIDATION');
console.log('==================================================\n');

async function getFilesystemScripts() {
  try {
    const files = await readdir(scriptsDir);
    return files
      .filter(file => {
        const ext = file.substring(file.lastIndexOf('.'));
        return VALID_EXTENSIONS.includes(ext) && file !== 'SCHEMA_SCRIPT_RENAMING_PLAN.md';
      })
      .sort();
  } catch (error) {
    console.error('❌ ERROR: Could not read scripts directory:', error.message);
    process.exit(1);
  }
}

async function getRegistryScripts() {
  try {
    const content = await readFile(registryFile, 'utf8');
    const scriptPattern = /\| \d+ \| ([A-Z0-9_]+\.[a-z0-9]+) \|/g;
    const scripts = [];
    let match;
    
    while ((match = scriptPattern.exec(content)) !== null) {
      scripts.push(match[1]);
    }
    
    return scripts.sort();
  } catch (error) {
    console.error('❌ ERROR: Could not read registry file:', error.message);
    process.exit(1);
  }
}

async function getPackageJsonScripts() {
  try {
    const content = await readFile(packageJsonFile, 'utf8');
    const packageJson = JSON.parse(content);
    const scripts = packageJson.scripts || {};
    
    const scriptReferences = new Set();
    for (const [key, value] of Object.entries(scripts)) {
      // Extract script references from command strings
      const matches = value.match(/scripts\/([A-Z_]+\.[a-z0-9]+)/g);
      if (matches) {
        matches.forEach(match => {
          const scriptName = match.replace('scripts/', '');
          scriptReferences.add(scriptName);
        });
      }
    }
    
    return Array.from(scriptReferences).sort();
  } catch (error) {
    console.error('❌ ERROR: Could not read package.json:', error.message);
    process.exit(1);
  }
}

function validateSchemaCompliance(scripts) {
  console.log('📋 SCHEMA COMPLIANCE CHECK');
  console.log('─'.repeat(50));
  
  let compliant = 0;
  let violations = 0;
  
  for (const script of scripts) {
    if (SCHEMA_PATTERN.test(script)) {
      console.log(`   ✅ ${script}`);
      compliant++;
    } else {
      console.log(`   ❌ ${script} (Schema violation)`);
      violations++;
    }
  }
  
  console.log(`\n📊 Schema Compliance: ${compliant}/${scripts.length} (${((compliant/scripts.length)*100).toFixed(1)}%)`);
  
  if (violations > 0) {
    console.log(`🚨 ${violations} scripts violate KATEGORIE_SCOPE_SUBJECT_ACTION.ext schema!`);
    return false;
  }
  
  return true;
}

function compareLists(name1, list1, name2, list2) {
  console.log(`\n🔄 COMPARING ${name1.toUpperCase()} vs ${name2.toUpperCase()}`);
  console.log('─'.repeat(50));
  
  const set1 = new Set(list1);
  const set2 = new Set(list2);
  
  const onlyIn1 = list1.filter(item => !set2.has(item));
  const onlyIn2 = list2.filter(item => !set1.has(item));
  const common = list1.filter(item => set2.has(item));
  
  console.log(`📁 ${name1}: ${list1.length} scripts`);
  console.log(`📋 ${name2}: ${list2.length} scripts`);
  console.log(`🤝 Common: ${common.length} scripts`);
  
  if (onlyIn1.length > 0) {
    console.log(`\n❌ Only in ${name1} (${onlyIn1.length}):`);
    onlyIn1.forEach(script => console.log(`   - ${script}`));
  }
  
  if (onlyIn2.length > 0) {
    console.log(`\n❌ Only in ${name2} (${onlyIn2.length}):`);
    onlyIn2.forEach(script => console.log(`   - ${script}`));
  }
  
  if (onlyIn1.length === 0 && onlyIn2.length === 0) {
    console.log('✅ Perfect synchronization!');
    return true;
  }
  
  return false;
}

function analyzeCategoryDistribution(scripts) {
  console.log('\n📊 CATEGORY ANALYSIS');
  console.log('─'.repeat(50));
  
  const distribution = {};
  const extensions = {};
  
  for (const script of scripts) {
    const match = script.match(/^([A-Z]+)_/);
    if (match) {
      const category = match[1];
      distribution[category] = (distribution[category] || 0) + 1;
    }
    
    const ext = script.substring(script.lastIndexOf('.'));
    extensions[ext] = (extensions[ext] || 0) + 1;
  }
  
  console.log('Categories:');
  for (const [category, count] of Object.entries(distribution).sort()) {
    const percentage = ((count / scripts.length) * 100).toFixed(1);
    console.log(`   ${category}: ${count} (${percentage}%)`);
  }
  
  console.log('\nFile Extensions:');
  for (const [ext, count] of Object.entries(extensions).sort()) {
    const percentage = ((count / scripts.length) * 100).toFixed(1);
    console.log(`   ${ext}: ${count} (${percentage}%)`);
  }
}

async function validateScriptExecution(scripts) {
  console.log('\n🧪 SCRIPT EXISTENCE CHECK');
  console.log('─'.repeat(50));
  
  let existing = 0;
  let missing = 0;
  
  for (const script of scripts) {
    try {
      await access(join(scriptsDir, script));
      console.log(`   ✅ ${script}`);
      existing++;
    } catch {
      console.log(`   ❌ ${script} (File not found)`);
      missing++;
    }
  }
  
  console.log(`\n📁 File Existence: ${existing}/${scripts.length} (${((existing/scripts.length)*100).toFixed(1)}%)`);
  
  return missing === 0;
}

async function main() {
  try {
    // Get all script lists
    const filesystemScripts = await getFilesystemScripts();
    const registryScripts = await getRegistryScripts();
    const packageJsonScripts = await getPackageJsonScripts();
    
    console.log(`📁 Filesystem Scripts: ${filesystemScripts.length}`);
    console.log(`📋 Registry Scripts: ${registryScripts.length}`);
    console.log(`📦 Package.json References: ${packageJsonScripts.length}\n`);
    
    // Validate schema compliance
    const schemaValid = validateSchemaCompliance(filesystemScripts);
    
    // Compare filesystem vs registry
    const fsRegistrySync = compareLists('Filesystem', filesystemScripts, 'Registry', registryScripts);
    
    // Compare filesystem vs package.json
    const fsPkgSync = compareLists('Filesystem', filesystemScripts, 'Package.json', packageJsonScripts);
    
    // Validate file existence
    const filesExist = await validateScriptExecution([...new Set([...filesystemScripts, ...registryScripts])]);
    
    // Analyze distribution
    analyzeCategoryDistribution(filesystemScripts);
    
    // Final summary
    console.log('\n==================================================');
    console.log('📊 VALIDATION SUMMARY');
    console.log('==================================================');
    
    const results = [
      { check: 'Schema Compliance', status: schemaValid },
      { check: 'Filesystem ↔ Registry Sync', status: fsRegistrySync },
      { check: 'File Existence', status: filesExist },
      { check: 'Package.json Coverage', status: packageJsonScripts.length >= (filesystemScripts.length * 0.6) } // 60% threshold
    ];
    
    results.forEach(({ check, status }) => {
      console.log(`   ${status ? '✅' : '❌'} ${check}`);
    });
    
    const allPassed = results.every(r => r.status);
    
    if (allPassed) {
      console.log('\n🎉 ALL VALIDATIONS PASSED!');
      console.log('   Scripts registry is fully synchronized and compliant.');
      process.exit(0);
    } else {
      console.log('\n🚨 VALIDATION FAILURES DETECTED!');
      console.log('   Please review and fix the issues above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main();