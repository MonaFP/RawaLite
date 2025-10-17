// Force dev:all usage - verhindert direktes pnpm dev
// Automatischer Redirect mit ABI-Check

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.log('🚀 [Dev] Starting RawaLite development...');
console.log('📋 [Dev] Force using dev:all for ABI safety');

// Check for ABI rebuild flag
const flagPath = path.join(__dirname, '..', '.needs-abi-rebuild');
if (fs.existsSync(flagPath)) {
  console.log('⚠️ [Dev] ABI rebuild needed - fixing automatically...');
  
  // Run rebuild first
  const rebuildProcess = spawn('node', ['scripts/rebuild-native-electron.cjs'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  rebuildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ [Dev] ABI rebuild completed');
      fs.unlinkSync(flagPath); // Remove flag
      startDevAll();
    } else {
      console.error('❌ [Dev] ABI rebuild failed');
      process.exit(1);
    }
  });
} else {
  // Direct start
  startDevAll();
}

function startDevAll() {
  console.log('🎯 [Dev] Redirecting to dev:all...\n');
  
  // Spawn dev:all process
  const devProcess = spawn('pnpm', ['run', 'dev:all'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  devProcess.on('exit', (code) => {
    process.exit(code || 0);
  });

  devProcess.on('error', (error) => {
    console.error('❌ [Dev] Failed to start dev:all:', error.message);
    console.log('\n💡 [Dev] Manual fallback:');
    console.log('   pnpm run dev:all');
    process.exit(1);
  });
}