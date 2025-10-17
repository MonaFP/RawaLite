#!/usr/bin/env node

/**
 * Path Compliance Validation Script
 * 
 * Validiert, dass alle Services die RawaLite Path-Standards einhalten:
 * - Main Process: Node.js path APIs erlaubt
 * - Renderer Process: Nur PATHS System erlaubt
 * - Update Services: Besondere Aufmerksamkeit für UpdateManagerService & GitHubApiService
 * 
 * @version 1.0.13
 * @author RawaLite Team
 * @since Update System Enhancement (Phase 1)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 🎯 Path Compliance Rules
const PATH_COMPLIANCE_RULES = [
  {
    id: 'main-process-path-usage',
    name: 'Main Process Path API Usage',
    description: 'Main Process Services dürfen Node.js path APIs verwenden',
    files: [
      'src/main/services/UpdateManagerService.ts',
      'src/main/services/GitHubApiService.ts',
      'src/main/services/EntityStatusService.ts',
      'src/main/services/UpdateHistoryService.ts'
    ],
    allowedPatterns: [
      /import.*path.*from ['"]path['"]/, // path imports
      /import.*\{\s*dirname.*\}\s*from ['"]path['"]/, // dirname imports
      /import.*\{\s*join.*\}\s*from ['"]path['"]/, // join imports
      /app\.getPath\(/,  // electron app.getPath()
      /process\.cwd\(/   // process.cwd()
    ],
    rule: 'ALLOWED'
  },
  {
    id: 'renderer-process-path-restriction',
    name: 'Renderer Process Path Restriction',
    description: 'Renderer Process darf NIEMALS direkte Node.js path APIs verwenden',
    files: [
      'src/**/*.tsx',
      'src/**/*.ts'
    ],
    excludeFiles: [
      'src/main/**/*',    // Main Process erlaubt
      'src/types/**/*',   // Type Definitionen
      'src/lib/paths.ts'  // PATHS System selbst
    ],
    forbiddenPatterns: [
      /import.*path.*from ['"]path['"]/, // Direkter path import
      /import.*\{\s*dirname.*\}\s*from ['"]path['"]/, // dirname import
      /import.*\{\s*join.*\}\s*from ['"]path['"]/, // join import
      /app\.getPath\(/,  // electron app.getPath()
      /process\.cwd\(/   // process.cwd()
    ],
    rule: 'FORBIDDEN'
  },
  {
    id: 'paths-system-usage',
    name: 'PATHS System Usage',
    description: 'Renderer Process muss PATHS System verwenden',
    files: [
      'src/**/*.tsx',
      'src/**/*.ts'
    ],
    excludeFiles: [
      'src/main/**/*',    // Main Process
      'src/types/**/*',   // Type Definitionen
      'src/lib/paths.ts'  // PATHS System selbst
    ],
    requiredPatterns: [
      // Wenn path-ähnliche Operationen, dann nur über PATHS
      /PATHS\./  // PATHS.xyz() calls
    ],
    rule: 'CONDITIONAL'
  },
  {
    id: 'update-services-path-compliance',
    name: 'Update Services Path Compliance',
    description: 'Update Services (UpdateManagerService, GitHubApiService) müssen path-compliant sein',
    files: [
      'src/main/services/UpdateManagerService.ts',
      'src/main/services/GitHubApiService.ts'
    ],
    validPatterns: [
      // Erlaubte Main Process Patterns
      /app\.getPath\(/,
      /dirname\(/,
      /join\(/,
      /process\.cwd\(/
    ],
    rule: 'VALIDATED'
  }
];

// 🔍 File Search Functions
async function findFiles(pattern, excludePatterns = []) {
  const { glob } = await import('glob');
  const { minimatch } = await import('minimatch');
  let files = await glob(pattern, { cwd: projectRoot });
  
  // Filter excluded files
  for (const exclude of excludePatterns) {
    files = files.filter(file => !minimatch(file, exclude));
  }
  
  return files;
}

function checkFileExists(filePath) {
  return existsSync(join(projectRoot, filePath));
}

function readFile(filePath) {
  try {
    return readFileSync(join(projectRoot, filePath), 'utf8');
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// 🔍 Pattern Validation Functions
function validateMainProcessPaths(files) {
  console.log('\\n[1/4] Validating Main Process Path Usage...');
  let violations = 0;
  
  for (const filePath of files) {
    if (!checkFileExists(filePath)) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      continue;
    }
    
    const content = readFile(filePath);
    if (!content) continue;
    
    // Main Process DARF path APIs verwenden - das ist korrekt!
    console.log(`   ✅ ${filePath} - Main Process (path APIs erlaubt)`);
  }
  
  return violations;
}

async function validateRendererProcessRestrictions() {
  console.log('\\n[2/4] Validating Renderer Process Restrictions...');
  let violations = 0;
  
  // Finde alle Renderer-seitigen Dateien
  const rendererFiles = [
    ...(await findFiles('src/**/*.tsx', ['src/main/**/*', 'src/types/**/*', 'src/lib/paths.ts'])),
    ...(await findFiles('src/**/*.ts', ['src/main/**/*', 'src/types/**/*', 'src/lib/paths.ts']))
  ];
  
  const forbiddenPatterns = [
    { pattern: /import.*path.*from ['"]path['"]/, name: 'direct path import' },
    { pattern: /import.*\{\s*dirname.*\}\s*from ['"]path['"]/, name: 'dirname import' },
    { pattern: /import.*\{\s*join.*\}\s*from ['"]path['"]/, name: 'join import' },
    { pattern: /app\.getPath\(/, name: 'app.getPath() call' },
    { pattern: /process\.cwd\(/, name: 'process.cwd() call' }
  ];
  
  for (const filePath of rendererFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    
    let fileViolations = 0;
    
    for (const { pattern, name } of forbiddenPatterns) {
      if (pattern.test(content)) {
        console.log(`   ❌ VIOLATION in ${filePath}: ${name}`);
        fileViolations++;
        violations++;
      }
    }
    
    if (fileViolations === 0) {
      console.log(`   ✅ ${filePath} - No forbidden path APIs`);
    }
  }
  
  return violations;
}

async function validatePathsSystemUsage() {
  console.log('\\n[3/4] Validating PATHS System Usage...');
  let pathsUsage = 0;
  
  const rendererFiles = [
    ...(await findFiles('src/**/*.tsx', ['src/main/**/*', 'src/types/**/*', 'src/lib/paths.ts'])),
    ...(await findFiles('src/**/*.ts', ['src/main/**/*', 'src/types/**/*', 'src/lib/paths.ts']))
  ];
  
  for (const filePath of rendererFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    
    if (/PATHS\./g.test(content)) {
      const matches = content.match(/PATHS\./g)?.length || 0;
      console.log(`   ✅ ${filePath} - ${matches} PATHS system calls`);
      pathsUsage += matches;
    }
  }
  
  console.log(`   📊 Total PATHS system usage: ${pathsUsage} calls`);
  return pathsUsage;
}

function validateUpdateServicesCompliance() {
  console.log('\\n[4/4] Validating Update Services Path Compliance...');
  let compliant = 0;
  let total = 0;
  
  const updateServiceFiles = [
    'src/main/services/UpdateManagerService.ts',
    'src/main/services/GitHubApiService.ts',
    'src/main/services/UpdateHistoryService.ts'
  ];
  
  for (const filePath of updateServiceFiles) {
    if (!checkFileExists(filePath)) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      continue;
    }
    
    total++;
    const content = readFile(filePath);
    if (!content) continue;
    
    // Update Services sind Main Process - path APIs sind erlaubt und korrekt
    let pathUsage = 0;
    const patterns = [
      /app\.getPath\(/g,
      /dirname\(/g,
      /join\(/g,
      /process\.cwd\(/g
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) pathUsage += matches.length;
    }
    
    console.log(`   ✅ ${filePath} - ${pathUsage} path API calls (Main Process - erlaubt)`);
    compliant++;
  }
  
  return { compliant, total };
}

// 🚀 Main Validation Function
async function validatePathCompliance() {
  console.log('🔍 PATH COMPLIANCE VALIDATION');
  console.log('==================================================');
  
  let totalViolations = 0;
  
  try {
    // 1. Validate Main Process (erlaubt)
    const mainProcessFiles = [
      'src/main/services/UpdateManagerService.ts',
      'src/main/services/GitHubApiService.ts',
      'src/main/services/EntityStatusService.ts',
      'src/main/services/UpdateHistoryService.ts'
    ];
    
    const mainViolations = validateMainProcessPaths(mainProcessFiles);
    totalViolations += mainViolations;
    
    // 2. Validate Renderer Process (verboten)
    const rendererViolations = await validateRendererProcessRestrictions();
    totalViolations += rendererViolations;
    
    // 3. Check PATHS system usage
    await validatePathsSystemUsage();
    
    // 4. Validate Update Services specifically
    const { compliant, total } = validateUpdateServicesCompliance();
    
    // 📊 Summary
    console.log('\\n==================================================');
    console.log('📊 PATH COMPLIANCE SUMMARY');
    console.log(`   Total violations found: ${totalViolations}`);
    console.log(`   Update services compliant: ${compliant}/${total}`);
    
    if (totalViolations === 0) {
      console.log('\\n✅ ALL PATH COMPLIANCE RULES VALIDATED SUCCESSFULLY!');
      console.log('   Safe to proceed with build/release.');
      process.exit(0);
    } else {
      console.log('\\n❌ PATH COMPLIANCE VIOLATIONS DETECTED!');
      console.log('   Fix violations before proceeding.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\\n🚨 VALIDATION ERROR:', error);
    console.error('   Validation script failed to complete.');
    process.exit(1);
  }
}

// 🚀 Execute Validation
validatePathCompliance();