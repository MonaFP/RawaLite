#!/usr/bin/env node

/**
 * 📊 DOCUMENTATION CONSISTENCY VALIDATION SUITE
 * 
 * Implementation von Phase 5: Quality Assurance des 100% Consistency Masterplans
 * Erweiterte Validation für nachhaltige Dokumentations-Qualitätssicherung
 * 
 * @version 1.0.0
 * @date 2025-10-18
 * @implements Phase 5.1 - Automated Validation Enhancement
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

// 🎯 Validation Results Storage
const results = {
  criticalFixes: { valid: 0, total: 0, details: [] },
  schemaCompliance: { valid: 0, total: 0, details: [] },
  crossReferences: { valid: 0, total: 0, details: [] },
  metadataConsistency: { valid: 0, total: 0, details: [] },
  themeSystemIntegration: { valid: 0, total: 0, details: [] },
  overallScore: 0
};

// 📋 Schema Patterns (from ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS)
const SCHEMA_PATTERNS = {
  ROOT_PREFIX: /^ROOT_VALIDATED_/,
  STANDARD_FORMAT: /^(ROOT_|VALIDATED_|SOLVED_|LESSON_|WIP_|COMPLETED_|PLAN_|DEPRECATED_)(GUIDE|FIX|IMPL|REPORT|REGISTRY|TEMPLATE|TRACKING|PLAN)-[A-Z0-9-]+_\d{4}-\d{2}-\d{2}\.md$/,
  DATE_HEADER: />\s*\*\*Erstellt:\*\*\s+\d{2}\.\d{2}\.\d{4}.*\*\*Letzte Aktualisierung:\*\*\s+\d{2}\.\d{2}\.\d{4}/,
  STATUS_PREFIXES: ['ROOT_', 'VALIDATED_', 'SOLVED_', 'LESSON_', 'WIP_', 'COMPLETED_', 'PLAN_', 'DEPRECATED_'],
  TYPE_CATEGORIES: ['GUIDE-', 'FIX-', 'IMPL-', 'REPORT-', 'REGISTRY-', 'TEMPLATE-', 'TRACKING-', 'PLAN-']
};

// 🔗 Cross-Reference Patterns
const CROSS_REF_PATTERNS = {
  INTERNAL_LINK: /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g,
  ROOT_REFERENCE: /ROOT_VALIDATED_[A-Z-]+_\d{4}-\d{2}-\d{2}\.md/g,
  THEME_SYSTEM_REF: /(Database-Theme-System|THEME-SYSTEM|theme-system)/gi
};

// 🎨 Theme System Integration Points
const THEME_INTEGRATION_REQUIREMENTS = {
  ROOT_DOCS: [
    'ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md',
    'ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md'
  ],
  REQUIRED_PATTERNS: [
    'DatabaseThemeService',
    'Migration 027',
    'theme_colors',
    'user_theme_preferences'
  ]
};

console.log('🔍 DOCUMENTATION CONSISTENCY VALIDATION SUITE');
console.log('==================================================');
console.log('📋 Phase 5: Quality Assurance Implementation');
console.log('🎯 Target: 95% Documentation Consistency');
console.log('');

/**
 * 📁 Get all markdown files recursively
 */
