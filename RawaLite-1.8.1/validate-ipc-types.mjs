#!/usr/bin/env node
/**
 * validate-ipc-types.mjs
 * 
 * Validiert dass IPC-Definitionen zwischen preload.ts und types/ipc.ts konsistent sind.
 * Teil der CI Guards gemäß COPILOT_INSTRUCTIONS.md Security Requirements.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 IPC Types Validator - Checking preload.ts vs types/ipc.ts...');

try {
  // preload.ts lesen
  const preloadPath = join('electron', 'preload.ts');
  const preloadContent = readFileSync(preloadPath, 'utf8');
  
  // IPC types lesen  
  const ipcTypesPath = join('src', 'types', 'ipc.ts');
  let ipcTypesContent = '';
  try {
    ipcTypesContent = readFileSync(ipcTypesPath, 'utf8');
  } catch (error) {
    console.warn('⚠️ No types/ipc.ts found - creating minimal validation');
  }
  
  // IPC-Handler aus preload extrahieren
  const handlerMatches = preloadContent.match(/ipcRenderer\.invoke\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
  const handlers = handlerMatches.map(match => {
    const handlerMatch = match.match(/['"`]([^'"`]+)['"`]/);
    return handlerMatch ? handlerMatch[1] : null;
  }).filter(Boolean);
  
  console.log(`📡 Found ${handlers.length} IPC handlers in preload.ts:`);
  handlers.forEach(handler => console.log(`   - ${handler}`));
  
  // Basis-Security checks
  const securityIssues = [];
  
  // Check für dynamic IPC calls (Sicherheitsrisiko)
  if (preloadContent.match(/ipcRenderer\.invoke\s*\(\s*[^'"`]/)) {
    securityIssues.push('Dynamic IPC channel names detected (security risk)');
  }
  
  // Check für shell access (verboten per COPILOT_INSTRUCTIONS)
  if (preloadContent.includes('shell.openExternal')) {
    securityIssues.push('Direct shell access in preload (forbidden by COPILOT_INSTRUCTIONS)');
  }
  
  // Check für Node.js modules (nur über IPC erlaubt)
  if (preloadContent.match(/require\s*\(\s*['"`](?!electron)/)) {
    securityIssues.push('Direct Node.js module imports in preload (use IPC instead)');
  }
  
  console.log(`\n🔒 Security check results:`);
  if (securityIssues.length === 0) {
    console.log('✅ No security issues detected');
  } else {
    console.error('❌ Security issues found:');
    securityIssues.forEach(issue => console.error(`   - ${issue}`));
  }
  
  // IPC Types Konsistenz-Check
  if (ipcTypesContent) {
    console.log('\n📋 IPC Types consistency check:');
    
    // Check ob alle Handler in types definiert sind
    const missingTypes = [];
    handlers.forEach(handler => {
      if (!ipcTypesContent.includes(handler)) {
        missingTypes.push(handler);
      }
    });
    
    if (missingTypes.length === 0) {
      console.log('✅ All IPC handlers have type definitions');
    } else {
      console.warn('⚠️ Missing type definitions for:');
      missingTypes.forEach(handler => console.warn(`   - ${handler}`));
    }
  }
  
  // Fazit
  if (securityIssues.length > 0) {
    console.error('\n❌ IPC validation failed due to security issues');
    process.exit(1);
  } else {
    console.log('\n✅ IPC validation passed!');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Error validating IPC types:', error.message);
  process.exit(1);
}