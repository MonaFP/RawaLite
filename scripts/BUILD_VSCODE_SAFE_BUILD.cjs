#!/usr/bin/env node
/**
 * VS Code-Safe Build Script
 * Solves file locking issues by using alternative approaches that work with VS Code running
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VSCodeSafeBuild {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.buildNumber = Date.now();
    this.tempDir = `temp-build-${this.buildNumber}`;
  }

  log(message) {
    console.log(`🛠️  ${message}`);
  }

  warn(message) {
    console.warn(`⚠️  ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Strategy 1: Build to temporary directory, then atomic move
   */
  async buildToTemp() {
    this.log('Building to temporary directory to avoid file locks...');
    
    try {
      // Create temp build directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(this.tempDir, { recursive: true });

      // Build with alternative output
      this.log('Running Vite build...');
      execSync(`npx vite build --outDir ${this.tempDir}/dist-web`, { stdio: 'inherit' });
      
      this.log('Building Electron main...');
      execSync(`npx esbuild electron/main.ts --bundle --platform=node --format=cjs --external:electron --external:better-sqlite3 --external:bindings --outfile=${this.tempDir}/dist-electron/main.cjs`, { stdio: 'inherit' });
      
      this.log('Building Electron preload...');
      execSync(`npx esbuild electron/preload.ts --bundle --platform=node --external:electron --outfile=${this.tempDir}/dist-electron/preload.js`, { stdio: 'inherit' });

      return true;
    } catch (error) {
      this.error(`Temp build failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Strategy 2: Atomic move from temp to final location
   */
  async atomicMove() {
    this.log('Performing atomic move to final locations...');
    
    try {
      // Move dist-web
      if (fs.existsSync('dist-web')) {
        fs.rmSync('dist-web', { recursive: true, force: true });
        await this.sleep(100);
      }
      fs.renameSync(`${this.tempDir}/dist-web`, 'dist-web');
      
      // Move dist-electron
      if (fs.existsSync('dist-electron')) {
        fs.rmSync('dist-electron', { recursive: true, force: true });
        await this.sleep(100);
      }
      fs.renameSync(`${this.tempDir}/dist-electron`, 'dist-electron');
      
      // Cleanup temp
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      
      return true;
    } catch (error) {
      this.error(`Atomic move failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Strategy 3: VS Code-safe electron-builder with alternative output
   */
  async buildWithAlternativeOutput() {
    this.log('Running electron-builder with alternative strategy...');
    
    try {
      // Use alternative release directory
      const releaseDir = `release-${this.buildNumber}`;
      
      this.log(`Building to ${releaseDir}...`);
      execSync(`npx electron-builder --config.directories.output=${releaseDir}`, { stdio: 'inherit' });
      
      // Move to standard location
      if (fs.existsSync('release')) {
        const backupDir = `release-backup-${this.buildNumber}`;
        fs.renameSync('release', backupDir);
        this.log(`Backed up old release to ${backupDir}`);
      }
      
      fs.renameSync(releaseDir, 'release');
      this.success('Build completed with alternative output strategy!');
      
      return true;
    } catch (error) {
      this.error(`Alternative output build failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Strategy 4: Process isolation approach
   */
  async buildWithProcessIsolation() {
    this.log('Attempting build with process isolation...');
    
    try {
      // Kill only our own processes, not VS Code
      const excludeVSCode = this.isWindows 
        ? `for /f "tokens=2" %i in ('tasklist /fi "imagename eq node.exe" /fi "windowtitle neq *Visual Studio Code*" /fo csv ^| find /c /v ""') do if %i gtr 1 taskkill /f /im node.exe /fi "windowtitle neq *Visual Studio Code*"`
        : `pkill -f "node.*electron" || true`;
      
      if (this.isWindows) {
        // Use PowerShell for more precise process control
        execSync(`powershell -Command "Get-Process node | Where-Object {$_.MainWindowTitle -notlike '*Visual Studio Code*'} | Stop-Process -Force"`, { stdio: 'inherit' });
      }
      
      await this.sleep(1000);
      
      // Standard build
      this.log('Running standard build after process cleanup...');
      execSync('pnpm run build', { stdio: 'inherit' });
      execSync('npx electron-builder', { stdio: 'inherit' });
      
      return true;
    } catch (error) {
      this.error(`Process isolation build failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Main build orchestrator - tries strategies in order
   */
  async run() {
    this.log('🚀 Starting VS Code-safe build process...');
    
    // Strategy 1: Temp directory + atomic move
    this.log('\n📁 Strategy 1: Temporary directory approach');
    if (await this.buildToTemp() && await this.atomicMove()) {
      this.success('Strategy 1 successful! Proceeding with electron-builder...');
      try {
        execSync('npx electron-builder', { stdio: 'inherit' });
        this.success('🎉 Complete build successful with Strategy 1!');
        return;
      } catch (error) {
        this.warn('Electron-builder failed with Strategy 1, trying alternatives...');
      }
    }

    // Strategy 2: Alternative output directory
    this.log('\n📂 Strategy 2: Alternative output directory');
    if (await this.buildWithAlternativeOutput()) {
      this.success('🎉 Complete build successful with Strategy 2!');
      return;
    }

    // Strategy 3: Process isolation
    this.log('\n🔒 Strategy 3: Process isolation approach');
    if (await this.buildWithProcessIsolation()) {
      this.success('🎉 Complete build successful with Strategy 3!');
      return;
    }

    // All strategies failed
    this.error('❌ All build strategies failed!');
    this.log('\n💡 Manual steps to try:');
    this.log('1. Close other applications using Node.js');
    this.log('2. Run: pnpm clean:force');
    this.log('3. Run: pnpm clean:advanced');  
    this.log('4. Try build again');
    this.log('5. As last resort: Restart VS Code and run build immediately');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new VSCodeSafeBuild();
  builder.run().catch(error => {
    console.error('Build script failed:', error);
    process.exit(1);
  });
}

module.exports = VSCodeSafeBuild;