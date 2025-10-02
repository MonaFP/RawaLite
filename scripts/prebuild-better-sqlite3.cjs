/**
 * Pre-Build Script für Native Module (CommonJS für electron-builder)
 * Stellt sicher dass better-sqlite3 für Packaging verfügbar ist
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Pre-Build: Preparing native modules...');

function setupNativeModules() {
  try {
    // Verify better-sqlite3 is installed
    const betterSqlitePath = path.join(process.cwd(), 'node_modules', 'better-sqlite3');
    if (!fs.existsSync(betterSqlitePath)) {
      console.warn('⚠️ better-sqlite3 not found, skipping native module setup');
      return;
    }

    console.log('✅ better-sqlite3 module found');
    
    // Check if native bindings already exist
    const buildPath = path.join(betterSqlitePath, 'build', 'Release');
    if (fs.existsSync(buildPath)) {
      const files = fs.readdirSync(buildPath);
      const nodeFiles = files.filter(f => f.endsWith('.node'));
      if (nodeFiles.length > 0) {
        console.log('✅ Native bindings already available:', nodeFiles);
        console.log('✅ Pre-build setup completed (using existing bindings)');
        return;
      }
    }

    // Try to rebuild only if necessary
    console.log('📦 Attempting to rebuild better-sqlite3...');
    try {
      execSync('npx electron-rebuild --only=better-sqlite3', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ better-sqlite3 rebuilt successfully');
    } catch (rebuildError) {
      console.warn('⚠️ Rebuild failed, but continuing build...');
      console.warn('This might work if bindings are already available');
    }

    console.log('✅ Pre-build setup completed');
    
  } catch (error) {
    console.error('❌ Pre-build setup failed:', error.message);
    // Don't fail the build, just warn
    console.warn('⚠️ Continuing build despite pre-build warnings...');
  }
}

// Export für electron-builder
module.exports = setupNativeModules;

// Direct execution fallback
if (require.main === module) {
  setupNativeModules();
}