async function getAllMarkdownFiles(dir) {
  const files = [];
  
  async function scanDirectory(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name.endsWith('.md')) {
          const relativePath = path.relative(rootDir, fullPath);
          files.push({ name: entry.name, path: fullPath, relativePath });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan directory: ${currentDir}`);
    }
  }
  
  await scanDirectory(dir);
  return files;
}

/**
 * 🛡️ Validate Critical Fixes Integration
 */
async function validateCriticalFixesIntegration() {
  console.log('[🛡️ ] Critical Fixes Integration');
  
  try {
    const criticalFixesPath = path.join(docsDir, 'ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md');
    const content = await fs.readFile(criticalFixesPath, 'utf-8');
    
    // Check for Database-Theme-System patterns (FIX-016, FIX-017, FIX-018)
    const themePatterns = [
      'FIX-016: Database-Theme-System Schema Protection',
      'FIX-017: Migration 027 Theme System Integrity', 
      'FIX-018: DatabaseThemeService Pattern Preservation'
    ];
    
    let foundPatterns = 0;
    const missingPatterns = [];
    
    for (const pattern of themePatterns) {
      if (content.includes(pattern)) {
        foundPatterns++;
        results.criticalFixes.details.push(`✅ Found: ${pattern}`);
      } else {
        missingPatterns.push(pattern);
        results.criticalFixes.details.push(`❌ Missing: ${pattern}`);
      }
    }
    
    results.criticalFixes.valid = foundPatterns;
    results.criticalFixes.total = themePatterns.length;
    
    console.log(`   ✅ Theme patterns found: ${foundPatterns}/${themePatterns.length}`);
    if (missingPatterns.length > 0) {
      console.log(`   ❌ Missing patterns: ${missingPatterns.join(', ')}`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: Could not validate critical fixes: ${error.message}`);
    results.criticalFixes.details.push(`ERROR: ${error.message}`);
  }
}

/**
 * 📋 Validate Schema Compliance (Enhanced)
 */
async function validateSchemaCompliance() {
  console.log('[📋] Schema Compliance Validation (Enhanced)');
  
  const files = await getAllMarkdownFiles(docsDir);
  let compliantFiles = 0;
  const schemaViolations = [];
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      let isCompliant = true;
      const issues = [];
      
      // Special handling for specific files that are allowed
      const isSpecialFile = ['INDEX.md', 'README.md', 'PATHS.md'].includes(file.name) || 
                          file.name.startsWith('ROOT_VALIDATED_');
      
      // Check filename format for regular files
      if (!isSpecialFile && !SCHEMA_PATTERNS.STANDARD_FORMAT.test(file.name)) {
        isCompliant = false;
        issues.push('Non-compliant filename format');
        
        // Analyze specific violations
        const hasValidPrefix = SCHEMA_PATTERNS.STATUS_PREFIXES.some(prefix => 
          file.name.startsWith(prefix)
        );
        const hasValidType = SCHEMA_PATTERNS.TYPE_CATEGORIES.some(type => 
          file.name.includes(type)
        );
        const hasValidDate = /\d{4}-\d{2}-\d{2}\.md$/.test(file.name);
        
        if (!hasValidPrefix) issues.push('Missing valid STATUS prefix (VALIDATED_, SOLVED_, etc.)');
        if (!hasValidType) issues.push('Missing valid TYPE category (GUIDE-, FIX-, IMPL-, etc.)');
        if (!hasValidDate) issues.push('Missing valid date format (YYYY-MM-DD.md)');
      }
      
      // Check date header (skip for INDEX.md files)
      if (!file.name.includes('INDEX.md') && !SCHEMA_PATTERNS.DATE_HEADER.test(content)) {
        isCompliant = false;
        issues.push('Missing or invalid date header');
      }
      
      // Check for current project date consistency
      if (!content.includes('2025-10-') && !isSpecialFile) {
        issues.push('Document not updated to current date range (2025-10-xx)');
      }
      
      if (isCompliant) {
        compliantFiles++;
        results.schemaCompliance.details.push(`✅ ${file.relativePath}`);
      } else {
        schemaViolations.push({
          file: file.relativePath,
          issues: issues
        });
        results.schemaCompliance.details.push(`❌ ${file.relativePath}: ${issues.join(', ')}`);
      }
      
    } catch (error) {
      results.schemaCompliance.details.push(`ERROR ${file.relativePath}: ${error.message}`);
    }
  }
  
  results.schemaCompliance.valid = compliantFiles;
  results.schemaCompliance.total = files.length;
  results.schemaCompliance.violations = schemaViolations;
  
  const percentage = Math.round(compliantFiles/files.length*100);
  console.log(`   ✅ Compliant files: ${compliantFiles}/${files.length} (${percentage}%)`);
  
  // Report top schema violations
  if (schemaViolations.length > 0) {
    console.log(`   ❌ SCHEMA VIOLATIONS: ${schemaViolations.length}`);
    schemaViolations.slice(0, 3).forEach((violation, index) => {
      console.log(`      ${index + 1}. ${violation.file}`);
      violation.issues.forEach(issue => console.log(`         - ${issue}`));
    });
    if (schemaViolations.length > 3) {
      console.log(`      ... and ${schemaViolations.length - 3} more (see detailed report)`);
    }
  }
}

