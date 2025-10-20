#!/usr/bin/env node

/**
 * 🎯 ENHANCED MASTER VALIDATION SCRIPT v3.0.0
 * 
 * Erweiterte Version mit umfassender Link-Validierung
 * 
 * Features:
 * - Documentation structure validation
 * - Schema compliance checking  
 * - Cross-reference integrity
 * - LINK VALIDATION (NEW!)
 * - Metadata consistency
 * - Repository synchronization
 * 
 * @version 3.0.0
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

// 📊 Enhanced Statistics
const stats = {
  totalFiles: 0,
  totalFolders: 0,
  implementedServices: 0,
  documentedServices: 0,
  schemaCompliant: 0,
  brokenLinks: 0,           // NEW!
  totalLinks: 0,            // NEW!
  brokenReferences: 0,
  totalReferences: 0,
  completeMetadata: 0,
  incompleteMetadata: 0,
  errors: [],
  warnings: [],
  brokenLinkDetails: []     // NEW!
};

console.log(colorize('\n🎯 ENHANCED MASTER VALIDATION (v3.0.0)', 'bold'));
console.log('====================================================');
console.log(`📅 Date: 2025-10-20`);
console.log('🔧 NEW: Link validation, Enhanced error reporting');
console.log('');

/**
 * 🔗 ENHANCED LINK VALIDATION
 */
async function validateLinks() {
  console.log(colorize('[LINK-VALIDATION] Scanning for broken links...', 'blue'));
  
  const brokenLinks = [];
  const allFiles = new Set();
  
  // Build index of all existing files
  async function buildFileIndex(dir, baseDir = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = baseDir ? path.join(baseDir, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await buildFileIndex(fullPath, relativePath);
        } else {
          allFiles.add(relativePath);
          allFiles.add(relativePath.replace(/\\/g, '/')); // Also add with forward slashes
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot build file index for ${dir}: ${error.message}`);
    }
  }
  
  // Check links in file
  async function checkLinksInFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const fileDir = path.dirname(filePath);
      
      // Find markdown links [text](path)
      const markdownLinks = [...content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)];
      
      for (const match of markdownLinks) {
        const [fullMatch, linkText, linkPath] = match;
        stats.totalLinks++;
        
        // Skip external links (http/https)
        if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
          continue;
        }
        
        // Skip anchors
        if (linkPath.startsWith('#')) {
          continue;
        }
        
        // Resolve relative path
        let targetPath = linkPath;
        if (linkPath.startsWith('../')) {
          targetPath = path.resolve(fileDir, linkPath);
          targetPath = path.relative(rootDir, targetPath);
        } else if (linkPath.startsWith('./')) {
          targetPath = path.resolve(fileDir, linkPath);
          targetPath = path.relative(rootDir, targetPath);
        } else if (!path.isAbsolute(linkPath)) {
          targetPath = path.resolve(fileDir, linkPath);
          targetPath = path.relative(rootDir, targetPath);
        }
        
        // Normalize path separators
        targetPath = targetPath.replace(/\\/g, '/');
        
        // Check if target exists
        const exists = allFiles.has(targetPath) || 
                      allFiles.has(targetPath.replace(/\//g, '\\'));
        
        if (!exists) {
          stats.brokenLinks++;
          brokenLinks.push({
            file: path.relative(rootDir, filePath),
            linkText,
            linkPath,
            resolvedPath: targetPath,
            fullMatch
          });
        }
      }
      
    } catch (error) {
      stats.warnings.push(`Cannot check links in ${filePath}: ${error.message}`);
    }
  }
  
  // Build complete file index
  await buildFileIndex(rootDir);
  
  // Check all markdown files
  async function scanForMarkdownFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanForMarkdownFiles(fullPath);
        } else if (entry.name.endsWith('.md')) {
          await checkLinksInFile(fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot scan for markdown files in ${dir}: ${error.message}`);
    }
  }
  
  await scanForMarkdownFiles(rootDir);
  
  stats.brokenLinkDetails = brokenLinks;
  
  console.log(`   📊 Checked ${stats.totalLinks} links, found ${stats.brokenLinks} broken`);
  
  return brokenLinks;
}

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
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          await analyzeSourceFile(fullPath);
        }
      }
    } catch (error) {
      stats.warnings.push(`Cannot scan directory ${dir}: ${error.message}`);
    }
  }
  
  async function analyzeSourceFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Find service classes
      const serviceMatches = [...content.matchAll(/(?:export\s+)?class\s+(\w*Service)\s*[{<]/g)];
      serviceMatches.forEach(match => {
        const serviceName = match[1];
        services.set(serviceName, {
          file: path.relative(srcDir, filePath),
          path: filePath
        });
      });
      
      // Find interfaces
      const interfaceMatches = [...content.matchAll(/(?:export\s+)?interface\s+(\w+)/g)];
      interfaceMatches.forEach(match => {
        const interfaceName = match[1];
        interfaces.set(interfaceName, {
          file: path.relative(srcDir, filePath),
          path: filePath
        });
      });
      
    } catch (error) {
      stats.warnings.push(`Cannot analyze source file ${filePath}: ${error.message}`);
    }
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
 * 📊 Enhanced Report Generation
 */
