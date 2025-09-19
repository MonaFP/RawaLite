#!/usr/bin/env node
/**
 * 🚀 Release Creator Script
 * 
 * Automatisierte Release-Erstellung mit Clean Build für RawaLite
 * Verhindert Cache-Probleme durch vollständige Bereinigung vor Release
 * 
 * Usage:
 *   node scripts/create-release.mjs [version]
 *   pnpm release:clean
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

/**
 * Execute command with proper error handling
 */
function exec(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: projectRoot,
      encoding: 'utf8'
    });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Check if required tools are available
 */
function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  const commands = [
    { cmd: 'pnpm --version', name: 'pnpm' },
    { cmd: 'gh --version', name: 'GitHub CLI' },
    { cmd: 'git --version', name: 'Git' }
  ];
  
  for (const { cmd, name } of commands) {
    try {
      execSync(cmd, { stdio: 'pipe' });
      console.log(`✅ ${name} available`);
    } catch (error) {
      console.error(`❌ ${name} not found - please install ${name}`);
      process.exit(1);
    }
  }
  console.log('');
}

/**
 * Main release creation workflow
 */
function createRelease() {
  console.log('🚀 RawaLite Release Creator - Cache-Safe Build Pipeline\n');
  
  // Check prerequisites
  checkPrerequisites();
  
  // Step 1: Validate current state
  exec('pnpm version:check', 'Version synchronization check');
  exec('pnpm typecheck', 'TypeScript validation');
  exec('pnpm lint', 'Code quality check');
  
  // Step 2: Clean build (already triggered by predist hook)
  console.log('🧹 Clean build will be triggered by predist hook...\n');
  
  // Step 3: Create distribution
  exec('pnpm dist', 'Creating distribution (with clean build)');
  
  // Step 4: Validate build artifacts
  exec('pnpm guard:build:freshness', 'Build freshness validation');
  exec('pnpm guard:release:assets', 'Release assets validation');
  
  // Step 5: Get version for release
  const packageJson = JSON.parse(
    execSync('cat package.json', { encoding: 'utf8', cwd: projectRoot })
  );
  const version = packageJson.version;
  
  console.log(`📦 Creating GitHub release for version v${version}...\n`);
  
  // Step 6: Git operations
  exec('git add -A', 'Staging all changes');
  exec(`git commit -m "v${version}: Cache-safe release build" || echo "No changes to commit"`, 'Committing changes');
  exec(`git tag v${version} || echo "Tag already exists"`, 'Creating Git tag');
  exec('git push origin main --tags', 'Pushing to GitHub');
  
  // Step 7: Create GitHub release
  const releaseNotes = `
🔧 **Cache-Safe Release v${version}**

### ✅ **Build Quality Assurance:**
- **Clean Build**: Vollständige Cache-Bereinigung vor Build
- **Fresh Artifacts**: dist-electron Dateien neu generiert
- **Timestamp Validation**: Build-Freshness geprüft
- **Asset Validation**: Alle erforderlichen Assets vorhanden

### 🛠️ **Technical Improvements:**
- Pre-Build Cleanup: rimraf dist dist-electron node_modules/.vite
- esbuild Cache Control: --no-bundle-cache für kritische Builds
- Build Freshness Guard: Automatische Stale-Build Erkennung

Dieser Release wurde mit der neuen cache-sicheren Build-Pipeline erstellt.`.trim();
  
  exec(
    `gh release create v${version} --repo MonaFP/RawaLite --title "RawaLite v${version} - Cache-Safe Release" --notes "${releaseNotes}"`,
    'Creating GitHub release'
  );
  
  // Step 8: Upload assets
  const assetsDir = join(projectRoot, 'release');
  if (existsSync(assetsDir)) {
    exec(
      `gh release upload v${version} --repo MonaFP/RawaLite --clobber "release/RawaLite Setup ${version}.exe" "release/RawaLite Setup ${version}.exe.blockmap" "release/latest.yml"`,
      'Uploading release assets'
    );
  }
  
  console.log('🎉 Release creation completed successfully!');
  console.log(`🔗 View release: https://github.com/MonaFP/RawaLite/releases/tag/v${version}`);
}

// Run release creation
createRelease();