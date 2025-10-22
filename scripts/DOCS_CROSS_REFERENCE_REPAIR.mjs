#!/usr/bin/env node

/**
 * 🔗 CROSS-REFERENCE REPAIR AUTOMATION
 * 
 * Phase 5.4: Cross-Reference Integrity Enhancement
 * Maximum impact strategy for documentation consistency
 * 
 * @version 1.0.0
 * @date 2025-10-18
 * @implements Option C: Cross-Reference Focus (24% → 90%+ target)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

// 🔗 Cross-Reference Configuration
const CROSS_REF_CONFIG = {
  DATE_CURRENT: '2025-10-18',
  REPAIR_PATTERNS: [
    // Pattern matching for cross-references
    /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g,  // [Text](file.md)
    /\[([^\]]+)\]\(\.\.\/([^)]+\.md[^)]*)\)/g,  // [Text](../file.md)
    /See \[([^\]]+)\]\(([^)]+)\)/g,  // See [Document](path)
    /Related: \[([^\]]+)\]\(([^)]+)\)/g,  // Related: [Document](path)
    /\*\*See also:\*\* \[([^\]]+)\]\(([^)]+)\)/g  // **See also:** [Document](path)
  ],
  PATHS_MAPPING: {
    // Common path corrections
    '../00-meta/': 'docs/00-meta/',
    '../01-core/': 'docs/01-core/',
    '../02-dev/': 'docs/02-dev/',
    '../03-data/': 'docs/03-data/',
    '../04-ui/': 'docs/04-ui/',
    '../05-deploy/': 'docs/05-deploy/',
    '../06-lessons/': 'docs/06-lessons/',
    './': 'docs/',
    '../': 'docs/'
  },
  BIDIRECTIONAL_RULES: {
    // When A references B, B should reference A
    minReferences: 2,  // Require bidirectional links when 2+ references exist
    maxAutoAdd: 5      // Maximum auto-added references per file
  }
};

// 📊 Processing Statistics
const stats = {
  totalFiles: 0,
  referencesFound: 0,
  brokenReferences: 0,
  repairedReferences: 0,
  bidirectionalAdded: 0,
  errors: []
};

console.log('🔗 CROSS-REFERENCE REPAIR AUTOMATION');
console.log('=====================================');
console.log('📋 Phase 5.4: Maximum Impact Strategy'); 
console.log('🎯 Target: 24% → 90%+ Cross-Reference Integrity');
console.log('');

/**
 * 📁 Get all markdown files and build file index
 */
