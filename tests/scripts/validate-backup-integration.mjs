#!/usr/bin/env node
/**
 * 🧪 Backup Integration Validation
 * 
 * Validates that the new filesystem-based backup system is properly integrated
 * and eliminates QuotaExceededError issues.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔄 Validating backup system integration...\n');

// Check if critical files exist
const criticalFiles = [
  'src/services/BackupService.ts',
  'electron/backup.ts',
  'src/types/ipc.ts'
];

let validationPassed = true;

console.log('📁 Checking critical backup files...');
for (const file of criticalFiles) {
  const filePath = join(__dirname, file);
  if (!existsSync(filePath)) {
    console.error(`❌ Missing critical file: ${file}`);
    validationPassed = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

// Check MigrationService localStorage elimination
console.log('\n🔍 Checking MigrationService localStorage usage...');
try {
  const migrationServicePath = join(__dirname, 'src/services/MigrationService.ts');
  const migrationContent = readFileSync(migrationServicePath, 'utf8');
  
  const storagePatterns = [
    /localStorage\.setItem\(['"].*backup.*['"].*\)/i,
    /localStorage\.getItem\(['"].*backup.*['"].*\)/i,
    /localStorage\.setItem\(.*btoa\(/i,  // Base64 storage pattern
    /localStorage\.setItem\(.*backup.*\+.*base64/i
  ];
  
  let found = false;
  for (const pattern of storagePatterns) {
    if (pattern.test(migrationContent)) {
      console.error(`❌ Found problematic localStorage backup usage in MigrationService`);
      found = true;
      validationPassed = false;
    }
  }
  
  if (!found) {
    console.log('✅ No problematic localStorage backup usage found in MigrationService');
  }
  
  // Check if BackupService is imported
  if (migrationContent.includes('from \'./BackupService\'')) {
    console.log('✅ BackupService properly imported in MigrationService');
  } else {
    console.error('❌ BackupService not imported in MigrationService');
    validationPassed = false;
  }
  
} catch (error) {
  console.error(`❌ Error reading MigrationService: ${error.message}`);
  validationPassed = false;
}

// Check UpdateService integration
console.log('\n🔍 Checking UpdateService backup integration...');
try {
  const updateServicePath = join(__dirname, 'src/services/UpdateService.ts');
  const updateContent = readFileSync(updateServicePath, 'utf8');
  
  if (updateContent.includes('backupService.createPreUpdateBackup')) {
    console.log('✅ UpdateService uses BackupService for pre-update backups');
  } else {
    console.error('❌ UpdateService does not use BackupService for pre-update backups');
    validationPassed = false;
  }
  
  if (updateContent.includes('from \'./BackupService\'')) {
    console.log('✅ BackupService properly imported in UpdateService');
  } else {
    console.error('❌ BackupService not imported in UpdateService');
    validationPassed = false;
  }
  
} catch (error) {
  console.error(`❌ Error reading UpdateService: ${error.message}`);
  validationPassed = false;
}

// Check IPC type definitions
console.log('\n🔍 Checking IPC type definitions...');
try {
  const ipcTypesPath = join(__dirname, 'src/types/ipc.ts');
  const ipcContent = readFileSync(ipcTypesPath, 'utf8');
  
  const requiredTypes = [
    'BackupAPI',
    'BackupCreateOptions',
    'BackupCreateResult',
    'backup:create',
    'backup:list',
    'backup:prune'
  ];
  
  for (const type of requiredTypes) {
    if (ipcContent.includes(type)) {
      console.log(`✅ Found IPC type/channel: ${type}`);
    } else {
      console.error(`❌ Missing IPC type/channel: ${type}`);
      validationPassed = false;
    }
  }
  
} catch (error) {
  console.error(`❌ Error reading IPC types: ${error.message}`);
  validationPassed = false;
}

// Check main process integration
console.log('\n🔍 Checking main process backup integration...');
try {
  const mainPath = join(__dirname, 'electron/main.ts');
  const mainContent = readFileSync(mainPath, 'utf8');
  
  if (mainContent.includes('./backup')) {
    console.log('✅ Backup module imported in main process');
  } else {
    console.error('❌ Backup module not imported in main process');
    validationPassed = false;
  }
  
  if (mainContent.includes('initializeBackupSystem')) {
    console.log('✅ Backup system initialized in main process');
  } else {
    console.error('❌ Backup system not initialized in main process');
    validationPassed = false;
  }
  
} catch (error) {
  console.error(`❌ Error reading main process: ${error.message}`);
  validationPassed = false;
}

// Check preload exposure
console.log('\n🔍 Checking preload API exposure...');
try {
  const preloadPath = join(__dirname, 'electron/preload.ts');
  const preloadContent = readFileSync(preloadPath, 'utf8');
  
  if (preloadContent.includes('backup:')) {
    console.log('✅ Backup API exposed in preload');
  } else {
    console.error('❌ Backup API not exposed in preload');
    validationPassed = false;
  }
  
} catch (error) {
  console.error(`❌ Error reading preload: ${error.message}`);
  validationPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (validationPassed) {
  console.log('🎉 ALL VALIDATIONS PASSED!');
  console.log('✅ Backup system properly integrated');
  console.log('✅ QuotaExceededError should be eliminated');
  console.log('✅ Ready for testing');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED!');
  console.log('⚠️  Fix the above issues before testing');
  process.exit(1);
}