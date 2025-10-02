#!/usr/bin/env node
/**
 * Development Starter for RawaLite - Simplified & Reliable
 * Based on proven RawaLite patterns from scripts/clean-processes.cmd
 */

const { spawn } = require('child_process');
const os = require('os');

class DevStarter {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.viteProcess = null;
    this.electronProcess = null;
  }

  log(message) {
    console.log(`🚀 ${message}`);
  }

  /**
   * Simple process cleanup (based on clean-processes.cmd)
   */
  cleanup() {
    this.log('Cleaning up processes...');
    
    if (this.isWindows) {
      // Use the proven taskkill approach from clean-processes.cmd
      try {
        require('child_process').execSync('taskkill /f /im electron.exe 2>nul', { stdio: 'ignore' });
        require('child_process').execSync('taskkill /f /im node.exe 2>nul', { stdio: 'ignore' });
      } catch (e) {
        // Expected - processes might not exist
      }
    }
  }

  /**
   * Start Vite (simple spawn)
   */
  startVite() {
    this.log('Starting Vite development server...');
    
    this.viteProcess = spawn('pnpm', ['run', 'vite'], {
      stdio: 'inherit',
      shell: true
    });

    this.viteProcess.on('close', (code) => {
      this.log(`Vite exited with code ${code}`);
    });

    return this.viteProcess;
  }

  /**
   * Start Electron (simple spawn)
   */
  startElectron() {
    this.log('Starting Electron (waiting 3 seconds for Vite)...');
    
    setTimeout(() => {
      this.electronProcess = spawn('pnpm', ['run', 'electron:dev'], {
        stdio: 'inherit',
        shell: true
      });

      this.electronProcess.on('close', (code) => {
        this.log(`Electron exited with code ${code}`);
        this.cleanup();
        process.exit(0);
      });
    }, 3000);
  }

  /**
   * Setup graceful shutdown
   */
  setupShutdown() {
    const shutdown = () => {
      this.log('Shutting down...');
      this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Main start function
   */
  start() {
    console.log('🚀 RawaLite Development Environment');
    console.log('===================================');
    
    this.setupShutdown();
    this.cleanup(); // Clean any existing processes
    
    this.log('Starting development servers...');
    this.startVite();
    this.startElectron();
    
    this.log('✅ Development environment starting...');
    this.log('📦 Vite: http://localhost:5173 (browser fallback)');
    this.log('⚡ Electron: Desktop app with full API access');
    this.log('Press Ctrl+C to stop both processes');
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new DevStarter();
  starter.start();
}

module.exports = DevStarter;