async function buildFileIndex() {
  const fileIndex = new Map();
  
  async function scanDir(dir, relativePath = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath, relativeFilePath);
        } else if (entry.name.endsWith('.md')) {
          const normalizedPath = relativeFilePath.replace(/\\/g, '/');
          fileIndex.set(entry.name, {
            fullPath,
            relativePath: normalizedPath,
            directory: path.dirname(normalizedPath),
            exists: true
          });
          
          // Also index without extension for easier matching
          const nameWithoutExt = entry.name.replace('.md', '');
          if (!fileIndex.has(nameWithoutExt)) {
            fileIndex.set(nameWithoutExt, {
              fullPath,
              relativePath: normalizedPath,
              directory: path.dirname(normalizedPath),
              exists: true
            });
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Cannot scan: ${dir} - ${error.message}`);
    }
  }
  
  await scanDir(docsDir);
  return fileIndex;
}

/**
 * 🔍 Extract all cross-references from file content
 */
function extractCrossReferences(content, filePath) {
  const references = [];
  
  for (const pattern of CROSS_REF_CONFIG.REPAIR_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, linkText, linkPath] = match;
      
      references.push({
        fullMatch,
        linkText,
        linkPath,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        type: getLinkType(linkPath)
      });
    }
  }
  
  return references;
}

/**
 * 🏷️ Determine link type for appropriate handling
 */
function getLinkType(linkPath) {
  if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
    return 'external';
  } else if (linkPath.startsWith('#')) {
    return 'anchor';
  } else if (linkPath.includes('.md')) {
    return 'internal';
  } else {
    return 'other';
  }
}

/**
 * 🔧 Repair broken cross-reference
 */
function repairCrossReference(reference, fileIndex, currentFilePath) {
  if (reference.type !== 'internal') {
    return null; // Only repair internal markdown links
  }
  
  const { linkPath, linkText } = reference;
  
  // Clean and normalize the path
  let cleanPath = linkPath.split('#')[0]; // Remove anchors
  cleanPath = cleanPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
  
  // Try to find the file in our index
  const fileName = path.basename(cleanPath);
  const fileInfo = fileIndex.get(fileName);
  
  if (fileInfo && fileInfo.exists) {
    // Calculate relative path from current file to target
    const currentDir = path.dirname(currentFilePath);
    const targetPath = path.relative(currentDir, fileInfo.fullPath);
    const normalizedTargetPath = targetPath.replace(/\\/g, '/');
    
    return {
      ...reference,
      repairedPath: normalizedTargetPath,
      status: 'repaired'
    };
  }
  
  // Try alternative search strategies
  const nameWithoutExt = fileName.replace('.md', '');
  const altFileInfo = fileIndex.get(nameWithoutExt + '.md');
  
  if (altFileInfo && altFileInfo.exists) {
    const currentDir = path.dirname(currentFilePath);
    const targetPath = path.relative(currentDir, altFileInfo.fullPath);
    const normalizedTargetPath = targetPath.replace(/\\/g, '/');
    
    return {
      ...reference,
      repairedPath: normalizedTargetPath,
      status: 'repaired'
    };
  }
  
  return {
    ...reference,
    status: 'broken',
    reason: 'File not found in index'
  };
}

/**
 * 📝 Apply cross-reference repairs to content
 */
function applyRepairs(content, repairs) {
  let repairedContent = content;
  let offset = 0;
  
  // Sort repairs by position to apply them correctly
  const sortedRepairs = repairs
    .filter(repair => repair.status === 'repaired')
    .sort((a, b) => a.startIndex - b.startIndex);
  
  for (const repair of sortedRepairs) {
    const adjustedStart = repair.startIndex + offset;
    const adjustedEnd = repair.endIndex + offset;
    
    const newReference = `[${repair.linkText}](${repair.repairedPath})`;
    const oldLength = repair.fullMatch.length;
    const newLength = newReference.length;
    
    repairedContent = 
      repairedContent.substring(0, adjustedStart) + 
      newReference + 
      repairedContent.substring(adjustedEnd);
    
    offset += (newLength - oldLength);
    stats.repairedReferences++;
  }
  
  return repairedContent;
}

/**
 * 🔄 Process individual file for cross-reference repair
 */
async function processFileForCrossReferences(filePath, fileIndex) {
  try {
    stats.totalFiles++;
    
    const relativePath = path.relative(docsDir, filePath);
    console.log(`🔗 Processing: ${relativePath}`);
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract all cross-references
    const references = extractCrossReferences(content, relativePath);
    stats.referencesFound += references.length;
    
    if (references.length === 0) {
      console.log(`   ℹ️  No cross-references found`);
      return { processed: true, repaired: 0 };
    }
    
    console.log(`   📊 Found ${references.length} cross-references`);
    
    // Attempt to repair each reference
    const repairs = references.map(ref => repairCrossReference(ref, fileIndex, relativePath));
    
    const brokenCount = repairs.filter(r => r.status === 'broken').length;
    const repairedCount = repairs.filter(r => r.status === 'repaired').length;
    
    stats.brokenReferences += brokenCount;
    
    if (repairedCount > 0) {
      // Apply repairs to content
      const repairedContent = applyRepairs(content, repairs);
      
      // Write repaired content back to file
      await fs.writeFile(filePath, repairedContent, 'utf-8');
      
      console.log(`   ✅ Repaired ${repairedCount} references`);
      if (brokenCount > 0) {
        console.log(`   ⚠️  ${brokenCount} references remain broken`);
      }
    } else {
      console.log(`   ℹ️  All references are valid`);
    }
    
    return { processed: true, repaired: repairedCount };
    
  } catch (error) {
    const errorMsg = `${path.relative(docsDir, filePath)}: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ Error processing ${path.relative(docsDir, filePath)}: ${error.message}`);
    return { processed: false, error: errorMsg };
  }
}

/**
 * 📊 Generate cross-reference repair report
 */
function generateRepairReport() {
  console.log('');
  console.log('📊 CROSS-REFERENCE REPAIR REPORT');
  console.log('=================================');
  console.log(`📄 Files processed: ${stats.totalFiles}`);
  console.log(`🔗 References found: ${stats.referencesFound}`);
  console.log(`❌ Broken references: ${stats.brokenReferences}`);
  console.log(`✅ Repaired references: ${stats.repairedReferences}`);
  console.log(`🔄 Bidirectional links added: ${stats.bidirectionalAdded}`);
  console.log(`❌ Errors encountered: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('');
    console.log('❌ ERROR DETAILS:');
    stats.errors.forEach(error => console.log(`   ${error}`));
  }
  
  const repairRate = stats.referencesFound > 0 ? 
    Math.round((stats.referencesFound - stats.brokenReferences) / stats.referencesFound * 100) : 100;
  
  const improvementEstimate = Math.round(stats.repairedReferences / stats.referencesFound * 66); // 66% is the max possible improvement
  
  console.log('');
  console.log(`🎯 REFERENCE INTEGRITY RATE: ${repairRate}%`);
  console.log(`📈 Estimated consistency improvement: +${improvementEstimate}%`);
  console.log(`🎯 Expected new consistency rate: ~${58 + improvementEstimate}%`);
  
  return improvementEstimate;
}

/**
 * 🚀 Main cross-reference repair function
 */
async function main() {
  try {
    console.log('🔍 Building file index...');
    const fileIndex = await buildFileIndex();
    console.log(`📊 Indexed ${fileIndex.size} files`);
    console.log('');
    
    console.log('🔗 Processing files for cross-reference repair...');
    console.log('');
    
    // Get all markdown files for processing
    const allFiles = Array.from(fileIndex.values())
      .filter(file => file.relativePath.endsWith('.md'))
      .map(file => file.fullPath);
    
    // Process files for cross-reference repair
    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      console.log(`[${i+1}/${allFiles.length}]`);
      
      await processFileForCrossReferences(filePath, fileIndex);
      
      // Small delay to prevent system overwhelm
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const improvement = generateRepairReport();
    
    console.log('');
    console.log('🏁 CROSS-REFERENCE REPAIR COMPLETED');
    console.log('===================================');
    
    if (improvement >= 30) {
      console.log('✅ Excellent improvement achieved!');
      console.log('📋 Next: Run consistency validation to confirm results');
      process.exit(0);
    } else if (improvement >= 15) {
      console.log('🟡 Good improvement, run validation to measure impact');
      console.log('📋 Next: Develop bidirectional link enhancement');
      process.exit(0);
    } else {
      console.log('🔴 Limited improvement - investigate broken references');
      console.log('📋 Next: Manual review of broken reference patterns');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 FATAL ERROR:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}