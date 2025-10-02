#!/usr/bin/env node
/**
 * Build Cleanup Script
 * Löst File-Locking Probleme durch komplettes Cleanup vor Build
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Build-Cleanup: Starting comprehensive cleanup...');

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    try {
      // Forceful removal for Windows file-locking issues
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        console.log(`🗑️ Windows cleanup: ${dir}`);
        execSync(`rmdir /s /q "${dir}"`, { stdio: 'ignore' });
      } else {
        fs.rmSync(dir, { recursive: true, force: true });
      }
      console.log(`✅ Cleaned: ${dir}`);
    } catch (error) {
      console.warn(`⚠️ Could not fully clean ${dir}:`, error.message);
    }
  }
}

function cleanNodeModulesCache() {
  const nodeModulesCache = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesCache)) {
    cleanDirectory(nodeModulesCache);
  }
}

// Main cleanup sequence
try {
  const buildDirs = [
    'dist-electron',
    'dist-web', 
    'release',
    'release-fixed',
    'release-new'
  ];

  buildDirs.forEach(dir => {
    cleanDirectory(path.join(process.cwd(), dir));
  });

  cleanNodeModulesCache();

  console.log('✅ Build cleanup completed successfully');
  
} catch (error) {
  console.error('❌ Build cleanup failed:', error.message);
  process.exit(1);
}