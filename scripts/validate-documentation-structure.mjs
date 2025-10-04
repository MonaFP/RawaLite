#!/usr/bin/env node

/**
 * Documentation Structure Validator
 * 
 * Validates that documentation follows the mandatory structure rules
 * defined in DOCUMENTATION-STRUCTURE-GUIDE.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color utilities for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;
}

// Expected folder structure
const EXPECTED_FOLDERS = {
  '00-meta': 'Meta-documentation, project management',
  '01-standards': 'Code standards, conventions, guidelines',
  '02-architecture': 'System design, architecture decisions',
  '03-development': 'Development workflows, debugging, setup',
  '04-testing': 'Testing strategies, test documentation',
  '05-database': 'Database design, migrations, schemas',
  '06-paths': 'Path management, file system access',
  '07-ipc': 'IPC communication patterns',
  '08-ui': 'User interface design, components',
  '09-pdf': 'PDF generation, document handling',
  '10-security': 'Security concepts, authentication',
  '11-deployment': 'Deployment, updates, distribution',
  '12-lessons': 'Lessons learned, retrospectives',
  '13-deprecated': 'Deprecated/obsolete content'
};

// Naming pattern rules
const NAMING_RULES = {
  'LESSONS-LEARNED': /^LESSONS-LEARNED-[a-z0-9-]+\.md$/,
  'INDEX': /^INDEX\.md$/,
  'IMPLEMENTATION-PLAN': /^IMPLEMENTATION-PLAN-[a-z0-9-]+\.md$/,
  'STATUS-OVERVIEW': /^STATUS-OVERVIEW\.md$/,
  'TROUBLESHOOTING': /^TROUBLESHOOTING-[a-z0-9-]+\.md$/
};

// Cross-reference patterns
const CROSS_REF_PATTERNS = [
  />\s*\*\*Related:\*\*\s*See\s*\[.*?\]\(.*?\)/,
  />\s*\*\*See also:\*\*\s*\[.*?\]\(.*?\)/,
  />\s*\*\*Prerequisites:\*\*\s*Read\s*\[.*?\]\(.*?\)/,
  />\s*\*\*Next Steps:\*\*\s*Continue\s*with\s*\[.*?\]\(.*?\)/
];

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.docsPath = path.join(__dirname, '..', 'docs');
  }

  // Main validation entry point
  async validate() {
    console.log(colorize('\n🔍 DOCUMENTATION STRUCTURE VALIDATION', 'bold'));
    console.log('==================================================');

    this.validateFolderStructure();
    this.validateIndexFiles();
    this.validateNamingConventions();
    this.validateCrossReferences();
    this.detectDuplicates();

    this.printSummary();
    return this.errors.length === 0;
  }

  // Validate folder structure matches expected
  validateFolderStructure() {
    console.log(colorize('\n[1/5] Validating folder structure...', 'blue'));

    const actualFolders = fs.readdirSync(this.docsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort();

    const expectedFolders = Object.keys(EXPECTED_FOLDERS);

    // Check for missing folders
    for (const expected of expectedFolders) {
      if (!actualFolders.includes(expected)) {
        this.errors.push(`Missing required folder: ${expected}`);
      }
    }

    // Check for unexpected folders
    for (const actual of actualFolders) {
      if (!expectedFolders.includes(actual)) {
        this.warnings.push(`Unexpected folder: ${actual} (not in standard structure)`);
      }
    }

    if (this.errors.length === 0) {
      console.log(colorize('   ✅ VALID: Folder structure complete', 'green'));
    }
  }

  // Validate INDEX.md files exist and are current
  validateIndexFiles() {
    console.log(colorize('\n[2/5] Validating INDEX.md files...', 'blue'));

    const folders = Object.keys(EXPECTED_FOLDERS);
    
    for (const folder of folders) {
      const indexPath = path.join(this.docsPath, folder, 'INDEX.md');
      
      if (!fs.existsSync(indexPath)) {
        this.errors.push(`Missing INDEX.md in ${folder}/`);
      } else {
        // Check if INDEX.md is recent (basic check)
        const stats = fs.statSync(indexPath);
        const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceModified > 30) {
          this.warnings.push(`INDEX.md in ${folder}/ is outdated (${Math.floor(daysSinceModified)} days old)`);
        }
      }
    }

    console.log(colorize(`   ✅ VALID: INDEX.md validation complete`, 'green'));
  }

  // Validate naming conventions
  validateNamingConventions() {
    console.log(colorize('\n[3/5] Validating naming conventions...', 'blue'));

    const violations = [];

    this.walkDirectory(this.docsPath, (filePath, fileName) => {
      // Skip non-markdown files
      if (!fileName.endsWith('.md')) return;

      // Check specific naming patterns
      if (fileName.startsWith('LESSONS-LEARNED-') && !NAMING_RULES['LESSONS-LEARNED'].test(fileName)) {
        violations.push(`${filePath}: Invalid LESSONS-LEARNED naming (use hyphens, lowercase)`);
      }

      if (fileName === 'Index.md' || fileName === 'index.md') {
        violations.push(`${filePath}: INDEX.md must be ALL CAPS`);
      }

      // Check for spaces in filenames
      if (fileName.includes(' ')) {
        violations.push(`${filePath}: Filename contains spaces (use hyphens)`);
      }

      // Check for underscores in new files
      if (fileName.includes('_') && !fileName.startsWith('lessons_learned')) {
        this.warnings.push(`${filePath}: Consider using hyphens instead of underscores`);
      }
    });

    if (violations.length > 0) {
      this.errors.push(...violations);
    } else {
      console.log(colorize('   ✅ VALID: Naming conventions followed', 'green'));
    }
  }

  // Validate cross-references are properly formatted
  validateCrossReferences() {
    console.log(colorize('\n[4/5] Validating cross-references...', 'blue'));

    let crossRefCount = 0;
    let brokenLinks = 0;

    this.walkDirectory(this.docsPath, (filePath, fileName) => {
      if (!fileName.endsWith('.md')) return;

      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for cross-reference patterns
      for (const pattern of CROSS_REF_PATTERNS) {
        const matches = content.match(new RegExp(pattern.source, 'g'));
        if (matches) {
          crossRefCount += matches.length;
        }
      }

      // Check for relative links and validate they exist
      const linkPattern = /\[.*?\]\((?!http)([^)]+)\)/g;
      let match;
      
      while ((match = linkPattern.exec(content)) !== null) {
        const linkPath = match[1];
        if (linkPath.startsWith('../')) {
          const absolutePath = path.resolve(path.dirname(filePath), linkPath);
          if (!fs.existsSync(absolutePath)) {
            this.warnings.push(`${filePath}: Broken link to ${linkPath}`);
            brokenLinks++;
          }
        }
      }
    });

    console.log(colorize(`   ✅ VALID: Found ${crossRefCount} cross-references, ${brokenLinks} broken links`, 
                        brokenLinks > 0 ? 'yellow' : 'green'));
  }

  // Detect duplicate content across folders
  detectDuplicates() {
    console.log(colorize('\n[5/5] Detecting duplicate files...', 'blue'));

    const fileHashes = new Map();
    const duplicates = [];

    this.walkDirectory(this.docsPath, (filePath, fileName) => {
      if (!fileName.endsWith('.md')) return;

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const normalizedContent = content
          .replace(/\r\n/g, '\n')
          .replace(/^\s+|\s+$/gm, '')
          .toLowerCase();

        if (fileHashes.has(normalizedContent)) {
          duplicates.push({
            original: fileHashes.get(normalizedContent),
            duplicate: filePath
          });
        } else {
          fileHashes.set(normalizedContent, filePath);
        }
      } catch (error) {
        this.warnings.push(`Could not read ${filePath}: ${error.message}`);
      }
    });

    if (duplicates.length > 0) {
      this.errors.push(...duplicates.map(d => 
        `Duplicate content: ${d.duplicate} matches ${d.original}`
      ));
    } else {
      console.log(colorize('   ✅ VALID: No duplicate files detected', 'green'));
    }
  }

  // Helper: Walk directory recursively
  walkDirectory(dir, callback) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        this.walkDirectory(fullPath, callback);
      } else {
        const relativePath = path.relative(this.docsPath, fullPath);
        callback(fullPath, item.name, relativePath);
      }
    }
  }

  // Print validation summary
  printSummary() {
    console.log('\n==================================================');
    console.log(colorize('📊 VALIDATION SUMMARY', 'bold'));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(colorize('   ✅ PERFECT: Documentation structure is compliant', 'green'));
      console.log(colorize('   Safe to proceed with build/release.', 'green'));
    } else {
      if (this.errors.length > 0) {
        console.log(colorize(`   ❌ ERRORS: ${this.errors.length} critical issues found`, 'red'));
        this.errors.forEach(error => {
          console.log(colorize(`      • ${error}`, 'red'));
        });
      }

      if (this.warnings.length > 0) {
        console.log(colorize(`   ⚠️  WARNINGS: ${this.warnings.length} minor issues found`, 'yellow'));
        this.warnings.forEach(warning => {
          console.log(colorize(`      • ${warning}`, 'yellow'));
        });
      }

      if (this.errors.length > 0) {
        console.log(colorize('\n   🚨 CANNOT PROCEED: Fix errors before continuing', 'red'));
      }
    }
    
    console.log('==================================================');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DocumentationValidator();
  
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(colorize(`Fatal error: ${error.message}`, 'red'));
    process.exit(1);
  });
}

export default DocumentationValidator;