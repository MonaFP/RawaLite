#!/usr/bin/env node

/**
 * 🎯 MASTER VALIDATION & SYNC SCRIPT - WORKING VERSION
 * 
 * Comprehensive documentation and repository synchronization validator
 * Simplified version that works reliably
 * 
 * @version 2.1.0
 * @date 2025-10-20
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const srcDir = path.join(rootDir, 'src');

// 🎨 Color utilities
const colors = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m', reset: '\x1b[0m', bold: '\x1b[1m'
};

function colorize(text, color) {
  return process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;
}

// 📊 Statistics
const stats = {
  totalFiles: 0, totalFolders: 0, implementedServices: 0, documentedServices: 0,
  schemaCompliant: 0, brokenReferences: 0, totalReferences: 0,
  completeMetadata: 0, incompleteMetadata: 0, errors: [], warnings: []
};

console.log(colorize('\n🎯 MASTER DOCUMENTATION & REPOSITORY VALIDATION', 'bold'));
console.log('===========================================================');
console.log(`📅 Date: 2025-10-20`);
console.log('🔧 Integrated Modules: Structure, Schema, Cross-Ref, Metadata, Repo-Sync');
console.log('');

/**
 * 🔍 Repository Code Analysis
 */
async function analyzeSourceCode() {
  console.log(colorize('[REPO-SYNC] Analyzing source code implementations...', 'blue'));
  
  const services = new Map();
  const interfaces = new Map();
  
  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/.test(entry.name)) {
          await analyzeFile(fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot scan directory ${dir}: ${error.message}`);
    }
  }
  
  async function analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(srcDir, filePath);
      
      // Extract services
      const serviceMatches = [...content.matchAll(/class\s+(\w+Service)\s*{/g)];
      serviceMatches.forEach(match => {
        const serviceName = match[1];
        services.set(serviceName, { file: relativePath, methods: extractMethods(content) });
      });
      
      // Extract interfaces
      const interfaceMatches = [...content.matchAll(/interface\s+(\w+)\s*{/g)];
      interfaceMatches.forEach(match => {
        interfaces.set(match[1], { file: relativePath });
      });
      
    } catch (error) {
      stats.warnings.push(`Cannot analyze file ${filePath}: ${error.message}`);
    }
  }
  
  function extractMethods(content) {
    const methods = [];
    const methodMatches = [...content.matchAll(/async\s+(\w+)\s*\(/g)];
    methodMatches.forEach(match => methods.push(match[1]));
    return methods;
  }
  
  await scanDirectory(srcDir);
  
  stats.implementedServices = services.size;
  console.log(`   📊 Found ${services.size} services, ${interfaces.size} interfaces`);
  
  return { services, interfaces };
}

/**
 * 📚 Documentation Analysis  
 */
async function analyzeDocumentation() {
  console.log(colorize('[DOCS] Analyzing documentation...', 'blue'));
  
  const documentedServices = new Map();
  let schemaCompliant = 0;
  let totalFiles = 0;
  
  async function scanDocsDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDocsDirectory(fullPath);
        } else if (entry.name.endsWith('.md')) {
          await analyzeDocFile(fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot scan docs directory ${dir}: ${error.message}`);
    }
  }
  
  async function analyzeDocFile(filePath) {
    try {
      const fileName = path.basename(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      totalFiles++;
      
      // Check schema compliance
      const schemaPatterns = [
        /^ROOT_VALIDATED_/, /^VALIDATED_/, /^COMPLETED_/, /^DEPRECATED_/, /^INDEX\.md$/
      ];
      
      if (schemaPatterns.some(pattern => pattern.test(fileName)) || 
          ['INDEX.md', 'README.md'].includes(fileName)) {
        schemaCompliant++;
      }
      
      // Find service references
      const serviceMatches = [...content.matchAll(/(\w+Service)/g)];
      serviceMatches.forEach(match => {
        const serviceName = match[1];
        if (!documentedServices.has(serviceName)) {
          documentedServices.set(serviceName, []);
        }
        documentedServices.get(serviceName).push(path.relative(docsDir, filePath));
      });
      
      // Check metadata
      const hasMetadata = content.includes('**Erstellt:**') && 
                         content.includes('**Status:**') &&
                         content.includes('**Typ:**');
      
      if (hasMetadata) {
        stats.completeMetadata++;
      } else {
        stats.incompleteMetadata++;
      }
      
    } catch (error) {
      stats.warnings.push(`Cannot analyze doc file ${filePath}: ${error.message}`);
    }
  }
  
  await scanDocsDirectory(docsDir);
  
  stats.totalFiles = totalFiles;
  stats.schemaCompliant = schemaCompliant;
  stats.documentedServices = documentedServices.size;
  
  console.log(`   📊 Analyzed ${totalFiles} files, ${schemaCompliant} schema compliant`);
  
  return documentedServices;
}