/**
 * 🔗 Validate Cross References (Enhanced with Full Repository Scan)
 */
async function validateCrossReferences() {
  console.log('[🔗] Cross-Reference Integrity Validation (Enhanced)');
  
  // Get ALL markdown files from entire repository
  const allFiles = await getAllMarkdownFiles(rootDir);
  const docsFiles = await getAllMarkdownFiles(docsDir);
  
  let validReferences = 0;
  let totalReferences = 0;
  const brokenLinks = [];
  
  for (const file of allFiles) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      let match;
      
      // Find all internal markdown links
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = linkPattern.exec(content)) !== null) {
        totalReferences++;
        const [fullMatch, linkText, linkPath] = match;
        
        // Skip external links (http/https) and pure anchors
        if (linkPath.startsWith('http://') || linkPath.startsWith('https://') || linkPath.startsWith('#')) {
          validReferences++;
          continue;
        }
        
        // Resolve relative link path
        let targetPath;
        if (linkPath.startsWith('../') || linkPath.startsWith('./')) {
          targetPath = path.resolve(path.dirname(file.path), linkPath);
        } else if (!path.isAbsolute(linkPath)) {
          targetPath = path.resolve(path.dirname(file.path), linkPath);
        } else {
          targetPath = linkPath;
        }
        
        // Remove anchor fragments for file existence check
        const cleanPath = targetPath.split('#')[0];
        
        try {
          await fs.access(cleanPath);
          validReferences++;
          results.crossReferences.details.push(`✅ ${file.relativePath} → ${linkPath}`);
        } catch {
          brokenLinks.push({
            file: file.relativePath,
            linkText,
            linkPath,
            resolvedPath: path.relative(rootDir, cleanPath),
            fullMatch
          });
          results.crossReferences.details.push(`❌ ${file.relativePath} → ${linkPath} (BROKEN: ${path.relative(rootDir, cleanPath)})`);
        }
      }
    } catch (error) {
      results.crossReferences.details.push(`ERROR ${file.relativePath}: ${error.message}`);
    }
  }
  
  results.crossReferences.valid = validReferences;
  results.crossReferences.total = totalReferences;
  results.crossReferences.brokenLinks = brokenLinks;
  
  const percentage = totalReferences > 0 ? Math.round(validReferences/totalReferences*100) : 100;
  console.log(`   ✅ Valid references: ${validReferences}/${totalReferences} (${percentage}%)`);
  
  // Report broken links with details
  if (brokenLinks.length > 0) {
    console.log(`   ❌ BROKEN LINKS FOUND: ${brokenLinks.length}`);
    brokenLinks.slice(0, 5).forEach((link, index) => {
      console.log(`      ${index + 1}. ${link.file}: "${link.linkText}" → ${link.linkPath}`);
      console.log(`         Resolved to: ${link.resolvedPath}`);
    });
    if (brokenLinks.length > 5) {
      console.log(`      ... and ${brokenLinks.length - 5} more (see detailed report)`);
    }
  }
}

/**
 * 📊 Validate Metadata Consistency
 */
