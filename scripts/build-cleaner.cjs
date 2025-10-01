#!/usr/bin/env node
/**
 * Advanced Build Cleanup Script for RawaLite
 * Solves file-locking issues with Electron builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildCleaner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.lockFiles = [];
    this.cleanupPaths = [
      'dist',
      'dist-web', 
      'dist-electron',
      'build',
      'release',
      '.vite',
      'node_modules/.vite',
      '.cache',
      'out',
      '.tsbuildinfo'
    ];
  }

  log(message) {
    console.log(`🧹 ${message}`);
  }

  warn(message) {
    console.warn(`⚠️  ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  /**
   * Kill processes that might lock build files
   */
  killProcesses() {
    this.log('Stopping potentially blocking processes...');
    
    const processNames = ['electron', 'node', 'rawalite'];
    let stoppedAny = false;
    
    processNames.forEach(name => {
      try {
        if (this.isWindows) {
          // Windows: Kill by process name
          const result = execSync(`taskkill /f /im ${name}.exe 2>nul`, { stdio: 'pipe', encoding: 'utf8' });
          if (result.includes('ERFOLGREICH')) {
            this.log(`Stopped ${name} processes`);
            stoppedAny = true;
          }
        } else {
          // Unix: Kill by process name
          execSync(`pkill -f ${name}`, { stdio: 'ignore' });
          this.log(`Stopped ${name} processes`);
          stoppedAny = true;
        }
      } catch (error) {
        // Process not found or already stopped - this is OK
        // No need to log this as it's expected
      }
    });

    if (!stoppedAny) {
      this.log('No blocking processes found (this is good!)');
    }

    // Wait for handles to be released
    this.log('Waiting for file handles to be released...');
    this.sleep(500);
  }

  /**
   * Check which files are locked
   */
  findLockedFiles() {
    this.log('Scanning for locked files...');
    
    this.cleanupPaths.forEach(dirPath => {
      if (fs.existsSync(dirPath)) {
        this.scanDirectory(dirPath);
      }
    });

    if (this.lockFiles.length > 0) {
      this.warn(`Found ${this.lockFiles.length} potentially locked files:`);
      this.lockFiles.forEach(file => console.log(`  - ${file}`));
    }
  }

  scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (this.isLikelyLocked(fullPath)) {
          this.lockFiles.push(fullPath);
        }
      });
    } catch (error) {
      // Directory might be locked or inaccessible
      this.lockFiles.push(dir);
    }
  }

  isLikelyLocked(filePath) {
    // Check common lock-prone files
    const lockProneExtensions = ['.asar', '.exe', '.dll', '.node'];
    const lockProneNames = ['app.asar', 'electron.exe', 'node.exe'];
    
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);
    
    return lockProneExtensions.includes(ext) || lockProneNames.includes(basename);
  }

  /**
   * Force cleanup with retries
   */
  forceCleanup() {
    this.log('Starting force cleanup...');
    
    this.cleanupPaths.forEach(dirPath => {
      this.cleanupDirectory(dirPath);
    });
  }

  cleanupDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    this.log(`Cleaning ${dirPath}...`);
    
    // Try normal removal first
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      this.log(`✅ Removed ${dirPath}`);
      return;
    } catch (error) {
      this.warn(`Normal removal failed for ${dirPath}: ${error.message}`);
    }

    // Try platform-specific force removal
    this.platformSpecificCleanup(dirPath);
  }

  platformSpecificCleanup(dirPath) {
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (this.isWindows) {
          // Windows: Use robocopy to mirror empty directory
          const tempDir = path.join(__dirname, '.temp-empty');
          fs.mkdirSync(tempDir, { recursive: true });
          
          execSync(`robocopy "${tempDir}" "${dirPath}" /MIR`, { stdio: 'ignore' });
          fs.rmSync(tempDir, { recursive: true, force: true });
          fs.rmSync(dirPath, { recursive: true, force: true });
        } else {
          // Unix: Use rm with force
          execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
        }
        
        this.log(`✅ Force removed ${dirPath} (attempt ${i + 1})`);
        return;
      } catch (error) {
        this.warn(`Force removal attempt ${i + 1} failed for ${dirPath}`);
        this.sleep(500); // Wait before retry
      }
    }
    
    this.error(`Failed to remove ${dirPath} after ${maxRetries} attempts`);
  }

  /**
   * Validate cleanup success
   */
  validateCleanup() {
    this.log('Validating cleanup...');
    
    const remaining = this.cleanupPaths.filter(p => fs.existsSync(p));
    
    if (remaining.length === 0) {
      this.log('✅ All build artifacts cleaned successfully');
      return true;
    } else {
      this.warn(`⚠️  Some artifacts remain: ${remaining.join(', ')}`);
      return false;
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy wait for synchronous sleep
    }
  }

  /**
   * Main cleanup workflow
   */
  run() {
    console.log('🧹 RawaLite Advanced Build Cleaner');
    console.log('=====================================');
    
    // Step 1: Kill blocking processes
    this.killProcesses();
    
    // Step 2: Find locked files
    this.findLockedFiles();
    
    // Step 3: Force cleanup
    this.forceCleanup();
    
    // Step 4: Validate
    const success = this.validateCleanup();
    
    if (success) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('🚀 Ready for clean build');
    } else {
      console.log('\n⚠️  Cleanup partially completed');
      console.log('💡 Some files may still be locked - try restarting your terminal/IDE');
    }
    
    return success;
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const isProcessesOnly = args.includes('--processes-only');
  
  const cleaner = new BuildCleaner();
  
  if (isProcessesOnly) {
    console.log('🔄 Process-only cleanup...');
    try {
      cleaner.killProcesses();
      console.log('✅ Process cleanup completed');
      process.exit(0);
    } catch (error) {
      console.log('✅ Process cleanup completed (some processes may not have been running)');
      process.exit(0);
    }
  } else {
    const success = cleaner.run();
    process.exit(success ? 0 : 1);
  }
}

module.exports = BuildCleaner;