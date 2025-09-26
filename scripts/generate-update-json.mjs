// scripts/generate-update-json.mjs
// Generates update.json manifest for GitHub releases

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load package.json
const pkgPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
console.log(`📦 Generating update.json for RawaLite v${pkg.version}`);

// Find release directory and setup file
const releaseDir = path.join(rootDir, 'release');
if (!fs.existsSync(releaseDir)) {
  console.error(`❌ Release directory not found: ${releaseDir}`);
  console.log('💡 Run "pnpm dist" first to build the installer');
  process.exit(1);
}

// Look for the setup file
const setupFileName = `rawalite-Setup-${pkg.version}.exe`;
const setupFile = path.join(releaseDir, setupFileName);

// Also check for alternate naming patterns
const alternateNames = [
  `RawaLite-Setup-${pkg.version}.exe`,
  `RawaLite Setup ${pkg.version}.exe`,
  'rawalite-Setup.exe',
  'RawaLite-Setup.exe'
];

let actualSetupFile = setupFile;
let actualSetupName = setupFileName;

if (!fs.existsSync(setupFile)) {
  console.log(`⚠️ Expected setup file not found: ${setupFileName}`);
  console.log('🔍 Searching for alternate names...');
  
  for (const altName of alternateNames) {
    const altPath = path.join(releaseDir, altName);
    if (fs.existsSync(altPath)) {
      actualSetupFile = altPath;
      actualSetupName = altName;
      console.log(`✅ Found installer: ${altName}`);
      break;
    }
  }
  
  if (!fs.existsSync(actualSetupFile)) {
    console.error('❌ No installer file found in release directory');
    console.log('📁 Files in release directory:');
    const files = fs.readdirSync(releaseDir);
    files.forEach(file => console.log(`  - ${file}`));
    process.exit(1);
  }
}

// Get file stats
const stats = fs.statSync(actualSetupFile);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`📊 File size: ${fileSizeMB} MB (${stats.size} bytes)`);

// Calculate SHA512 hash
console.log('🔐 Calculating SHA512 hash...');
const fileBuffer = fs.readFileSync(actualSetupFile);
const sha512 = crypto.createHash('sha512').update(fileBuffer).digest('base64');
console.log(`✅ SHA512: ${sha512.substring(0, 20)}...`);

// Read release notes if available
let releaseNotes = `RawaLite v${pkg.version} - Update Release`;
const releaseNotesPath = path.join(rootDir, `RELEASE_NOTES_V${pkg.version.replace(/\./g, '')}.md`);
if (fs.existsSync(releaseNotesPath)) {
  try {
    releaseNotes = fs.readFileSync(releaseNotesPath, 'utf-8');
    console.log('📝 Found release notes');
  } catch (error) {
    console.log('⚠️ Could not read release notes, using default');
  }
}

// Create update.json
const updateJson = {
  product: "RawaLite",
  channel: "stable",
  version: pkg.version,
  releasedAt: new Date().toISOString(),
  notes: releaseNotes,
  files: [{
    kind: "nsis",
    arch: "x64",
    name: actualSetupName,
    size: stats.size,
    sha512: sha512,
    url: `https://github.com/MonaFP/RawaLite/releases/download/v${pkg.version}/${actualSetupName}`
  }]
};

// Write update.json
const updateJsonPath = path.join(releaseDir, 'update.json');
fs.writeFileSync(updateJsonPath, JSON.stringify(updateJson, null, 2));
console.log(`✅ Generated update.json at: ${updateJsonPath}`);

// Also create a latest.json for compatibility
const latestJsonPath = path.join(releaseDir, 'latest.json');
fs.writeFileSync(latestJsonPath, JSON.stringify({
  version: pkg.version,
  updateUrl: updateJson.files[0].url,
  sha512: sha512,
  size: stats.size,
  releaseDate: updateJson.releasedAt
}, null, 2));
console.log(`✅ Generated latest.json at: ${latestJsonPath}`);

// Display summary
console.log('\n📋 Update Manifest Summary:');
console.log('============================');
console.log(`Product: ${updateJson.product}`);
console.log(`Version: ${updateJson.version}`);
console.log(`Channel: ${updateJson.channel}`);
console.log(`File: ${actualSetupName}`);
console.log(`Size: ${fileSizeMB} MB`);
console.log(`Released: ${new Date(updateJson.releasedAt).toLocaleString()}`);
console.log('\n🚀 Ready for GitHub release upload!');
console.log('Upload these files to your GitHub release:');
console.log(`  1. ${actualSetupName}`);
console.log('  2. update.json');
console.log('  3. latest.json (optional)');