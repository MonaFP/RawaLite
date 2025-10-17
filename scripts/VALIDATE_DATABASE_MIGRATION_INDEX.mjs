#!/usr/bin/env node

/**
 * 🔍 MIGRATION INDEX VALIDATION SCRIPT
 * 
 * Validates that all migrations in /src/main/db/migrations/ are properly indexed
 * and that the migration numbers are sequential without gaps.
 * 
 * Usage:
 *   node scripts/validate-migration-index.mjs
 *   pnpm validate:migrations
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 RawaLite Migration Index Validation');
console.log('=====================================');

let hasErrors = false;

try {
  // 1. Read migration files from filesystem
  const migrationsDir = join(__dirname, '..', 'src', 'main', 'db', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .sort();

  console.log(`📁 Found ${migrationFiles.length} migration files in filesystem:`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // 2. Extract migration numbers from filenames
  const migrationNumbers = migrationFiles.map(file => {
    const match = file.match(/^(\d{3})_/);
    if (!match) {
      console.error(`❌ Invalid migration filename: ${file}`);
      hasErrors = true;
      return null;
    }
    return parseInt(match[1], 10);
  }).filter(num => num !== null);

  // 3. Check for sequential numbering (migrations start at 000, not 001)
  console.log('🔢 Checking migration numbering sequence...');
  const maxMigrationNumber = Math.max(...migrationNumbers);
  const expectedNumbers = Array.from({ length: maxMigrationNumber + 1 }, (_, i) => i);
  const missingNumbers = expectedNumbers.filter(num => !migrationNumbers.includes(num));
  const duplicateNumbers = migrationNumbers.filter((num, idx) => migrationNumbers.indexOf(num) !== idx);

  if (missingNumbers.length > 0) {
    console.error(`❌ Missing migration numbers: ${missingNumbers.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('   ✅ No missing migration numbers');
  }

  if (duplicateNumbers.length > 0) {
    console.error(`❌ Duplicate migration numbers: ${duplicateNumbers.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('   ✅ No duplicate migration numbers');
  }

  // 4. Read and validate index.ts
  console.log('');
  console.log('📋 Validating migration index.ts...');
  
  const indexPath = join(migrationsDir, 'index.ts');
  const indexContent = readFileSync(indexPath, 'utf8');

  // Extract migration imports from index.ts
  const importLines = indexContent.split('\n').filter(line => line.trim().startsWith('import'));
  const exportedMigrations = [];
  
  // Find the migrations array in index.ts - improved regex for multiline arrays
  const arrayMatch = indexContent.match(/export\s+const\s+migrations:\s*Migration\[\]\s*=\s*\[([\s\S]*?)\];\s*export\s+default/);
  if (!arrayMatch) {
    console.error('❌ Could not find migrations array in index.ts');
    hasErrors = true;
  } else {
    // Count migration objects in the array
    const arrayContent = arrayMatch[1];
    // Count occurrences of "version:" which indicates a migration object
    const migrationMatches = arrayContent.match(/version:\s*\d+/g);
    const migrationCount = migrationMatches ? migrationMatches.length : 0;
    exportedMigrations.length = migrationCount; // Set array length to migration count
    console.log(`📤 Found ${migrationCount} migration objects in exports array`);
  }

  console.log(`📦 Found ${importLines.length} imports in index.ts`);

  // 5. Cross-reference filesystem vs index.ts
  const indexedMigrationNumbers = [];
  migrationFiles.forEach(file => {
    const migrationName = file.replace('.ts', '');
    const migrationNumber = file.match(/^(\d{3})_/)[1];
    
    // Check if migration is imported
    const hasImport = importLines.some(line => line.includes(migrationName));
    if (!hasImport) {
      console.error(`❌ Migration ${file} not imported in index.ts`);
      hasErrors = true;
    }
    
    // Check if migration is in exports array by looking for version number in index.ts
    const hasExport = indexContent.includes(`name: '${migrationName}'`);
    if (!hasExport) {
      console.error(`❌ Migration ${file} not included in exports array`);
      hasErrors = true;
    }
    
    if (hasImport && hasExport) {
      indexedMigrationNumbers.push(parseInt(migrationNumber, 10));
    }
  });

  // 6. Final validation summary
  console.log('');
  console.log('📊 Migration Index Validation Summary:');
  console.log(`   - Filesystem migrations: ${migrationFiles.length}`);
  console.log(`   - Indexed migrations: ${indexedMigrationNumbers.length}`);
  console.log(`   - Latest migration: ${Math.max(...migrationNumbers).toString().padStart(3, '0')}`);

  if (migrationFiles.length === indexedMigrationNumbers.length && !hasErrors) {
    console.log('');
    console.log('✅ Migration index validation PASSED');
    console.log('🎯 All migrations are properly indexed and sequential');
  } else {
    console.error('');
    console.error('❌ Migration index validation FAILED');
    hasErrors = true;
  }

} catch (error) {
  console.error('❌ Migration validation error:', error.message);
  hasErrors = true;
}

if (hasErrors) {
  console.error('');
  console.error('🔧 Required actions:');
  console.error('   1. Fix missing/duplicate migration numbers');
  console.error('   2. Update src/main/db/migrations/index.ts imports');
  console.error('   3. Update src/main/db/migrations/index.ts exports array');
  console.error('   4. Run: pnpm validate:migrations');
  process.exit(1);
} else {
  console.log('');
  console.log('🎉 Migration index is consistent and ready for production');
}