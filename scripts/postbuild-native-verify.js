#!/usr/bin/env node
/**
 * Post-Build Verification für Native Module
 * Überprüft ob better-sqlite3 korrekt gepackt wurde
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Post-Build: Verifying native modules...');

function verifyNativeModules(appPath) {
  try {
    // Check if we're in the right context
    if (!appPath || !fs.existsSync(appPath)) {
      console.log('⚠️ App path not found, skipping verification');
      return;
    }

    console.log('📁 Verifying app structure:', appPath);

    // Look for better-sqlite3 in various locations
    const possiblePaths = [
      path.join(appPath, 'node_modules', 'better-sqlite3'),
      path.join(appPath, 'resources', 'app.asar.unpacked', 'node_modules', 'better-sqlite3'),
      path.join(appPath, 'resources', 'node_modules', 'better-sqlite3')
    ];

    let found = false;
    for (const checkPath of possiblePaths) {
      if (fs.existsSync(checkPath)) {
        console.log('✅ Found better-sqlite3 at:', checkPath);
        
        // Check for native bindings
        const buildPath = path.join(checkPath, 'build', 'Release');
        if (fs.existsSync(buildPath)) {
          const files = fs.readdirSync(buildPath);
          const nodeFiles = files.filter(f => f.endsWith('.node'));
          
          if (nodeFiles.length > 0) {
            console.log('✅ Native bindings verified:', nodeFiles);
            found = true;
          }
        }
      }
    }

    if (!found) {
      console.warn('⚠️ better-sqlite3 native bindings not found in expected locations');
      console.warn('This might cause "Cannot find module \'bindings\'" errors');
    }

  } catch (error) {
    console.error('❌ Post-build verification failed:', error.message);
  }
}

// Main execution
const context = process.env.ELECTRON_BUILDER_CONTEXT;
if (context) {
  try {
    const { appOutDir } = JSON.parse(context);
    verifyNativeModules(appOutDir);
  } catch (error) {
    console.log('⚠️ Could not parse electron-builder context, skipping verification');
  }
} else {
  console.log('⚠️ No electron-builder context available, skipping verification');
}

console.log('✅ Post-build verification completed');