/**
 * 🔗 Cross-Reference Analysis
 */
async function analyzeCrossReferences() {
  console.log(colorize('[CROSS-REF] Analyzing cross-references...', 'blue'));
  
  const fileIndex = new Map();
  let totalReferences = 0;
  let brokenReferences = 0;
  
  // Build file index
  async function buildIndex(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await buildIndex(fullPath);
        } else if (entry.name.endsWith('.md')) {
          fileIndex.set(entry.name, fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot build index for ${dir}: ${error.message}`);
    }
  }
  
  // Check references
  async function checkReferences(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await checkReferences(fullPath);
        } else if (entry.name.endsWith('.md')) {
          await checkFileReferences(fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot check references in ${dir}: ${error.message}`);
    }
  }
  
  async function checkFileReferences(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const linkPattern = /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g;
      let match;
      
      while ((match = linkPattern.exec(content)) !== null) {
        totalReferences++;
        const linkPath = match[2];
        const fileName = path.basename(linkPath.split('#')[0]);
        
        if (!fileIndex.has(fileName)) {
          brokenReferences++;
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot check references in ${filePath}: ${error.message}`);
    }
  }
  
  await buildIndex(docsDir);
  await checkReferences(docsDir);
  
  stats.totalReferences = totalReferences;
  stats.brokenReferences = brokenReferences;
  
  const integrityRate = totalReferences > 0 ? 
    Math.round((totalReferences - brokenReferences) / totalReferences * 100) : 100;
  
  console.log(`   📊 Reference integrity: ${integrityRate}% (${brokenReferences} broken)`);
}

/**
 * 🏗️ Structure Analysis
 */
async function analyzeStructure() {
  console.log(colorize('[STRUCTURE] Analyzing folder structure...', 'blue'));
  
  const expectedFolders = ['00-meta', '01-core', '02-dev', '03-data', '04-ui', '05-deploy', '06-lessons', 'archive'];
  let missingFolders = 0;
  
  try {
    const actualFolders = await fs.readdir(docsDir, { withFileTypes: true })
      .then(entries => entries.filter(e => e.isDirectory()).map(e => e.name));
    
    for (const expected of expectedFolders) {
      if (!actualFolders.includes(expected)) {
        missingFolders++;
        stats.errors.push(`Missing folder: ${expected}`);
      }
    }
    
    stats.totalFolders = expectedFolders.length;
    
    console.log(`   📊 Folder structure: ${expectedFolders.length - missingFolders}/${expectedFolders.length} complete`);
    
  } catch (error) {
    stats.errors.push(`Cannot analyze structure: ${error.message}`);
  }
}

/**
 * 🧮 Calculate Quality Score
 */
function calculateQualityScore() {
  const weights = { repoSync: 25, schema: 25, crossRef: 20, metadata: 15, structure: 15 };
  
  const syncRate = stats.implementedServices > 0 ? 
    (stats.documentedServices / stats.implementedServices) * 100 : 0;
  
  const schemaRate = stats.totalFiles > 0 ?
    (stats.schemaCompliant / stats.totalFiles) * 100 : 0;
  
  const refRate = stats.totalReferences > 0 ?
    ((stats.totalReferences - stats.brokenReferences) / stats.totalReferences) * 100 : 100;
  
  const metaRate = stats.completeMetadata + stats.incompleteMetadata > 0 ?
    (stats.completeMetadata / (stats.completeMetadata + stats.incompleteMetadata)) * 100 : 0;
  
  const structureRate = stats.totalFolders > 0 ?
    ((stats.totalFolders - stats.errors.filter(e => e.includes('Missing folder')).length) / stats.totalFolders) * 100 : 100;

  const weightedScore = 
    (syncRate * weights.repoSync / 100) +
    (schemaRate * weights.schema / 100) +
    (refRate * weights.crossRef / 100) +
    (metaRate * weights.metadata / 100) +
    (structureRate * weights.structure / 100);

  return Math.round(weightedScore);
}

/**
 * 📊 Generate Final Report
 */
function generateReport() {
  console.log('\n===========================================================');
  console.log(colorize('📊 MASTER VALIDATION REPORT', 'bold'));
  console.log('===========================================================');

  const overallScore = calculateQualityScore();
  const scoreColor = overallScore >= 90 ? 'green' : overallScore >= 70 ? 'yellow' : 'red';
  
  console.log(colorize('\n🎯 EXECUTIVE SUMMARY', 'bold'));
  console.log('─'.repeat(50));
  console.log(colorize(`   📊 Overall Quality Score: ${overallScore}%`, scoreColor));
  console.log(`   📄 Files Processed: ${stats.totalFiles}`);
  console.log(`   ❌ Critical Issues: ${stats.errors.length}`);
  console.log(`   ⚠️  Warnings: ${stats.warnings.length}`);

  console.log(colorize('\n🔄 REPOSITORY SYNCHRONIZATION', 'bold'));
  console.log('─'.repeat(50));
  const syncRate = stats.implementedServices > 0 ? 
    Math.round(stats.documentedServices / stats.implementedServices * 100) : 0;
  const syncColor = syncRate >= 80 ? 'green' : syncRate >= 60 ? 'yellow' : 'red';
  console.log(colorize(`   📊 Sync Rate: ${syncRate}%`, syncColor));
  console.log(`   🔧 Implemented Services: ${stats.implementedServices}`);
  console.log(`   📚 Documented Services: ${stats.documentedServices}`);

  console.log(colorize('\n🏗️ STRUCTURE & SCHEMA COMPLIANCE', 'bold'));
  console.log('─'.repeat(50));
  const schemaRate = stats.totalFiles > 0 ?
    Math.round(stats.schemaCompliant / stats.totalFiles * 100) : 0;
  const schemaColor = schemaRate >= 90 ? 'green' : schemaRate >= 70 ? 'yellow' : 'red';
  console.log(colorize(`   📊 Schema Compliance: ${schemaRate}%`, schemaColor));
  console.log(`   📁 Total Folders: ${stats.totalFolders}`);
  console.log(`   📄 Total Files: ${stats.totalFiles}`);
  console.log(`   ✅ Schema Compliant: ${stats.schemaCompliant}`);

  console.log(colorize('\n🔗 CROSS-REFERENCES & METADATA', 'bold'));
  console.log('─'.repeat(50));
  const refRate = stats.totalReferences > 0 ?
    Math.round((stats.totalReferences - stats.brokenReferences) / stats.totalReferences * 100) : 100;
  const refColor = refRate >= 95 ? 'green' : refRate >= 85 ? 'yellow' : 'red';
  const metaRate = stats.completeMetadata + stats.incompleteMetadata > 0 ?
    Math.round(stats.completeMetadata / (stats.completeMetadata + stats.incompleteMetadata) * 100) : 0;
  const metaColor = metaRate >= 80 ? 'green' : metaRate >= 60 ? 'yellow' : 'red';
  
  console.log(colorize(`   📊 Reference Integrity: ${refRate}%`, refColor));
  console.log(`   🔗 Total References: ${stats.totalReferences}`);
  console.log(`   ❌ Broken References: ${stats.brokenReferences}`);
  console.log(colorize(`   📊 Metadata Completeness: ${metaRate}%`, metaColor));
  console.log(`   ✅ Complete Metadata: ${stats.completeMetadata}`);
  console.log(`   ⚠️  Incomplete Metadata: ${stats.incompleteMetadata}`);

  // Show top errors if any
  if (stats.errors.length > 0) {
    console.log(colorize('\n❌ CRITICAL ISSUES (TOP 5)', 'red'));
    console.log('─'.repeat(50));
    stats.errors.slice(0, 5).forEach(error => {
      console.log(colorize(`   • ${error}`, 'red'));
    });
    if (stats.errors.length > 5) {
      console.log(colorize(`   ... and ${stats.errors.length - 5} more issues`, 'red'));
    }
  }

  // Recommendations
  console.log(colorize('\n💡 RECOMMENDATIONS', 'bold'));
  console.log('─'.repeat(50));
  
  const recommendations = [];
  if (syncRate < 80) recommendations.push('🔄 Update documentation to match current service implementations');
  if (schemaRate < 90) recommendations.push('📝 Run FIX_DOCUMENTATION_SCHEMA_COMPLIANCE.mjs to improve naming');
  if (stats.brokenReferences > 5) recommendations.push('🔗 Run FIX_CROSS_REFERENCE_INTEGRITY.mjs to repair broken links');
  if (stats.incompleteMetadata > 10) recommendations.push('📊 Run FIX_METADATA_CONSISTENCY.mjs to standardize headers');
  if (overallScore < 70) recommendations.push('⚠️  Consider running repair scripts for comprehensive improvement');
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => console.log(`   ${rec}`));
  } else {
    console.log(colorize('   🎉 Excellent! No major improvements needed.', 'green'));
  }

  console.log('\n===========================================================');
  const success = stats.errors.length === 0;
  console.log(colorize(success ? '✅ VALIDATION COMPLETED SUCCESSFULLY' : '❌ VALIDATION COMPLETED WITH ERRORS', 
                      success ? 'green' : 'red'));
  
  return success;
}

/**
 * 🚀 Main Execution
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(colorize('🔍 Starting comprehensive validation...', 'cyan'));
    
    // Run all analyses
    await analyzeSourceCode();
    await analyzeDocumentation();
    await analyzeCrossReferences();  
    await analyzeStructure();
    
    console.log(`\n⏱️  Processing completed in ${Date.now() - startTime}ms`);
    
    // Generate report
    const success = generateReport();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error(colorize(`💥 Fatal error: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
main();