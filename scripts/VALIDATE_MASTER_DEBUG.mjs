#!/usr/bin/env node

/**
 * 🎯 MASTER VALIDATION SCRIPT - DEBUG VERSION
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const srcDir = path.join(rootDir, 'src');

console.log('🎯 MASTER VALIDATION - DEBUG VERSION');
console.log('=====================================');
console.log(`📁 Root Dir: ${rootDir}`);
console.log(`📁 Docs Dir: ${docsDir}`);
console.log(`📁 Src Dir: ${srcDir}`);
console.log('');

async function testDirectoryAccess() {
  console.log('🔍 Testing directory access...');
  
  try {
    const docsExists = await fs.access(docsDir).then(() => true).catch(() => false);
    const srcExists = await fs.access(srcDir).then(() => true).catch(() => false);
    
    console.log(`📁 Docs directory exists: ${docsExists}`);
    console.log(`📁 Src directory exists: ${srcExists}`);
    
    if (docsExists) {
      const docsContents = await fs.readdir(docsDir);
      console.log(`📊 Docs contains ${docsContents.length} items: ${docsContents.slice(0, 5).join(', ')}${docsContents.length > 5 ? '...' : ''}`);
    }
    
    if (srcExists) {
      const srcContents = await fs.readdir(srcDir);
      console.log(`📊 Src contains ${srcContents.length} items: ${srcContents.slice(0, 5).join(', ')}${srcContents.length > 5 ? '...' : ''}`);
    }
    
  } catch (error) {
    console.error(`❌ Directory access error: ${error.message}`);
  }
}

async function testBasicScan() {
  console.log('\n🔍 Testing basic file scanning...');
  
  try {
    let mdCount = 0;
    let tsCount = 0;
    
    // Count markdown files in docs
    async function countFiles(dir, extensions) {
      let count = 0;
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.')) {
            count += await countFiles(fullPath, extensions);
          } else if (item.isFile()) {
            const ext = path.extname(item.name);
            if (extensions.includes(ext)) {
              count++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Cannot scan ${dir}: ${error.message}`);
      }
      
      return count;
    }
    
    mdCount = await countFiles(docsDir, ['.md']);
    tsCount = await countFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
    
    console.log(`📄 Found ${mdCount} markdown files in docs/`);
    console.log(`💻 Found ${tsCount} TypeScript/JavaScript files in src/`);
    
  } catch (error) {
    console.error(`❌ File scanning error: ${error.message}`);
  }
}

async function testServiceExtraction() {
  console.log('\n🔍 Testing service extraction...');
  
  try {
    const serviceFiles = [];
    
    async function findServices(dir) {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            await findServices(fullPath);
          } else if (item.isFile() && item.name.includes('Service') && item.name.endsWith('.ts')) {
            serviceFiles.push(path.relative(srcDir, fullPath));
          }
        }
      } catch (error) {
        console.warn(`⚠️ Cannot scan ${dir}: ${error.message}`);
      }
    }
    
    await findServices(srcDir);
    
    console.log(`🔧 Found ${serviceFiles.length} service files:`);
    serviceFiles.forEach(file => console.log(`   - ${file}`));
    
  } catch (error) {
    console.error(`❌ Service extraction error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting debug tests...\n');
  
  await testDirectoryAccess();
  await testBasicScan();
  await testServiceExtraction();
  
  console.log('\n✅ Debug tests completed successfully!');
  console.log('🎯 The main script should work with these directory structures.');
}

main().catch(error => {
  console.error(`💥 Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});