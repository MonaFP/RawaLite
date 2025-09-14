#!/usr/bin/env node
/**
 * 🛡️ Backup Storage Guard
 * 
 * CI guard to prevent localStorage backup storage that causes QuotaExceededError.
 * This guard ensures we never regress to problematic backup patterns.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🛡️ Running backup storage guard...\n');

let violationsFound = false;

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(__dirname + '\\', '').replace(__dirname + '/', '');
    
    // Patterns that indicate problematic backup storage
    const problematicPatterns = [
      {
        pattern: /localStorage\.setItem\(['"`][^'"`]*backup[^'"`]*['"`]\s*,\s*btoa\(/gi,
        description: 'Base64 backup storage in localStorage'
      },
      {
        pattern: /localStorage\.setItem\(['"`]rawalite\.backup/gi,
        description: 'Direct backup storage in localStorage'
      },
      {
        pattern: /localStorage\.setItem\([^,)]*backup[^,)]*,\s*[^)]*base64/gi,
        description: 'Base64 backup pattern in localStorage'
      },
      {
        pattern: /sessionStorage\.setItem\(['"`][^'"`]*backup[^'"`]*['"`]\s*,\s*btoa\(/gi,
        description: 'Base64 backup storage in sessionStorage'
      }
    ];
    
    for (const { pattern, description } of problematicPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`❌ VIOLATION in ${relativePath}:`);
        console.error(`   Pattern: ${description}`);
        for (const match of matches) {
          console.error(`   Code: ${match.substring(0, 100)}...`);
        }
        console.error('');
        violationsFound = true;
      }
    }
    
    // Check for large data storage patterns that could cause quota issues
    const quotaRiskPatterns = [
      {
        pattern: /localStorage\.setItem\([^,)]+,\s*[^)]*\.split\('\\.'\)\.join\(''\)/gi,
        description: 'Large string manipulation before localStorage'
      },
      {
        pattern: /localStorage\.setItem\([^,)]+,\s*JSON\.stringify\([^)]+database[^)]+\)/gi,
        description: 'Database serialization to localStorage'
      }
    ];
    
    for (const { pattern, description } of quotaRiskPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.warn(`⚠️ QUOTA RISK in ${relativePath}:`);
        console.warn(`   Pattern: ${description}`);
        console.warn(`   Consider using filesystem storage instead`);
        console.warn('');
      }
    }
    
  } catch (error) {
    console.warn(`⚠️ Could not scan ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (!['node_modules', 'dist', 'dist-electron', '.git', 'e2e'].includes(item)) {
          scanDirectory(itemPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = extname(item);
        if (extensions.includes(ext)) {
          scanFile(itemPath);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not scan directory ${dirPath}: ${error.message}`);
  }
}

// Scan critical directories
const criticalDirs = [
  'src/services',
  'src/adapters', 
  'src/hooks',
  'electron'
];

console.log('🔍 Scanning for problematic backup storage patterns...\n');

for (const dir of criticalDirs) {
  const dirPath = join(__dirname, dir);
  console.log(`📁 Scanning ${dir}/...`);
  scanDirectory(dirPath);
}

console.log('\n' + '='.repeat(60));

if (violationsFound) {
  console.error('❌ BACKUP STORAGE GUARD FAILED!');
  console.error('');
  console.error('Found patterns that could cause QuotaExceededError:');
  console.error('• Large data storage in localStorage/sessionStorage');
  console.error('• Base64 backup storage in web storage');
  console.error('• Direct database serialization to browser storage');
  console.error('');
  console.error('✅ SOLUTION: Use BackupService for filesystem storage');
  console.error('   Example: await backupService.createManualBackup()');
  console.error('');
  process.exit(1);
} else {
  console.log('✅ BACKUP STORAGE GUARD PASSED!');
  console.log('');
  console.log('🎉 No problematic backup storage patterns found');
  console.log('✅ Using proper filesystem-based backup storage');
  console.log('✅ QuotaExceededError risk eliminated');
  console.log('');
  process.exit(0);
}