async function validateMetadataConsistency() {
  console.log('[📊] Metadata Consistency Validation');
  
  const files = await getAllMarkdownFiles(docsDir);
  let consistentFiles = 0;
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      let isConsistent = true;
      const issues = [];
      
      // Skip INDEX files for metadata requirements
      if (file.name === 'INDEX.md') {
        consistentFiles++;
        continue;
      }
      
      // Check for proper status prefix
      const hasValidPrefix = SCHEMA_PATTERNS.STATUS_PREFIXES.some(prefix => 
        file.name.startsWith(prefix)
      );
      
      if (!hasValidPrefix && !file.name.startsWith('ROOT_')) {
        isConsistent = false;
        issues.push('Missing valid status prefix');
      }
      
      // Check for date header
      if (!SCHEMA_PATTERNS.DATE_HEADER.test(content)) {
        isConsistent = false;
        issues.push('Missing standardized date header');
      }
      
      // Check for current date (2025-10-18)
      if (!content.includes('2025-10-18')) {
        issues.push('Not updated to current date');
      }
      
      if (isConsistent) {
        consistentFiles++;
        results.metadataConsistency.details.push(`✅ ${file.relativePath}`);
      } else {
        results.metadataConsistency.details.push(`❌ ${file.relativePath}: ${issues.join(', ')}`);
      }
      
    } catch (error) {
      results.metadataConsistency.details.push(`ERROR ${file.relativePath}: ${error.message}`);
    }
  }
  
  results.metadataConsistency.valid = consistentFiles;
  results.metadataConsistency.total = files.length;
  
  console.log(`   ✅ Consistent metadata: ${consistentFiles}/${files.length} (${Math.round(consistentFiles/files.length*100)}%)`);
}

/**
 * 🎨 Validate Theme System Integration
 */