async function generateEnhancedReport(sourceData, docData, brokenLinks) {
  console.log(colorize('\n📊 ENHANCED VALIDATION REPORT', 'bold'));
  console.log('=====================================');
  
  // Basic metrics
  const schemaPercentage = stats.totalFiles > 0 ? Math.round((stats.schemaCompliant / stats.totalFiles) * 100) : 0;
  const syncPercentage = sourceData.services.size > 0 ? Math.round((stats.documentedServices / sourceData.services.size) * 100) : 0;
  const linkIntegrityPercentage = stats.totalLinks > 0 ? Math.round(((stats.totalLinks - stats.brokenLinks) / stats.totalLinks) * 100) : 100;
  const metadataPercentage = stats.totalFiles > 0 ? Math.round((stats.completeMetadata / stats.totalFiles) * 100) : 0;
  
  console.log(`📁 Files Analyzed: ${stats.totalFiles}`);
  console.log(`📋 Schema Compliance: ${schemaPercentage}% (${stats.schemaCompliant}/${stats.totalFiles})`);
  console.log(`🔗 Link Integrity: ${linkIntegrityPercentage}% (${stats.totalLinks - stats.brokenLinks}/${stats.totalLinks})`);
  console.log(`📊 Metadata Completeness: ${metadataPercentage}% (${stats.completeMetadata}/${stats.totalFiles})`);
  console.log(`⚡ Repository Sync: ${syncPercentage}% (${stats.documentedServices}/${sourceData.services.size} services)`);
  
  // Quality score with link integrity
  const qualityScore = Math.round(
    (schemaPercentage * 0.25) + 
    (linkIntegrityPercentage * 0.25) +
    (metadataPercentage * 0.15) + 
    (syncPercentage * 0.35)
  );
  
  console.log(`🏆 Overall Quality Score: ${qualityScore}%`);
  
  // BROKEN LINKS DETAILS
  if (brokenLinks.length > 0) {
    console.log(colorize('\n❌ BROKEN LINKS FOUND', 'red'));
    console.log('======================');
    
    brokenLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${colorize(link.file, 'yellow')}`);
      console.log(`   Link: "${link.linkText}" -> ${link.linkPath}`);
      console.log(`   Resolved to: ${link.resolvedPath}`);
      console.log(`   Context: ${link.fullMatch.substring(0, 60)}...`);
      console.log('');
    });
  }
  
  // Warnings
  if (stats.warnings.length > 0) {
    console.log(colorize('\n⚠️  WARNINGS', 'yellow'));
    console.log('============');
    stats.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  // Recommendations
  console.log(colorize('\n💡 RECOMMENDATIONS', 'cyan'));
  console.log('==================');
  
  if (stats.brokenLinks > 0) {
    console.log(`🔗 Fix ${stats.brokenLinks} broken link(s) - Run: pnpm fix:cross-references`);
  }
  
  if (schemaPercentage < 80) {
    console.log(`📋 Improve schema compliance (${schemaPercentage}%) - Run: pnpm fix:documentation-schema`);
  }
  
  if (metadataPercentage < 50) {
    console.log(`📊 Add missing metadata (${metadataPercentage}%) - Run: pnpm fix:metadata-consistency`);
  }
  
  if (syncPercentage < 70) {
    console.log(`⚡ Improve repository sync (${syncPercentage}%) - Document missing services`);
  }
  
  return {
    qualityScore,
    linkIntegrityPercentage,
    schemaPercentage,
    metadataPercentage,
    syncPercentage,
    brokenLinksCount: stats.brokenLinks
  };
}

/**
 * 🚀 Main execution
 */
async function main() {
  const startTime = Date.now();
  
  try {
    // 1. Validate links (NEW!)
    const brokenLinks = await validateLinks();
    
    // 2. Analyze source code
    const sourceData = await analyzeSourceCode();
    
    // 3. Analyze documentation
    const docData = await analyzeDocumentation();
    
    // 4. Generate enhanced report
    const report = await generateEnhancedReport(sourceData, docData, brokenLinks);
    
    const duration = Date.now() - startTime;
    console.log(colorize(`\n✅ Enhanced validation completed in ${duration}ms`, 'green'));
    
    // Exit with error code if critical issues found
    if (stats.brokenLinks > 10 || report.qualityScore < 60) {
      console.log(colorize('\n❌ CRITICAL ISSUES DETECTED - Manual review required', 'red'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(colorize(`\n❌ Validation failed: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${__filename}`) {
  main();
}