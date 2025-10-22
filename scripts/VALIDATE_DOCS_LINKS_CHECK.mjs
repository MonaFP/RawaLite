#!/usr/bin/env node

/**
 * 🔗 QUICK LINK VALIDATOR
 * 
 * Simple, fast link validation for specific files
 * @version 1.0.0
 * @date 2025-10-20
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 🎨 Color utilities
const colors = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m', reset: '\x1b[0m', bold: '\x1b[1m'
};

function colorize(text, color) {
  return process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;
}

console.log(colorize('\n🔗 QUICK LINK VALIDATOR', 'bold'));
console.log('=========================');

async function validateFileLinks(filePath) {
  console.log(`\n📁 Checking: ${colorize(path.relative(rootDir, filePath), 'blue')}`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    
    // Find markdown links [text](path)
    const markdownLinks = [...content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)];
    
    const brokenLinks = [];
    let totalLinks = 0;
    
    for (const match of markdownLinks) {
      const [fullMatch, linkText, linkPath] = match;
      totalLinks++;
      
      // Skip external links (http/https)
      if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
        continue;
      }
      
      // Skip anchors
      if (linkPath.startsWith('#')) {
        continue;
      }
      
      // Resolve relative path
      let targetPath;
      if (linkPath.startsWith('../')) {
        targetPath = path.resolve(fileDir, linkPath);
      } else if (linkPath.startsWith('./')) {
        targetPath = path.resolve(fileDir, linkPath);
      } else if (!path.isAbsolute(linkPath)) {
        targetPath = path.resolve(fileDir, linkPath);
      } else {
        targetPath = linkPath;
      }
      
      // Check if target exists
      try {
        await fs.access(targetPath);
        console.log(`   ✅ ${linkText} -> ${linkPath}`);
      } catch (error) {
        brokenLinks.push({
          linkText,
          linkPath,
          resolvedPath: path.relative(rootDir, targetPath),
          fullMatch
        });
        console.log(`   ❌ ${colorize(linkText, 'red')} -> ${colorize(linkPath, 'yellow')}`);
        console.log(`      Resolved to: ${colorize(path.relative(rootDir, targetPath), 'red')}`);
      }
    }
    
    console.log(`\n📊 Summary: ${totalLinks} links total, ${brokenLinks.length} broken`);
    
    return {
      totalLinks,
      brokenLinks: brokenLinks.length,
      details: brokenLinks
    };
    
  } catch (error) {
    console.error(`❌ Cannot read file: ${error.message}`);
    return { totalLinks: 0, brokenLinks: 0, details: [] };
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  // Check copilot-instructions.md specifically
  const copilotInstructionsPath = path.join(rootDir, '.github', 'instructions', 'copilot-instructions.md');
  
  const result = await validateFileLinks(copilotInstructionsPath);
  
  const duration = Date.now() - startTime;
  
  console.log(colorize(`\n✅ Link validation completed in ${duration}ms`, 'green'));
  
  if (result.brokenLinks > 0) {
    console.log(colorize(`\n⚠️  Found ${result.brokenLinks} broken link(s) - needs fixing!`, 'yellow'));
    process.exit(1);
  } else {
    console.log(colorize('\n🎉 All links are valid!', 'green'));
  }
}

// Execute if run directly
if (import.meta.url === `file://${__filename}`) {
  main().catch(error => {
    console.error(colorize(`\n❌ Validation failed: ${error.message}`, 'red'));
    process.exit(1);
  });
}