async function validateThemeSystemIntegration() {
  console.log('[🎨] Theme System Integration Validation');
  
  let integrationScore = 0;
  let totalChecks = 0;
  
  // Check ROOT documents for theme system references
  for (const rootDoc of THEME_INTEGRATION_REQUIREMENTS.ROOT_DOCS) {
    totalChecks++;
    try {
      const rootPath = path.join(docsDir, rootDoc);
      const content = await fs.readFile(rootPath, 'utf-8');
      
      const hasThemeReferences = THEME_INTEGRATION_REQUIREMENTS.REQUIRED_PATTERNS.some(pattern =>
        content.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (hasThemeReferences) {
        integrationScore++;
        results.themeSystemIntegration.details.push(`✅ ${rootDoc}: Theme system integrated`);
      } else {
        results.themeSystemIntegration.details.push(`❌ ${rootDoc}: Missing theme system references`);
      }
      
    } catch (error) {
      results.themeSystemIntegration.details.push(`ERROR ${rootDoc}: ${error.message}`);
    }
  }
  
  // Check for theme development guidelines in KI Instructions
  totalChecks++;
  try {
    const kiInstructionsPath = path.join(docsDir, 'ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md');
    const content = await fs.readFile(kiInstructionsPath, 'utf-8');
    
    if (content.includes('THEME SYSTEM DEVELOPMENT RULES')) {
      integrationScore++;
      results.themeSystemIntegration.details.push('✅ KI Instructions: Theme development rules present');
    } else {
      results.themeSystemIntegration.details.push('❌ KI Instructions: Missing theme development rules');
    }
  } catch (error) {
    results.themeSystemIntegration.details.push(`ERROR KI Instructions: ${error.message}`);
  }
  
  results.themeSystemIntegration.valid = integrationScore;
  results.themeSystemIntegration.total = totalChecks;
  
  console.log(`   ✅ Theme integration: ${integrationScore}/${totalChecks} (${Math.round(integrationScore/totalChecks*100)}%)`);
}

/**
 * 📊 Calculate Overall Consistency Score
 */
function calculateOverallScore() {
  const weights = {
    criticalFixes: 0.25,      // 25% - Critical for system stability
    schemaCompliance: 0.20,   // 20% - Important for maintainability  
    crossReferences: 0.20,    // 20% - Important for navigation
    metadataConsistency: 0.15, // 15% - Important for organization
    themeSystemIntegration: 0.20 // 20% - Critical for current feature set
  };
  
  let weightedScore = 0;
  
  for (const [category, weight] of Object.entries(weights)) {
    const categoryScore = results[category].total > 0 ? 
      (results[category].valid / results[category].total) : 1;
    weightedScore += categoryScore * weight;
  }
  
  results.overallScore = Math.round(weightedScore * 100);
  
  console.log('');
  console.log('📊 CONSISTENCY SCORE BREAKDOWN');
  console.log('==================================================');
  console.log(`🛡️  Critical Fixes:       ${results.criticalFixes.valid}/${results.criticalFixes.total} (${Math.round(results.criticalFixes.valid/results.criticalFixes.total*100)}%) [Weight: 25%]`);
  console.log(`📋 Schema Compliance:     ${results.schemaCompliance.valid}/${results.schemaCompliance.total} (${Math.round(results.schemaCompliance.valid/results.schemaCompliance.total*100)}%) [Weight: 20%]`);
  console.log(`🔗 Cross References:      ${results.crossReferences.valid}/${results.crossReferences.total} (${Math.round(results.crossReferences.valid/results.crossReferences.total*100)}%) [Weight: 20%]`);
  console.log(`📊 Metadata Consistency:  ${results.metadataConsistency.valid}/${results.metadataConsistency.total} (${Math.round(results.metadataConsistency.valid/results.metadataConsistency.total*100)}%) [Weight: 15%]`);
  console.log(`🎨 Theme Integration:     ${results.themeSystemIntegration.valid}/${results.themeSystemIntegration.total} (${Math.round(results.themeSystemIntegration.valid/results.themeSystemIntegration.total*100)}%) [Weight: 20%]`);
  console.log('');
  console.log(`🎯 OVERALL CONSISTENCY SCORE: ${results.overallScore}%`);
  
  // Phase 5 target assessment
  const phase5Target = 95;
  if (results.overallScore >= phase5Target) {
    console.log(`✅ PHASE 5 TARGET ACHIEVED! (Target: ${phase5Target}%)`);
  } else {
    console.log(`🎯 Phase 5 Progress: ${results.overallScore}%/${phase5Target}% (${phase5Target - results.overallScore}% remaining)`);
  }
}

/**
 * 💾 Save detailed results
 */
async function saveDetailedResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(rootDir, 'tests', `documentation-consistency-report-${timestamp}.json`);
  
  try {
    // Ensure tests directory exists
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    
    const detailedResults = {
      timestamp: new Date().toISOString(),
      date: '2025-10-18',
      phase: 'Phase 5: Quality Assurance',
      overallScore: results.overallScore,
      targetScore: 95,
      categories: results,
      summary: {
        criticalFixes: `${results.criticalFixes.valid}/${results.criticalFixes.total}`,
        schemaCompliance: `${results.schemaCompliance.valid}/${results.schemaCompliance.total}`,
        crossReferences: `${results.crossReferences.valid}/${results.crossReferences.total}`,
        metadataConsistency: `${results.metadataConsistency.valid}/${results.metadataConsistency.total}`,
        themeSystemIntegration: `${results.themeSystemIntegration.valid}/${results.themeSystemIntegration.total}`
      }
    };
    
    await fs.writeFile(resultsPath, JSON.stringify(detailedResults, null, 2));
    console.log(`💾 Detailed results saved: ${resultsPath}`);
    
  } catch (error) {
    console.warn(`⚠️  Could not save detailed results: ${error.message}`);
  }
}

/**
 * 🚀 Main execution
 */
async function main() {
  try {
    await validateCriticalFixesIntegration();
    await validateSchemaCompliance();
    await validateCrossReferences();
    await validateMetadataConsistency();
    await validateThemeSystemIntegration();
    
    calculateOverallScore();
    await saveDetailedResults();
    
    console.log('');
    console.log('🏁 VALIDATION COMPLETED');
    console.log('==================================================');
    
    // Exit code based on results
    if (results.overallScore >= 90) {
      console.log('✅ Excellent documentation consistency achieved!');
      process.exit(0);
    } else if (results.overallScore >= 75) {
      console.log('🟡 Good documentation consistency, room for improvement.');
      process.exit(0);
    } else {
      console.log('🔴 Documentation consistency needs attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 FATAL ERROR during validation:', error);
    process.exit(1);
  }
}

// Execute validation suite
main();