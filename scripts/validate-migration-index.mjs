#!/usr/bin/env node
// scripts/validate-migration-index.mjs
// Validates that all migration files are properly indexed

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Validating Migration Index Consistency...');

const migrationDir = join(projectRoot, 'src/main/db/migrations');
const indexPath = join(migrationDir, 'index.ts');

if (!existsSync(migrationDir)) {
  console.error('❌ Migration directory not found:', migrationDir);
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error('❌ Migration index file not found:', indexPath);
  process.exit(1);
}

// 1. Find all migration files
const migrationFiles = readdirSync(migrationDir)
  .filter(file => file.match(/^\d{3}_.*\.ts$/))
  .filter(file => file !== 'index.ts')
  .sort();

console.log(`📂 Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(file => console.log(`   - ${file}`));

// 2. Read index.ts content
const indexContent = readFileSync(indexPath, 'utf8');

// 3. Validate imports
const missingImports = [];
const extraImports = [];

migrationFiles.forEach(file => {
  const importName = file.slice(0, -3); // Remove .ts
  const importPattern = `import * as migration${file.slice(0,3)} from './${importName}';`;
  
  if (!indexContent.includes(importPattern)) {
    missingImports.push({ file, pattern: importPattern });
  }
});

// 4. Check that we just have the right imports and they're used in the array
const missingEntries = [];
migrationFiles.forEach(file => {
  const migrationNumber = file.slice(0, 3);
  const migrationName = file.slice(0, -3);
  
  // Check if migration is referenced in the array (flexible matching)
  const arrayPattern = `name: '${migrationName}'`;
  
  if (!indexContent.includes(arrayPattern)) {
    missingEntries.push({ 
      file, 
      name: migrationName,
    });
  }
});

// 5. Report results
let hasErrors = false;

if (missingImports.length > 0) {
  hasErrors = true;
  console.error('\n❌ Missing imports in index.ts:');
  missingImports.forEach(({ file, pattern }) => {
    console.error(`   📋 File: ${file}`);
    console.error(`   📋 Add: ${pattern}`);
  });
}

if (missingEntries.length > 0) {
  hasErrors = true;
  console.error('\n❌ Missing entries in migrations array:');
  missingEntries.forEach(({ file, name }) => {
    console.error(`   📋 File: ${file}`);
    console.error(`   📋 Add migration entry with name: '${name}'`);
  });
}

if (!hasErrors) {
  console.log('\n✅ Migration index validation passed!');
  console.log(`✅ All ${migrationFiles.length} migrations properly indexed`);
} else {
  console.error('\n🚨 Migration index validation FAILED!');
  console.error('🔧 Fix required before proceeding with builds or releases');
  process.exit(1);
}